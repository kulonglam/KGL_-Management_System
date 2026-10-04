// Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import {
  parseProfileImageUpdate,
  toUserPayload,
  ensureLegacyDirectorTotalsAccess,
  isDirectorOrbanAccount,
  checkRoleMinimumAfterRemoval,
  hashPassword,
  validatePasswordStrength,
  getManagerUserAccessError,
  getGenericLoginFailure,
  revokeUserTokens,
  registerUser,
  updateUserRecord,
  generateRefreshToken,
  generateMfaToken,
  createRecoveryCodes
} from '../services/authService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { buildSearchFilter, resolveSort } from '../utils/listQuery.js';
import { getJwtAlgorithms, getJwtClaimOptions } from '../config/security.js';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../utils/cookies.js';
import { buildOtpAuthUri, generateTotpSecret, verifyTotpCode } from '../utils/totp.js';
import { recordAudit } from '../services/auditService.js';

const MAX_LOGIN_ATTEMPTS = Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS || 5);
const LOGIN_LOCK_WINDOW_MS = Number(process.env.AUTH_LOCK_WINDOW_MS || 15 * 60 * 1000);
const GENERIC_LOGIN_FAILURE = getGenericLoginFailure();

// POST /api/auth/login: authenticate credentials, apply lockout policy, and return auth payload.
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    const now = new Date();

    if (user?.lockUntil && user.lockUntil > now) {
      logger.warn('auth.login.blocked', {
        username,
        reason: 'account_locked',
        lockUntil: user.lockUntil
      });
      return res
        .status(GENERIC_LOGIN_FAILURE.statusCode)
        .json({ message: GENERIC_LOGIN_FAILURE.message });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.loginAttempts || user.lockUntil) {
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();
      }
      await ensureLegacyDirectorTotalsAccess(user);
      if (user.mfaEnabled) {
        return res.json({
          mfaRequired: true,
          mfaToken: generateMfaToken(user._id)
        });
      }
      setRefreshCookie(res, generateRefreshToken(user._id, Number(user.refreshTokenVersion || 0)));
      await recordAudit({
        actor: user,
        action: 'login',
        entityType: 'user',
        entityId: user._id,
        branch: user.branch || ''
      });
      return res.json(toUserPayload(user, true));
    } else {
      if (user) {
        const nextAttempts = Number(user.loginAttempts || 0) + 1;
        user.loginAttempts = nextAttempts;
        if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOGIN_LOCK_WINDOW_MS);
          user.loginAttempts = 0;
        }
        await user.save();
      }
      logger.warn('auth.login.failed', {
        username,
        reason: 'invalid_credentials'
      });
      return res
        .status(GENERIC_LOGIN_FAILURE.statusCode)
        .json({ message: GENERIC_LOGIN_FAILURE.message });
    }
  } catch (error) {
    logger.error('auth.login.error', {
      username: req.body?.username || null,
      message: error.message
    });
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// POST /api/auth/logout: revoke the current user's active JWT version and confirm logout.
const logout = async (req, res) => {
  try {
    await revokeUserTokens(req.user?._id);
    clearRefreshCookie(res);
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('auth.logout.error', {
      requestId: req.requestId || null,
      userId: req.user?._id ? String(req.user._id) : null,
      message: error.message
    });
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Internal Server Error'
    });
  }
};

