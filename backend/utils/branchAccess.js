// Fail closed: missing role/branch is denied. Only directors may cross branches.
const deniesBranchAccess = (user, branch) => {
  if (!user?.role || !branch) return true;
  if (user.role === 'director') return false;
  if (!user.branch) return true;
  return user.branch !== branch;
};

export { deniesBranchAccess };
