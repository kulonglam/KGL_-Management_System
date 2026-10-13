// Directors may cross branches. Every other role is limited to its own branch.
const deniesBranchAccess = (user, branch) => user?.role !== 'director' && user?.branch !== branch;

export { deniesBranchAccess };
