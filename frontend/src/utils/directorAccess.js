// Routes a signed-in user to the home page for their role.

const isDirector = (user) => user?.role === 'director';

const getHomeRouteForUser = (user) => {
  if (isDirector(user)) return '/dashboard/director';
  if (user?.role === 'manager') return '/dashboard/manager';
  if (user?.role === 'sales_agent') return '/dashboard/sales-agent';
  if (user?.role === 'storekeeper') return '/dashboard/inventory-ops';
  if (user?.role === 'auditor') return '/dashboard/finance';
  return '/';
};

const buildBranchFilterOptions = (names = []) => [
  { value: 'all', label: 'All Branches' },
  ...names
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .map((name) => ({ value: name, label: name }))
];

export { isDirector, getHomeRouteForUser, buildBranchFilterOptions };
