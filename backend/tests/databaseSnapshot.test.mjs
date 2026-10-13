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
import { backupDatabase, restoreDatabase } from '../services/databaseSnapshot.js';

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

  await User.collection.deleteMany({});
  await PriceHistory.collection.deleteMany({});
  assert.equal(await User.countDocuments(), 0);

  await restoreDatabase(backupDir);
  const restoredUser = await User.findById(user._id).lean();
  const restoredHistory = await PriceHistory.findById(history._id).lean();
  assert.equal(restoredUser.username, 'amina-backup');
  assert.equal(restoredHistory.nextPriceUgx, 35000);
});
