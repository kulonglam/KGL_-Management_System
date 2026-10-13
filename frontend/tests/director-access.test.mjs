import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBranchFilterOptions, getHomeRouteForUser } from '../src/utils/directorAccess.js';

test('branch filters start with all branches and then each registered name', () => {
  assert.deepEqual(buildBranchFilterOptions(['Maganjo', 'Kampala']), [
    { value: 'all', label: 'All Branches' },
    { value: 'Maganjo', label: 'Maganjo' },
    { value: 'Kampala', label: 'Kampala' }
  ]);
});

test('a director still opens the director dashboard', () => {
  assert.equal(getHomeRouteForUser({ role: 'director', username: 'amina' }), '/dashboard/director');
});
