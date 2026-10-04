const DEFAULT_REGISTERED_BRANCHES = ['Maganjo', 'Matugga'];

let branchCache = [...DEFAULT_REGISTERED_BRANCHES];

const normalizeBranchName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

const setBranchCache = (names) => {
  const normalized = (names || []).map(normalizeBranchName).filter(Boolean);
  branchCache = normalized.length > 0 ? [...new Set(normalized)] : [...DEFAULT_REGISTERED_BRANCHES];
  return branchCache;
};

const getRegisteredBranches = () => [...branchCache];

const isRegisteredBranch = (value) => {
  const name = normalizeBranchName(value);
  if (!name) return false;
  return branchCache.some((entry) => entry.toLowerCase() === name.toLowerCase());
};

const createBranchSchemaField = (options = {}) => {
  const required = options.required !== false;
  return {
    type: String,
    required,
    validate: {
      validator(value) {
        if (!value && !required) return true;
        return isRegisteredBranch(value);
      },
      message: 'Invalid branch'
    }
  };
};

export {
  DEFAULT_REGISTERED_BRANCHES,
  createBranchSchemaField,
  getRegisteredBranches,
  isRegisteredBranch,
  normalizeBranchName,
  setBranchCache
};
