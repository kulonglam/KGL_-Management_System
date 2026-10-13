import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../app.js';
import User from '../models/User.js';

const installedMongod = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
if (!process.env.MONGOMS_SYSTEM_BINARY && existsSync(installedMongod)) {
  process.env.MONGOMS_SYSTEM_BINARY = installedMongod;
  process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
}

let memoryServer;

before(
  async () => {
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    mongoose.set('sanitizeFilter', true);
  },
  { timeout: 120_000 }
);

after(async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});

const failLogin = (app, username) =>
  request(app).post('/api/v1/auth/login').send({ username, password: 'WrongPassword1!' });

test('concurrent failures lock the account once the threshold is crossed', { timeout: 60_000 }, async () => {
  const app = createApp();
  const username = 'lock-burst';
  await User.create({
    name: 'Lock Burst',
    username,
    password: await bcrypt.hash('Unique@Launch2026', 4),
    role: 'manager',
    branch: 'Maganjo',
    loginAttempts: 0,
    lockUntil: null
  });

  const responses = await Promise.all(Array.from({ length: 8 }, () => failLogin(app, username)));
  for (const response of responses) {
    assert.equal(response.status, 401);
  }

  const stored = await User.findOne({ username }).lean();
  assert.ok(stored.lockUntil > new Date(), 'the account should be locked');
  assert.equal(stored.loginAttempts, 0);

  const duringLock = await failLogin(app, username);
  assert.equal(duringLock.status, 401);
  const stillLocked = await User.findOne({ username }).lean();
  assert.equal(stillLocked.loginAttempts, 0);
});
