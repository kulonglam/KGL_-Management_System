import { listBranches, createBranchWithManager, updateBranchStatus } from '../services/branchService.js';
import { getRegisteredBranches } from '../config/branches.js';

const listPublicBranches = async (_req, res) => {
  try {
    const branches = await listBranches();
    res.json({
      items: branches,
      names: getRegisteredBranches()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBranch = async (req, res) => {
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
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const updateBranch = async (req, res) => {
  try {
    if (req.body.isActive === undefined) {
      return res.status(400).json({ message: 'isActive is required' });
    }
    const branch = await updateBranchStatus({
      actorUser: req.user,
      branchId: req.params.id,
      isActive: req.body.isActive === true || req.body.isActive === 'true'
    });
    res.json(branch);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

export { createBranch, listPublicBranches, updateBranch };
