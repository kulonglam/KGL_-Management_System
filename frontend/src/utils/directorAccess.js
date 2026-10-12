// Routes a signed-in user to the home page for their role.

const isDirector = (user) => user?.role === 'director';

const getHomeRouteForUser = (user) => {
  if (isDirector(user)) return '/dashboard/director';
  if (user?.role === 'manager') return '/dashboard/manager';
  if (user?.role === 'sales_agent') return '/dashboard/sales-agent';
  return '/';
};

export { isDirector, getHomeRouteForUser };
