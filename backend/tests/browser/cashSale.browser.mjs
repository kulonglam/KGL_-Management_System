process.env.NODE_ENV = 'test';
process.env.COOKIE_SAMESITE = 'lax';
process.env.COOKIE_SECURE = 'false';
process.env.ENABLE_SWAGGER = 'false';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = 'browser-sale-test-jwt-secret-32chars';
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const installedMongod = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
if (!process.env.MONGOMS_SYSTEM_BINARY && existsSync(installedMongod)) {
  process.env.MONGOMS_SYSTEM_BINARY = installedMongod;
  process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
}

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

const waitForOutput = (child, pattern, timeoutMs) =>
  new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Timed out waiting for the dev server.\n${buffer}`));
    }, timeoutMs);
    const onData = (chunk) => {
      buffer += String(chunk);
      if (!settled && pattern.test(buffer)) {
        settled = true;
        clearTimeout(timer);
        resolve(buffer);
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.once('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Dev server exited with ${code}.\n${buffer}`));
    });
  });

test('a signed-in user records a cash sale in the browser', { timeout: 180_000 }, async () => {
  const { chromium } = requireFromFrontend('playwright');
  const { default: createApp } = await import('../../app.js');
  const { calculateInventoryByBranch } = await import('../../services/inventoryService.js');
  const { default: Procurement } = await import('../../models/Procurement.js');
  const { default: Sale } = await import('../../models/Sale.js');
  const { default: User } = await import('../../models/User.js');

  const uiPort = await freePort();
  process.env.ALLOWED_ORIGINS = `http://localhost:${uiPort}`;
  const memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());

  const password = 'Karibu@2026!';
  const agent = await User.create({
    name: 'Amina Agent',
    username: 'amina-browser',
    password: await bcrypt.hash(password, 4),
    role: 'sales_agent',
    branch: 'Maganjo'
  });
  await Procurement.create({
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: new Date('2026-03-06T00:00:00.000Z'),
    timeReceived: '09:00',
    tonnageKg: 2000,
    costUgx: 8000000,
    dealerName: 'Maganjo Farm',
    dealerContact: '0700123456',
    branch: 'Maganjo',
    sellingPrice: 35000,
    recordedBy: agent._id
  });

  const app = createApp();
  const apiServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => apiServer.once('listening', resolve));
  const apiPort = apiServer.address().port;

  const vite = spawn(process.execPath, [viteBin, '--host', 'localhost', '--port', String(uiPort), '--strictPort'], {
    cwd: frontendRoot,
    env: {
      ...process.env,
      API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
      VITE_API_URL: '/api/v1'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let browser;
  try {
    await waitForOutput(vite, /Local:/, 60_000);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(20_000);

    await page.goto(`http://localhost:${uiPort}/`);
    await page.locator('#username').fill('amina-browser');
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(`**/dashboard/sales-agent`);

    await page.getByRole('link', { name: 'Cash Sales' }).click();
    await page.waitForURL(`**/dashboard/sales`);
    await page.locator('#sales-produce-name').selectOption({ label: 'Red Beans' });
    await page.locator('#sales-tonnage-kg').fill('10');
    await page.locator('#sales-buyer-name').fill('Marys Restaurant');
    await page.locator('#sales-amount-paid').waitFor();
    assert.equal(await page.locator('#sales-amount-paid').inputValue(), '350000');

    await page.getByRole('button', { name: 'Review Sale' }).click();
    await page.getByRole('dialog', { name: 'Review Cash Sale' }).waitFor();
    await page.getByRole('button', { name: 'Save Cash Sale' }).click();
    await page.getByText('Sale recorded successfully!').waitFor();

    const stored = await Sale.findOne({ buyerName: 'Marys Restaurant' }).lean();
    assert.ok(stored, 'the browser save should insert a sale');
    assert.equal(stored.produceName, 'Red Beans');
    assert.equal(stored.tonnageKg, 10);
    assert.equal(stored.amountPaidUgx, 350000);
    assert.equal(stored.branch, 'Maganjo');

    const inventory = await calculateInventoryByBranch('Maganjo');
    const bucket = inventory.find((item) => item.produceName === 'Red Beans');
    assert.equal(bucket.totalTonnageKg, 1990);
  } finally {
    if (browser) await browser.close();
    if (!vite.killed) vite.kill();
    await new Promise((resolve) => apiServer.close(resolve));
    await mongoose.disconnect();
    await memoryServer.stop();
  }
});
