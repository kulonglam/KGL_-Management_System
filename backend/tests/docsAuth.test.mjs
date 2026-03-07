import test from 'node:test';
import assert from 'node:assert/strict';
import { docsAuth } from '../middleware/docsAuth.js';

const createRes = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  }
});

const withDocsEnv = async (overrides, callback) => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSwaggerUsername = process.env.SWAGGER_USERNAME;
  const originalSwaggerPassword = process.env.SWAGGER_PASSWORD;

  process.env.NODE_ENV = overrides.NODE_ENV;
  process.env.SWAGGER_USERNAME = overrides.SWAGGER_USERNAME;
  process.env.SWAGGER_PASSWORD = overrides.SWAGGER_PASSWORD;

  try {
    await callback();
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalSwaggerUsername === undefined) {
      delete process.env.SWAGGER_USERNAME;
    } else {
      process.env.SWAGGER_USERNAME = originalSwaggerUsername;
    }

    if (originalSwaggerPassword === undefined) {
      delete process.env.SWAGGER_PASSWORD;
    } else {
      process.env.SWAGGER_PASSWORD = originalSwaggerPassword;
    }
  }
};

test('docsAuth blocks unauthenticated docs access in production', async () => {
  await withDocsEnv(
    {
      NODE_ENV: 'production',
      SWAGGER_USERNAME: 'docsadmin',
      SWAGGER_PASSWORD: 'StrongDocsPass123!'
    },
    async () => {
      const req = { headers: {} };
      const res = createRes();
      let nextCalled = false;

      docsAuth(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
      assert.equal(res.headers['WWW-Authenticate'], 'Basic realm="Karibu API Docs"');
    }
  );
});

test('docsAuth allows valid basic-auth credentials in production', async () => {
  await withDocsEnv(
    {
      NODE_ENV: 'production',
      SWAGGER_USERNAME: 'docsadmin',
      SWAGGER_PASSWORD: 'StrongDocsPass123!'
    },
    async () => {
      const encoded = Buffer.from('docsadmin:StrongDocsPass123!').toString('base64');
      const req = {
        headers: {
          authorization: `Basic ${encoded}`
        }
      };
      const res = createRes();
      let nextCalled = false;

      docsAuth(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(res.statusCode, 200);
    }
  );
});
