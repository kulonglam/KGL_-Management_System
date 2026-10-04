import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const encodeBase32 = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

const decodeBase32 = (value) => {
  const normalized = String(value || '')
    .toUpperCase()
    .replace(/=+$/g, '')
    .replace(/\s+/g, '');
  let bits = 0;
  let current = 0;
  const bytes = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) continue;
    current = (current << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((current >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const generateTotpSecret = () => encodeBase32(randomBytes(20));

const generateTotpCode = (secret, counter) => {
  const key = decodeBase32(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter & 0xffffffff, 4);
  const digest = createHmac('sha1', key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
};

const verifyTotpCode = (secret, token, window = 1) => {
  const code = String(token || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code) || !secret) {
    return false;
  }

  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = generateTotpCode(secret, counter + offset);
    const left = Buffer.from(expected);
    const right = Buffer.from(code);
    if (left.length === right.length && timingSafeEqual(left, right)) {
      return true;
    }
  }

  return false;
};

const buildOtpAuthUri = ({ username, secret, issuer = 'Karibu Groceries LTD' }) => {
  const label = encodeURIComponent(`${issuer}:${username}`);
  const issuerParam = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuerParam}&digits=6&period=30`;
};

export { buildOtpAuthUri, generateTotpCode, generateTotpSecret, verifyTotpCode };
