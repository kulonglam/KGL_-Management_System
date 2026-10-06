import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import AuditLog from '../models/AuditLog.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import { listAuditLogs } from '../controllers/auditController.js';
import { transactionAuditMetadata } from '../services/auditService.js';

const createRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  }
});

const queryFor = (rows) => ({
  sort() {
    return this;
  },
  lean() {
    return this;
  },
  skip() {
    return this;
  },
  limit() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(rows).then(resolve, reject);
  }
});

const findDocs = (rows) => () => ({
  select() {
    return this;
  },
  lean: async () => rows
});

const originals = {
  auditFind: AuditLog.find,
  auditCount: AuditLog.countDocuments,
  saleFind: Sale.find,
  creditFind: CreditSale.find,
  procurementFind: Procurement.find
};

afterEach(() => {
  AuditLog.find = originals.auditFind;
  AuditLog.countDocuments = originals.auditCount;
  Sale.find = originals.saleFind;
  CreditSale.find = originals.creditFind;
  Procurement.find = originals.procurementFind;
});

test('transactionAuditMetadata keeps sale and credit sale facts', () => {
  const saleDetails = transactionAuditMetadata({
    produceName: 'Yellow Beans',
    produceType: 'Beans',
    tonnageKg: 20,
    buyerName: 'Amina Kato',
    amountPaidUgx: 800000,
    branch: 'Maganjo'
  });
  assert.deepEqual(saleDetails, {
    produceName: 'Yellow Beans',
    produceType: 'Beans',
    tonnageKg: 20,
    buyerName: 'Amina Kato',
    amountPaidUgx: 800000
  });

  const creditDetails = transactionAuditMetadata(
    {
      produceName: 'Maize',
      produceType: 'Grain Maize',
      tonnageKg: 10,
      buyerName: 'John Okello',
      amountDueUgx: 400000,
      balanceUgx: 150000
    },
    { repaymentAmountUgx: 50000, isPaid: false }
  );
  assert.equal(creditDetails.repaymentAmountUgx, 50000);
  assert.equal(creditDetails.isPaid, false);
  assert.equal(creditDetails.balanceUgx, 150000);
});

test('listAuditLogs fills missing details for sales and credit sales', async () => {
  AuditLog.find = () =>
    queryFor([
      {
        _id: 'log-sale',
        entityType: 'sale',
        entityId: 'sale-1',
        metadata: {}
      },
      {
        _id: 'log-credit',
        entityType: 'creditSale',
        entityId: 'credit-1',
        metadata: {}
      },
      {
        _id: 'log-procurement',
        entityType: 'procurement',
        entityId: 'proc-1',
        metadata: { produceName: 'Soybeans', produceType: 'Soybeans', tonnageKg: 5 }
      },
      {
        _id: 'log-deleted',
        entityType: 'sale',
        entityId: 'sale-gone',
        metadata: {}
      }
    ]);
  AuditLog.countDocuments = async () => 4;
  Sale.find = findDocs([
    {
      _id: 'sale-1',
      produceName: 'Yellow Beans',
      produceType: 'Beans',
      tonnageKg: 20,
      buyerName: 'Amina Kato',
      amountPaidUgx: 800000
    }
  ]);
  CreditSale.find = findDocs([
    {
      _id: 'credit-1',
      produceName: 'Maize',
      produceType: 'Grain Maize',
      tonnageKg: 10,
      buyerName: 'John Okello',
      amountDueUgx: 400000,
      balanceUgx: 150000
    }
  ]);
  Procurement.find = findDocs([]);

  const res = createRes();
  await listAuditLogs({ user: { role: 'director' }, query: { page: 1, limit: 20 } }, res);

  assert.equal(res.statusCode, 200);
  const [saleLog, creditLog, procurementLog, deletedLog] = res.body.items;
  assert.equal(saleLog.metadata.produceName, 'Yellow Beans');
  assert.equal(saleLog.metadata.buyerName, 'Amina Kato');
  assert.equal(saleLog.metadata.amountPaidUgx, 800000);
  assert.equal(creditLog.metadata.produceName, 'Maize');
  assert.equal(creditLog.metadata.balanceUgx, 150000);
  assert.equal(procurementLog.metadata.tonnageKg, 5);
  assert.deepEqual(deletedLog.metadata, {});
});
