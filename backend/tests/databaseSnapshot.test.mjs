import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import PriceHistory from '../models/PriceHistory.js';
import User from '../models/User.js';
import { backupDatabase, materializeBackup, publishBackup, restoreDatabase } from '../services/databaseSnapshot.js';
import { allowAppendOnlyNativeWrite } from '../utils/appendOnly.js';

const installedMongod = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
if (!process.env.MONGOMS_SYSTEM_BINARY && existsSync(installedMongod)) {
  process.env.MONGOMS_SYSTEM_BINARY = installedMongod;
  process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
}

let memoryServer;
let backupDir;

before(
  async () => {
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    backupDir = await mkdtemp(path.join(tmpdir(), 'kgl-backup-'));
  },
  { timeout: 120_000 }
);

after(async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
  if (backupDir) await rm(backupDir, { recursive: true, force: true });
});

test('a snapshot restores users and price history after they are removed', { timeout: 60_000 }, async () => {
  const user = await User.create({
    name: 'Amina',
    username: 'amina-backup',
    password: 'hashed-password',
    role: 'manager',
    branch: 'Maganjo'
  });
  const history = await PriceHistory.create({
    branch: 'Maganjo',
    priceSettingId: new mongoose.Types.ObjectId(),
    action: 'create',
    nextProduceType: 'Beans',
    nextPriceUgx: 35000,
    changedBy: user._id
  });

  const manifest = await backupDatabase(backupDir);
  assert.ok(manifest.collections.some((entry) => entry.model === 'User' && entry.count === 1));

  const previousEnv = process.env.NODE_ENV;
  const previousUrl = process.env.BACKUP_UPLOAD_URL;
  const previousToken = process.env.BACKUP_UPLOAD_TOKEN;
  let uploaded;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.BACKUP_UPLOAD_URL;
    await assert.rejects(() => publishBackup(backupDir), /BACKUP_UPLOAD_URL/);
    process.env.BACKUP_UPLOAD_URL = 'http://backups.example.com/kgl';
    await assert.rejects(() => publishBackup(backupDir), /https/);

    process.env.BACKUP_UPLOAD_URL = 'https://backups.example.com/kgl';
    process.env.BACKUP_UPLOAD_TOKEN = 'secret-token';
    await publishBackup(backupDir, async (url, options) => {
      assert.equal(url, 'https://backups.example.com/kgl');
      assert.equal(options.method, 'PUT');
      assert.equal(options.headers.Authorization, 'Bearer secret-token');
      uploaded = JSON.parse(options.body);
      return { ok: true, status: 200 };
    });
  } finally {
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    if (previousUrl === undefined) delete process.env.BACKUP_UPLOAD_URL;
    else process.env.BACKUP_UPLOAD_URL = previousUrl;
    if (previousToken === undefined) delete process.env.BACKUP_UPLOAD_TOKEN;
    else process.env.BACKUP_UPLOAD_TOKEN = previousToken;
  }

  await rm(backupDir, { recursive: true, force: true });
  const copyDir = await mkdtemp(path.join(tmpdir(), 'kgl-backup-copy-'));
  await materializeBackup(uploaded, copyDir);

  await User.collection.deleteMany({});
  await allowAppendOnlyNativeWrite(() => PriceHistory.collection.deleteMany({}));
  assert.equal(await User.countDocuments(), 0);
  assert.equal(await PriceHistory.countDocuments(), 0);

  await restoreDatabase(copyDir);
  await rm(copyDir, { recursive: true, force: true });
  const restoredUser = await User.findById(user._id).lean();
  const restoredHistory = await PriceHistory.findById(history._id).lean();
  assert.equal(restoredUser.username, 'amina-backup');
  assert.equal(restoredHistory.nextPriceUgx, 35000);
});