// GET /api/auth/me: return the current authenticated user's profile (without password hash).
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/me: update own profile fields and rotate token version when password changes.
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, username, password, profileImage } = req.body;
    const parsedProfileImage = parseProfileImageUpdate(profileImage);
    if (parsedProfileImage.error) {
      return res.status(400).json({ message: parsedProfileImage.error });
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (username !== undefined) {
      if (isDirectorOrbanAccount(user) && String(username).trim().toLowerCase() !== 'orban') {
        return res.status(400).json({ message: 'Mr. Orban account username cannot be changed' });
      }
      const existing = await User.findOne({
        username,
        _id: mongoose.trusted({ $ne: user._id })
      });

      if (existing) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      user.username = username;
    }
    user.canViewCrossBranchTotals = isDirectorOrbanAccount({
      role: user.role,
      username: username !== undefined ? username : user.username
    });

    let passwordUpdated = false;
    if (password) {
      const passwordPolicyError = validatePasswordStrength(password);
      if (passwordPolicyError) {
        return res.status(400).json({ message: passwordPolicyError });
      }
      user.password = await hashPassword(password);
      user.tokenVersion = Number(user.tokenVersion || 0) + 1;
      passwordUpdated = true;
    }

    if (parsedProfileImage.hasUpdate) {
      user.profileImage = parsedProfileImage.value;
    }

    const updatedUser = await user.save();

    return res.json(toUserPayload(updatedUser, passwordUpdated));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// POST /api/auth/register: manager creates a new branch user via centralized auth service checks.
const register = async (req, res) => {
  try {
    const user = await registerUser({
      actorUser: req.user,
      payload: req.body
    });

    res.status(201).json(toUserPayload(user, true));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// GET /api/auth/users: list users visible to the requester with optional pagination metadata.
const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'manager') {
      filter.branch = req.user.branch;
      filter.role = mongoose.trusted({ $in: ['manager', 'sales_agent'] });
    }

    const requestedRole = String(req.query.role || 'all');
    if (requestedRole !== 'all' && ['manager', 'sales_agent', 'director'].includes(requestedRole)) {
      filter.role = requestedRole;
    }

    Object.assign(filter, buildSearchFilter(req.query.search, ['name', 'username', 'role', 'branch']));

    const pagination = parsePagination(req.query);
    const sort = resolveSort(req.query.sort, {
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      recent: { createdAt: -1 }
    }, { createdAt: -1 });
    const usersQuery = User.find(filter).select('-password').sort(sort).lean();

    if (pagination.enabled) {
      usersQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const users = await usersQuery;
    const branchScope = req.user.role === 'manager' ? { branch: req.user.branch } : {};
    const summary = {
      managerCount: await User.countDocuments({ ...branchScope, role: 'manager' }),
      salesAgentCount: await User.countDocuments({ ...branchScope, role: 'sales_agent' })
    };
    if (!pagination.enabled) {
      return res.json(users);
    }

    const total = await User.countDocuments(filter);
    return res.json({
      items: users,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total
      }),
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// PUT /api/auth/users/:id: manager updates one user through shared service validation rules.
const updateUser = async (req, res) => {
  try {
    const updatedUser = await updateUserRecord({
      actorUser: req.user,
      targetUserId: req.params.id,
      payload: req.body
    });

    res.json(toUserPayload(updatedUser));
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ message: error.message });
  }
};

// DELETE /api/auth/users/:id: delete one user after self-delete and staffing-minimum safeguards.
const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const accessError = getManagerUserAccessError(req.user, user);
    if (accessError) {
      return res.status(403).json({ message: accessError });
    }
    const minimumError = await checkRoleMinimumAfterRemoval(user.role, user.branch, user._id);
    if (minimumError) {
      return res.status(400).json({ message: minimumError });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const issueSession = (res, user) => {
  setRefreshCookie(res, generateRefreshToken(user._id, Number(user.refreshTokenVersion || 0)));
  return toUserPayload(user, true);
};

const refreshSession = async (req, res) => {
  try {
    const token = readRefreshCookie(req);
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: getJwtAlgorithms(),
      ...getJwtClaimOptions()
    });
    if (decoded.typ !== 'refresh') {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    const user = await User.findById(decoded.id);
    if (!user || Number(decoded.refreshTokenVersion) !== Number(user.refreshTokenVersion || 0)) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    return res.json(issueSession(res, user));
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const resetPasswordWithRecoveryCode = async (req, res) => {
  try {
    const { username, recoveryCode, newPassword } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(GENERIC_LOGIN_FAILURE.statusCode).json({ message: GENERIC_LOGIN_FAILURE.message });
    }

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const hashes = Array.isArray(user.recoveryCodeHashes) ? user.recoveryCodeHashes : [];
    let matchedIndex = -1;
    for (let i = 0; i < hashes.length; i += 1) {
      if (await bcrypt.compare(String(recoveryCode || '').trim().toUpperCase(), hashes[i])) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex < 0) {
      return res.status(GENERIC_LOGIN_FAILURE.statusCode).json({ message: GENERIC_LOGIN_FAILURE.message });
    }

    hashes.splice(matchedIndex, 1);
    user.recoveryCodeHashes = hashes;
    user.password = await hashPassword(newPassword);
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    user.refreshTokenVersion = Number(user.refreshTokenVersion || 0) + 1;
    await user.save();
    clearRefreshCookie(res);
    return res.json({ message: 'Password reset successfully. Sign in with your new password.' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const issueRecoveryCodes = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const codes = createRecoveryCodes();
    user.recoveryCodeHashes = await Promise.all(codes.map((code) => hashPassword(code)));
    await user.save();
    return res.json({
      recoveryCodes: codes,
      message: 'Store these recovery codes now. They will not be shown again.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const issueRecoveryCodesForUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const accessError = getManagerUserAccessError(req.user, targetUser);
    if (accessError) {
      return res.status(accessError.statusCode).json({ message: accessError.message });
    }
    const codes = createRecoveryCodes();
    targetUser.recoveryCodeHashes = await Promise.all(codes.map((code) => hashPassword(code)));
    await targetUser.save();
    await recordAudit({
      actor: req.user,
      action: 'auth',
      entityType: 'user',
      entityId: targetUser._id,
      branch: targetUser.branch,
      metadata: { recoveryCodesIssued: true }
    });
    return res.json({
      username: targetUser.username,
      recoveryCodes: codes,
      message: 'Give these codes to the staff member now. They will not be shown again.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const setupMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const secret = generateTotpSecret();
    user.mfaPendingSecret = secret;
    await user.save();
    return res.json({
      secret,
      otpauthUri: buildOtpAuthUri({ username: user.username, secret })
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const enableMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const secret = user.mfaPendingSecret || user.mfaSecret;
    if (!secret || !verifyTotpCode(secret, req.body.code)) {
      return res.status(400).json({ message: 'Invalid authenticator code' });
    }
    user.mfaSecret = secret;
    user.mfaPendingSecret = '';
    user.mfaEnabled = true;
    await user.save();
    return res.json({ mfaEnabled: true });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const disableMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const passwordOk = await bcrypt.compare(String(req.body.password || ''), user.password);
    if (!passwordOk) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    if (user.mfaEnabled && !verifyTotpCode(user.mfaSecret, req.body.code)) {
      return res.status(400).json({ message: 'Invalid authenticator code' });
    }
    user.mfaEnabled = false;
    user.mfaSecret = '';
    user.mfaPendingSecret = '';
    await user.save();
    return res.json({ mfaEnabled: false });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const verifyMfaLogin = async (req, res) => {
  try {
    const { mfaToken, code } = req.body;
    const decoded = jwt.verify(mfaToken, process.env.JWT_SECRET, {
      algorithms: getJwtAlgorithms(),
      ...getJwtClaimOptions()
    });
    if (decoded.typ !== 'mfa') {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
    const user = await User.findById(decoded.id);
    if (!user?.mfaEnabled || !verifyTotpCode(user.mfaSecret, code)) {
      return res.status(GENERIC_LOGIN_FAILURE.statusCode).json({ message: GENERIC_LOGIN_FAILURE.message });
    }
    await ensureLegacyDirectorTotalsAccess(user);
    return res.json(issueSession(res, user));
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export {
  login,
  logout,
  getMe,
  updateMe,
  register,
  getUsers,
  updateUser,
  deleteUser,
  refreshSession,
  resetPasswordWithRecoveryCode,
  issueRecoveryCodes,
  issueRecoveryCodesForUser,
  setupMfa,
  enableMfa,
  disableMfa,
  verifyMfaLogin
};