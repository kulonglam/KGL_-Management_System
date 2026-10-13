import { listBranches, createBranchWithManager, updateBranchStatus } from '../services/branchService.js';
import { DEFAULT_REGISTERED_BRANCHES, getRegisteredBranches } from '../config/branches.js';
import { forwardControllerError } from '../utils/httpError.js';

const listPublicBranches = async (_req, res, next) => {
  try {
    const branches = await listBranches();
    res.json({
      items: branches.map((branch) => ({
        ...branch,
        isDefault: DEFAULT_REGISTERED_BRANCHES.includes(branch.name)
      })),
      names: getRegisteredBranches()
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const createBranch = async (req, res, next) => {
  try {
    const created = await createBranchWithManager({
      actorUser: req.user,
      name: req.body.name,
      managerName: req.body.managerName,
      managerUsername: req.body.managerUsername,
      managerPassword: req.body.managerPassword
    });
    res.status(201).json(created);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    if (req.body.isActive === undefined) {
      return res.status(400).json({ message: 'isActive is required' });
    }
    const branch = await updateBranchStatus({
      actorUser: req.user,
      branchId: req.params.id,
      isActive: req.body.isActive === true
    });
    res.json(branch);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export { createBranch, listPublicBranches, updateBranch };
