/** Unit tests for produce normalization utilities and canonical alias behavior. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeProduceName,
  normalizeProduceType,
  normalizeSourceType,
  normalizeProduceNameKey
} from '../utils/produceNormalization.js';

test('normalizeProduceName canonicalizes common singular/plural variants', () => {
  assert.equal(normalizeProduceName('red bean'), 'Red Beans');
  assert.equal(normalizeProduceName('Red Beans'), 'Red Beans');
  assert.equal(normalizeProduceName('groundnut'), 'Groundnuts');
  assert.equal(normalizeProduceName('Cow pea'), 'Cow Peas');
});

test('normalizeProduceType canonicalizes hyphen variants and casing', () => {
  assert.equal(normalizeProduceType('beans'), 'Beans');
  assert.equal(normalizeProduceType('grain maize'), 'Grain Maize');
  assert.equal(normalizeProduceType('G-nuts'), 'G-nuts');
});

test('normalizeSourceType maps own_farm to kgl_farm', () => {
  assert.equal(normalizeSourceType('own_farm'), 'kgl_farm');
  assert.equal(normalizeSourceType('kgl_farm'), 'kgl_farm');
});

test('normalizeProduceNameKey aligns aliases to the same comparison key', () => {
  assert.equal(normalizeProduceNameKey('Red Bean'), normalizeProduceNameKey('Red Beans'));
});


