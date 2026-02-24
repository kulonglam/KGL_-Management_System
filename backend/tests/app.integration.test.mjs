import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import createApp from '../app.js';

const app = createApp();

test('GET / responds with API message', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data, { message: 'Karibu Groceries LTD API' });
  assert.equal(response.body.error, null);
});

test('GET /api/sales without token is unauthorized', async () => {
  const response = await request(app).get('/api/sales');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.data, null);
  assert.equal(response.body.error.message, 'Not authorized, no token');
});

test('GET /api/sales with invalid token is unauthorized', async () => {
  const response = await request(app)
    .get('/api/sales')
    .set('Authorization', 'Bearer invalid-token');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.data, null);
  assert.equal(response.body.error.message, 'Not authorized, token failed');
});

test('GET /api/prices without token is unauthorized', async () => {
  const response = await request(app).get('/api/prices');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.data, null);
  assert.equal(response.body.error.message, 'Not authorized, no token');
});

test('DELETE /api/prices/:id without token is unauthorized', async () => {
  const response = await request(app).delete('/api/prices/123456789012345678901234');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.data, null);
  assert.equal(response.body.error.message, 'Not authorized, no token');
});

test('Unknown route returns standardized 404 error payload', async () => {
  const response = await request(app).get('/missing-route');

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.data, null);
  assert.match(response.body.error.message, /Not Found/);
});
