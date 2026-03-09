// Centralizes frontend checks for the reserved Orban director account.
 
const ORBAN_DIRECTOR_USERNAME = 'orban';

const normalizeUsername = (value) => String(value || '').trim().toLowerCase();

const isDirectorOrban = (user) =>
  user?.role === 'director' && normalizeUsername(user?.username) === ORBAN_DIRECTOR_USERNAME;

const getHomeRouteForUser = (user) => {
  if (isDirectorOrban(user)) return '/dashboard/director';
  if (user?.role === 'director') return '/dashboard/profile';
  if (user?.role === 'manager') return '/dashboard/manager';
  if (user?.role === 'sales_agent') return '/dashboard/sales-agent';
  return '/';
};

export { isDirectorOrban, getHomeRouteForUser };
