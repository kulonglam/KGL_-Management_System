import Branch from '../models/Branch.js';
import User from '../models/User.js';
import {
  DEFAULT_REGISTERED_BRANCHES,
  getRegisteredBranches,
  isRegisteredBranch,
  normalizeBranchName,
  setBranchCache
} from '../config/branches.js';
import { hashPassword, validatePasswordStrength, findUserByUsername } from './authService.js';
import { recordAudit } from './auditService.js';
import { runInTransaction, withSession } from '../utils/transaction.js';

const refreshBranchCache = async () => {
  const rows = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
  return setBranchCache(rows.map((row) => row.name));
};

const ensureDefaultBranches = async () => {
  await Promise.all(
    DEFAULT_REGISTERED_BRANCHES.map((name) =>
      Branch.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true })
    )
  );
  return refreshBranchCache();
};

const listBranches = async () => {
  await ensureDefaultBranches();
  return Branch.find({}).sort({ name: 1 }).lean();
};

const createBranchWithManager = async ({ actorUser, name, managerName, managerUsername, managerPassword }) => {
  const branchName = normalizeBranchName(name);
  if (branchName.length < 2) {
    const error = new Error('Branch name must be at least 2 characters');
    error.statusCode = 400;
    throw error;
  }

  if (isRegisteredBranch(branchName)) {
    const error = new Error('Branch already exists');
    error.statusCode = 400;
    throw error;
  }

  const passwordError = validatePasswordStrength(managerPassword);
  if (passwordError) {
    const error = new Error(passwordError);
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await findUserByUsername(managerUsername);
  if (existingUser) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await hashPassword(managerPassword);
  const created = await runInTransaction(async (session) => {
    const [branch] = await Branch.create([{ name: branchName, isActive: true }], withSession(session));
    try {
      const [manager] = await User.create(
        [
          {
            name: managerName,
            username: managerUsername,
            password: passwordHash,
            role: 'manager',
            branch: branchName
          }
        ],
        withSession(session)
      );

      await recordAudit({
        actor: actorUser,
        action: 'create',
        entityType: 'branch',
        entityId: branch._id,
        branch: branchName,
        metadata: { managerUsername },
        session
      });

      return {
        branch,
        manager: {
          _id: manager._id,
          name: manager.name,
          username: manager.username,
          branch: manager.branch
        }
      };
    } catch (error) {
      if (!session) {
        await Branch.deleteOne({ _id: branch._id });
      }
      throw error;
    }
  });

  await refreshBranchCache();
  return created;
};

const updateBranchStatus = async ({ actorUser, branchId, isActive }) => {
  const branch = await Branch.findById(branchId);
  if (!branch) {
    const error = new Error('Branch not found');
    error.statusCode = 404;
    throw error;
  }

  const nextActive = Boolean(isActive);
  if (!nextActive && DEFAULT_REGISTERED_BRANCHES.includes(branch.name)) {
    const error = new Error('Default branches Maganjo and Matugga cannot be deactivated');
    error.statusCode = 400;
    throw error;
  }

  const saved = await runInTransaction(async (session) => {
    branch.isActive = nextActive;
    const updated = await branch.save(withSession(session));
    await recordAudit({
      actor: actorUser,
      action: 'update',
      entityType: 'branch',
      entityId: branch._id,
      branch: branch.name,
      metadata: { isActive: nextActive },
      session
    });
    return updated;
  });
  await refreshBranchCache();
  return saved;
};

export {
  createBranchWithManager,
  ensureDefaultBranches,
  getRegisteredBranches,
  isRegisteredBranch,
  listBranches,
  normalizeBranchName,
  refreshBranchCache,
  updateBranchStatus
};
