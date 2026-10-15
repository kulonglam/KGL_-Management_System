import crypto from 'node:crypto';

// National IDs at rest: AES-256-GCM ciphertext in `nationalId`, plus an HMAC blind index in
// `nationalIdHash` for uniqueness and exact-match lookups. Without NIN_ENCRYPTION_KEY values
// stay plaintext (development) and the index uses a fixed, non-secret key until migrated.

const ENCRYPTED_PREFIX = 'enc:v1:';
const NIN_PATTERN = /^(CM|CF)[0-9]{12}$/;
const UNKEYED_INDEX_KEY = Buffer.from('kgl-nin-index-unkeyed');

const parseNinKey = (raw) => {
  const text = String(raw || '').trim();
  if (!text) return null;
  if (/^[0-9a-f]{64}$/i.test(text)) return Buffer.from(text, 'hex');
  if (/^[A-Za-z0-9+/]{43}=?$/.test(text)) {
    const decoded = Buffer.from(text, 'base64');
    if (decoded.length === 32) return decoded;
  }
  return null;
};

let keyCache = { raw: undefined, keys: null };

const derivedKeys = () => {
  const raw = String(process.env.NIN_ENCRYPTION_KEY || '').trim();
  if (keyCache.raw === raw) return keyCache.keys;
  const master = parseNinKey(raw);
  const keys = master
    ? {
        encrypt: Buffer.from(crypto.hkdfSync('sha256', master, Buffer.alloc(0), 'kgl-nin-encrypt', 32)),
        index: Buffer.from(crypto.hkdfSync('sha256', master, Buffer.alloc(0), 'kgl-nin-index', 32))
      }
    : null;
  keyCache = { raw, keys };
  return keys;
};

const isFieldEncryptionEnabled = () => Boolean(derivedKeys());

const isEncryptedValue = (value) => typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX);

const normalizeNin = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase();

const encryptField = (plain) => {
  const keys = derivedKeys();
  if (!keys || plain == null || plain === '' || isEncryptedValue(plain)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keys.encrypt, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
};

// Returns plaintext, or the stored value unchanged when it cannot be decrypted.
const decryptField = (value) => {
  if (!isEncryptedValue(value)) return value;
  const keys = derivedKeys();
  if (!keys) return value;
  const [ivText, tagText, dataText] = value.slice(ENCRYPTED_PREFIX.length).split(':');
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', keys.encrypt, Buffer.from(ivText, 'base64'));
    decipher.setAuthTag(Buffer.from(tagText, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(dataText, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return value;
  }
};

const blindIndex = (plain) => {
  const normalized = normalizeNin(plain);
  if (!normalized) return null;
  const key = derivedKeys()?.index || UNKEYED_INDEX_KEY;
  return crypto.createHmac('sha256', key).update(normalized).digest('hex');
};

// Filter clause matching a NIN by blind index, with a plaintext fallback for unmigrated rows.
const nationalIdMatch = (value) => {
  const plain = normalizeNin(value);
  return { $or: [{ nationalIdHash: blindIndex(plain) }, { nationalId: plain }] };
};

// Exact NIN searches only: ciphertext cannot be prefix-matched.
const appendNationalIdSearch = (filter, search) => {
  const plain = normalizeNin(search);
  if (!NIN_PATTERN.test(plain)) return filter;
  return { ...filter, $or: [...(filter.$or || []), ...nationalIdMatch(plain).$or] };
};

const decryptLeanRows = (result) => {
  const rows = Array.isArray(result) ? result : result ? [result] : [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    if (isEncryptedValue(row.nationalId)) row.nationalId = decryptField(row.nationalId);
    delete row.nationalIdHash;
  }
};

const encryptUpdate = (update) => {
  if (!update || typeof update !== 'object') return;
  for (const target of [update, update.$set]) {
    if (!target || typeof target.nationalId !== 'string' || isEncryptedValue(target.nationalId)) continue;
    const plain = normalizeNin(target.nationalId);
    target.nationalIdHash = blindIndex(plain);
    target.nationalId = encryptField(plain);
  }
};

const encryptedNationalIdPlugin = (schema) => {
  schema.add({ nationalIdHash: { type: String, default: null } });
  const existingToJson = schema.get('toJSON') || {};
  schema.set('toJSON', {
    ...existingToJson,
    transform(doc, ret, options) {
      const out =
        typeof existingToJson.transform === 'function' ? existingToJson.transform(doc, ret, options) : ret;
      if (out && typeof out === 'object') delete out.nationalIdHash;
      return out;
    }
  });
  schema
    .path('nationalId')
    .validate(
      (value) => isEncryptedValue(value) || NIN_PATTERN.test(String(value || '')),
      'nationalId must be a valid NIN'
    );

  schema.pre('validate', function normalizeNationalId() {
    if (!this.isNew && !this.isModified('nationalId')) return;
    const raw = this.get('nationalId');
    if (isEncryptedValue(raw)) return;
    const plain = normalizeNin(raw);
    this.set('nationalId', plain);
    this.nationalIdHash = blindIndex(plain);
  });

  // Runs after validation, so validators see plaintext and only ciphertext is written.
  schema.pre('save', function encryptNationalId() {
    if (!this.isNew && !this.isModified('nationalId')) return;
    const plain = this.get('nationalId');
    if (isEncryptedValue(plain) || !isFieldEncryptionEnabled()) return;
    this.$locals.nationalIdPlain = plain;
    this.set('nationalId', encryptField(plain));
  });

  schema.post('save', function restorePlainNationalId() {
    if (this.$locals.nationalIdPlain) {
      this._doc.nationalId = this.$locals.nationalIdPlain;
      delete this.$locals.nationalIdPlain;
    }
  });

  // Writing straight to _doc keeps the decrypted value out of change tracking.
  schema.post('init', function decryptNationalId() {
    if (isEncryptedValue(this._doc?.nationalId)) {
      this._doc.nationalId = decryptField(this._doc.nationalId);
    }
  });

  const rewriteFilter = function rewriteNationalIdFilter() {
    const filter = this.getQuery();
    if (typeof filter.nationalId !== 'string') return;
    const value = filter.nationalId;
    delete filter.nationalId;
    this.setQuery(filter);
    this.and([nationalIdMatch(value)]);
  };
  const filterOps = [
    'find',
    'findOne',
    'countDocuments',
    'findOneAndUpdate',
    'findOneAndDelete',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany'
  ];
  schema.pre(filterOps, { document: false, query: true }, rewriteFilter);

  schema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], { document: false, query: true }, function () {
    encryptUpdate(this.getUpdate());
  });

  schema.post(['find', 'findOne', 'findOneAndUpdate'], function decryptLean(result) {
    if (this._mongooseOptions?.lean) decryptLeanRows(result);
  });
};

export {
  NIN_PATTERN,
  appendNationalIdSearch,
  blindIndex,
  decryptField,
  decryptLeanRows,
  encryptField,
  encryptedNationalIdPlugin,
  isEncryptedValue,
  isFieldEncryptionEnabled,
  nationalIdMatch,
  normalizeNin,
  parseNinKey
};
