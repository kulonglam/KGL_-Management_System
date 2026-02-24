import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInventorySnapshot } from '../services/inventoryService.js';

const sortSnapshot = (rows) =>
  [...rows].sort((a, b) =>
    `${a.produceName}|${a.produceType}|${a.branch}`.localeCompare(
      `${b.produceName}|${b.produceType}|${b.branch}`
    )
  );

test('buildInventorySnapshot aggregates procurement and subtracts sales and credit sales', () => {
  const procurements = [
    { name: 'Red Beans', type: 'Beans', branch: 'Maganjo', tonnageKg: 1000, sellingPrice: 35000 },
    { name: 'Red Beans', type: 'Beans', branch: 'Maganjo', tonnageKg: 500, sellingPrice: 35000 },
    { name: 'Soy Mix', type: 'Soybeans', branch: 'Matugga', tonnageKg: 700, sellingPrice: 25000 }
  ];

  const sales = [
    { produceName: 'Red Beans', produceType: 'Beans', branch: 'Maganjo', tonnageKg: 200 },
    { produceName: 'Soy Mix', produceType: 'Soybeans', branch: 'Matugga', tonnageKg: 50 }
  ];

  const creditSales = [
    { produceName: 'Red Beans', produceType: 'Beans', branch: 'Maganjo', tonnageKg: 100 }
  ];

  const snapshot = sortSnapshot(buildInventorySnapshot(procurements, sales, creditSales));

  assert.equal(snapshot.length, 2);
  assert.deepEqual(snapshot[0], {
    produceName: 'Red Beans',
    produceType: 'Beans',
    branch: 'Maganjo',
    totalTonnageKg: 1200,
    sellingPrice: 35000
  });
  assert.deepEqual(snapshot[1], {
    produceName: 'Soy Mix',
    produceType: 'Soybeans',
    branch: 'Matugga',
    totalTonnageKg: 650,
    sellingPrice: 25000
  });
});

test('buildInventorySnapshot keeps zero and negative balances for out-of-stock reporting', () => {
  const procurements = [
    { name: 'White Maize', type: 'Grain Maize', branch: 'Matugga', tonnageKg: 1000, sellingPrice: 28000 }
  ];
  const sales = [{ produceName: 'White Maize', branch: 'Matugga', tonnageKg: 700 }];
  const creditSales = [{ produceName: 'White Maize', branch: 'Matugga', tonnageKg: 300 }];

  const snapshot = buildInventorySnapshot(procurements, sales, creditSales);
  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0].totalTonnageKg, 0);
});

test('buildInventorySnapshot supports legacy sales without produceType', () => {
  const procurements = [
    { name: 'Yellow Maize', type: 'Grain Maize', branch: 'Matugga', tonnageKg: 1200, sellingPrice: 20000 }
  ];
  const sales = [{ produceName: 'Yellow Maize', branch: 'Matugga', tonnageKg: 200 }];
  const creditSales = [];

  const snapshot = buildInventorySnapshot(procurements, sales, creditSales);
  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0].totalTonnageKg, 1000);
});
