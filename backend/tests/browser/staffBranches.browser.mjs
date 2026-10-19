process.env.NODE_ENV = 'test';
process.env.COOKIE_SAMESITE = 'lax';
process.env.COOKIE_SECURE = 'false';
process.env.ENABLE_SWAGGER = 'false';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = 'browser-staff-test-jwt-secret-32chars';
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { configureMemoryServerBinary } from '../support/mongoBinary.mjs';
import { devServerEnv, waitForDevServer } from './waitForServer.mjs';

configureMemoryServerBinary();

const frontendRoot = fileURLToPath(new URL('../../../frontend/', import.meta.url));
const viteBin = fileURLToPath(new URL('../../../frontend/node_modules/vite/bin/vite.js', import.meta.url));
const requireFromFrontend = createRequire(new URL('../../../frontend/package.json', import.meta.url));

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const signIn = async (page, origin, username, password) => {
  await page.goto(`${origin}/`);
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
};

test('a director and a manager use the branch and staff screens', { timeout: 180_000 }, async () => {
  const { chromium } = requireFromFrontend('playwright');
  const { default: createApp } = await import('../../app.js');
  const { default: Branch } = await import('../../models/Branch.js');
  const { default: User } = await import('../../models/User.js');

  const loginPassword = 'Karibu@2026!';
  const uiPort = await freePort();
  process.env.ALLOWED_ORIGINS = `http://localhost:${uiPort}`;
  const memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());

  const passwordHash = await bcrypt.hash(loginPassword, 4);
  await User.create({
    name: 'Mr Orban',
    username: 'orban-browser',
    password: passwordHash,
    role: 'director',
    canViewCrossBranchTotals: true
  });
  await User.create({
    name: 'Kulong',
    username: 'kulong-browser',
    password: passwordHash,
    role: 'manager',
    branch: 'Maganjo'
  });

  const app = createApp();
  const apiServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => apiServer.once('listening', resolve));
  const apiPort = apiServer.address().port;
  const vite = spawn(process.execPath, [viteBin, '--host', 'localhost', '--port', String(uiPort), '--strictPort'], {
    cwd: frontendRoot,
    env: devServerEnv({
      API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
      VITE_API_URL: '/api/v1'
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let browser;
  try {
    await waitForDevServer(vite, uiPort, 60_000);
    browser = await chromium.launch({ headless: true });
    const origin = `http://localhost:${uiPort}`;

    const director = await browser.newPage();
    director.setDefaultTimeout(20_000);
    await signIn(director, origin, 'orban-browser', loginPassword);
    await director.waitForURL('**/dashboard/director');
    await director.getByRole('link', { name: 'Branches' }).click();
    await director.waitForURL('**/dashboard/branches');
    await director.getByText('Maganjo', { exact: true }).waitFor();
    await director.getByText('Matugga', { exact: true }).waitFor();

    const maganjo = director.locator('li', { hasText: 'Maganjo' });
    assert.equal(await maganjo.getByRole('button', { name: 'Deactivate' }).count(), 0);

    await director.locator('#branch-name').fill('Bweyogerere');
    await director.locator('#manager-name').fill('Achieng Manager');
    await director.locator('#manager-username').fill('achieng');
    await director.locator('#manager-password').fill('Unique@Launch2026');
    await director.getByRole('button', { name: 'Save branch' }).click();
    await director.getByText('Branch created.').waitFor();

    const createdRow = director.locator('li', { hasText: 'Bweyogerere' });
    await createdRow.getByRole('button', { name: 'Deactivate' }).click();
    await director.getByText('Branch deactivated.').waitFor();
    await createdRow.getByText('(inactive)').waitFor();

    const storedBranch = await Branch.findOne({ name: 'Bweyogerere' }).lean();
    assert.equal(storedBranch.isActive, false);
    const createdManager = await User.findOne({ username: 'achieng' }).lean();
    assert.equal(createdManager.role, 'manager');
    assert.equal(createdManager.branch, 'Bweyogerere');

    const manager = await browser.newPage();
    manager.setDefaultTimeout(20_000);
    await signIn(manager, origin, 'kulong-browser', loginPassword);
    await manager.waitForURL('**/dashboard/manager');
    await manager.getByRole('button', { name: 'Administration' }).click();
    await manager.getByRole('link', { name: 'Users' }).click();
    await manager.waitForURL('**/dashboard/users');
    await manager.getByRole('cell', { name: 'Kulong', exact: true }).waitFor();

    const roleOptions = await manager.locator('#users-role-filter option').allTextContents();
    assert.deepEqual(
      roleOptions.map((option) => option.trim()),
      ['All roles', 'Manager', 'Sales Agent', 'Storekeeper', 'Auditor']
    );

    await manager.getByRole('button', { name: 'New User' }).click();
    await manager.getByRole('dialog', { name: 'Create New User' }).waitFor();
    await manager.locator('#user-name').fill('Amina Agent');
    await manager.locator('#user-username').fill('aminaagent');
    await manager.locator('#user-role').selectOption('sales_agent');
    assert.equal(await manager.locator('#user-branch').inputValue(), 'Maganjo');
    await manager.locator('#user-password').fill('Unique@Launch2026');
    await manager.getByRole('button', { name: 'Create User' }).click();
    await manager.getByText('User created successfully!').waitFor();
    const agentRow = manager.locator('tr', { hasText: 'Amina Agent' });
    await agentRow.getByRole('cell', { name: 'aminaagent', exact: true }).waitFor();
    await agentRow.getByRole('cell', { name: 'Maganjo', exact: true }).waitFor();

    const storedAgent = await User.findOne({ username: 'aminaagent' }).lean();
    assert.equal(storedAgent.role, 'sales_agent');
    assert.equal(storedAgent.branch, 'Maganjo');
    assert.equal(storedAgent.name, 'Amina Agent');
  } finally {
    if (browser) await browser.close();
    if (!vite.killed) vite.kill();
    await new Promise((resolve) => apiServer.close(resolve));
    await mongoose.disconnect();
    await memoryServer.stop();
  }
});
