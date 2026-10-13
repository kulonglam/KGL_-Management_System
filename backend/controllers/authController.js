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
  isDirectorAccount,
  checkRoleMinimumAfterRemoval,
  hashPassword,
  validatePasswordStrength,
  getManagerUserAccessError,
  getGenericLoginFailure,
  revokeUserTokens,
  resolveUserListRoleFilter,
  registerUser,
  updateUserRecord,
  generateRefreshToken,
  generateMfaToken,
  generateSetupToken,
  createRecoveryCodes
} from '../services/authService.js';
import { isProduction } from '../config/security.js';
import { rejectDocumentedPassword } from '../config/seedPolicy.js';
import { forwardControllerError } from '../utils/httpError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { buildSearchFilter, resolveSort, trustedQuery } from '../utils/listQuery.js';
import { getJwtAlgorithms, getJwtClaimOptions } from '../config/security.js';
import {
  clearRefreshCookie,
  clearRememberedUsernameCookie,
  readRefreshCookie,
  readRememberedUsername,
  setRefreshCookie,
  setRememberedUsernameCookie
} from '../utils/cookies.js';
import { buildOtpAuthUri, generateTotpSecret, verifyTotpCode } from '../utils/totp.js';
import { recordAudit } from '../services/auditService.js';

const MAX_LOGIN_ATTEMPTS = Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS || 5);
const LOGIN_LOCK_WINDOW_MS = Number(process.env.AUTH_LOCK_WINDOW_MS || 15 * 60 * 1000);
const GENERIC_LOGIN_FAILURE = getGenericLoginFailure();

// A rotated refresh token can be replayed for this long so two tabs do not kick each other out.
// After the window, reuse is treated as theft and the whole refresh family is revoked.
const refreshReuseGraceMs = () => {
  const configured = Number(process.env.AUTH_REFRESH_REUSE_GRACE_MS);
  if (Number.isFinite(configured) && configured >= 0) return configured;
  return 10_000;
};

const refreshVersionFilter = (presented) =>
  presented === 0 ? mongoose.trusted({ $in: [0, null] }) : presented;

// Rotate the refresh cookie on use. A second copy is accepted only briefly, then the session is revoked.
const acceptRefreshToken = async (decoded) => {
  const presented = Number(decoded.refreshTokenVersion);
  if (!Number.isInteger(presented) || presented < 0) {
    return { status: 'invalid' };
  }

  const presentedJti = String(decoded.jti || '');
  const rotated = await User.findOneAndUpdate(
    { _id: decoded.id, refreshTokenVersion: refreshVersionFilter(presented) },
    {
      $inc: { refreshTokenVersion: 1 },
      $set: { refreshRotatedAt: new Date(), previousRefreshJti: presentedJti }
    },
    { new: true }
  );
  if (rotated) {
    return { status: 'rotated', user: rotated };
  }

  const existing = await User.findById(decoded.id);
  if (!existing) {
    return { status: 'invalid' };
  }

  const current = Number(existing.refreshTokenVersion || 0);
  const rotatedAt = existing.refreshRotatedAt ? new Date(existing.refreshRotatedAt).getTime() : 0;
  const withinGrace =
    presented === current - 1 &&
    presentedJti !== '' &&
    presentedJti === String(existing.previousRefreshJti || '') &&
    Number.isFinite(rotatedAt) &&
    Date.now() - rotatedAt <= refreshReuseGraceMs();

  if (withinGrace) {
    return { status: 'grace', user: existing };
  }

  if (presented < current) {
    await revokeUserTokens(existing._id);
    return { status: 'reused' };
  }

  return { status: 'invalid' };
};

const cutOffRefreshSessions = (user) => {
  user.refreshTokenVersion = Number(user.refreshTokenVersion || 0) + 1;
  user.refreshRotatedAt = new Date();
  user.previousRefreshJti = '';
};

// Increment and, once the threshold is reached, lock the account in the same document write.
const recordFailedLogin = (userId) => {
  const now = new Date();
  const lockUntil = new Date(now.getTime() + LOGIN_LOCK_WINDOW_MS);

  return User.findOneAndUpdate({ _id: userId }, [
    {
      $set: {
        loginAttempts: {
          $cond: [
            { $gt: ['$lockUntil', now] },
            '$loginAttempts',
            { $add: [{ $ifNull: ['$loginAttempts', 0] }, 1] }
          ]
        },
        lockUntil: {
          $cond: [{ $gt: ['$lockUntil', now] }, '$lockUntil', null]
        }
      }
    },
    {
      $set: {
        lockUntil: {
          $cond: [{ $gte: ['$loginAttempts', MAX_LOGIN_ATTEMPTS] }, lockUntil, '$lockUntil']
        },
        loginAttempts: {
          $cond: [{ $gte: ['$loginAttempts', MAX_LOGIN_ATTEMPTS] }, 0, '$loginAttempts']
        }
      }
    }
  ]);
};

const productionLoginGate = async (user) => {
  if (!isProduction()) {
    return null;
  }

  if (user.mustChangePassword) {
    return {
      passwordChangeRequired: true,
      setupToken: generateSetupToken(user._id, Number(user.tokenVersion || 0), 'password'),
      message: 'Replace the documented demo password before using this account.'
    };
  }

  if (!user.mfaEnabled) {
    return {
      mfaEnrollmentRequired: true,
      setupToken: generateSetupToken(user._id, Number(user.tokenVersion || 0), 'mfa'),
      message: 'Turn on authenticator MFA before using this account.'
    };
  }

  return null;
};

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
      const setupResponse = await productionLoginGate(user);
      if (setupResponse) {
        return res.json(setupResponse);
      }
      if (user.mfaEnabled) {
        return res.json({
          mfaRequired: true,
          mfaToken: generateMfaToken(user._id)
        });
      }
      setRefreshCookie(res, generateRefreshToken(user._id, Number(user.refreshTokenVersion || 0)));
      applyRememberedUsername(res, req.body?.rememberMe, user.username);
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
        await recordFailedLogin(user._id);
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
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(toUserPayload(user));
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// PUT /api/auth/me: update own profile fields and rotate token version when password changes.
const updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, username, password, profileImage } = req.body;
    const setupPasswordChange = req.setupPurpose === 'password';
    if (setupPasswordChange && !password) {
      return res.status(400).json({ message: 'Choose a new password' });
    }
    if (
      setupPasswordChange &&
      (name !== undefined || username !== undefined || profileImage !== undefined)
    ) {
      return res.status(400).json({ message: 'Password setup only accepts a new password' });
    }

    const parsedProfileImage = parseProfileImageUpdate(profileImage);
    if (parsedProfileImage.error) {
      return res.status(400).json({ message: parsedProfileImage.error });
    }

    if (!setupPasswordChange && name !== undefined) {
      user.name = name;
    }

    if (!setupPasswordChange && username !== undefined) {
      const existing = await User.findOne({
        username,
        _id: mongoose.trusted({ $ne: user._id })
      });

      if (existing) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      user.username = username;
    }
    user.canViewCrossBranchTotals = isDirectorAccount(user);

    let passwordUpdated = false;
    if (password) {
      const passwordPolicyError = validatePasswordStrength(password);
      if (passwordPolicyError) {
        return res.status(400).json({ message: passwordPolicyError });
      }
      const documentedPasswordError = rejectDocumentedPassword(password);
      if (documentedPasswordError) {
        return res.status(400).json({ message: documentedPasswordError });
      }
      user.password = await hashPassword(password);
      user.mustChangePassword = false;
      user.tokenVersion = Number(user.tokenVersion || 0) + 1;
      cutOffRefreshSessions(user);
      passwordUpdated = true;
    }

    if (!setupPasswordChange && parsedProfileImage.hasUpdate) {
      user.profileImage = parsedProfileImage.value;
    }

    const updatedUser = await user.save();

    if (setupPasswordChange) {
      clearRefreshCookie(res);
      return res.json({
        passwordChanged: true,
        message: 'Password updated. Sign in with the new password.'
      });
    }

    if (passwordUpdated) {
      setRefreshCookie(
        res,
        generateRefreshToken(updatedUser._id, Number(updatedUser.refreshTokenVersion || 0))
      );
    }

    return res.json(toUserPayload(updatedUser, passwordUpdated));
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// POST /api/auth/register: manager creates a new branch user via centralized auth service checks.
const register = async (req, res, next) => {
  try {
    const user = await registerUser({
      actorUser: req.user,
      payload: req.body
    });

    res.status(201).json(toUserPayload(user, true));
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// GET /api/auth/users: list users visible to the requester with optional pagination metadata.
const getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'manager') {
      filter.branch = req.user.branch;
    }

    const roleFilter = resolveUserListRoleFilter(req.user.role, req.query.role);
    if (roleFilter.error) {
      return res.status(roleFilter.statusCode).json({ message: roleFilter.error });
    }
    if (roleFilter.roleIn) {
      filter.role = trustedQuery({ $in: roleFilter.roleIn });
    } else if (roleFilter.role) {
      filter.role = roleFilter.role;
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

    const users = (await usersQuery).map((user) => toUserPayload(user));
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
    return forwardControllerError(error, res, next);
  }
};
// PUT /api/auth/users/:id: manager updates one user through shared service validation rules.
const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await updateUserRecord({
      actorUser: req.user,
      targetUserId: req.params.id,
      payload: req.body
    });

    res.json(toUserPayload(updatedUser));
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// DELETE /api/auth/users/:id: delete one user after self-delete and staffing-minimum safeguards.
const deleteUser = async (req, res, next) => {
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
    return forwardControllerError(error, res, next);
  }
};

const issueSession = (res, user) => {
  setRefreshCookie(res, generateRefreshToken(user._id, Number(user.refreshTokenVersion || 0)));
  return toUserPayload(user, true);
};

const applyRememberedUsername = (res, rememberMe, username) => {
  if (rememberMe === true) {
    setRememberedUsernameCookie(res, username);
  } else if (rememberMe === false) {
    clearRememberedUsernameCookie(res);
  }
};

const getRememberedUsername = (req, res) => {
  const username = readRememberedUsername(req);
  const raw = String(req.headers?.cookie || '');
  if (raw.includes('kgl_username=') && !username) {
    clearRememberedUsernameCookie(res);
  }
  return res.json({ username });
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

    const outcome = await acceptRefreshToken(decoded);
    if (outcome.status !== 'rotated' && outcome.status !== 'grace') {
      if (outcome.status === 'reused') {
        clearRefreshCookie(res);
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    if (isProduction() && !outcome.user.mfaEnabled) {
      await revokeUserTokens(outcome.user._id);
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    return res.json(issueSession(res, outcome.user));
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
    const documentedPasswordError = rejectDocumentedPassword(newPassword);
    if (documentedPasswordError) {
      return res.status(400).json({ message: documentedPasswordError });
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
    user.mustChangePassword = false;
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    cutOffRefreshSessions(user);
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
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    cutOffRefreshSessions(user);
    await user.save();
    if (req.setupPurpose === 'mfa') {
      clearRefreshCookie(res);
      return res.json({ mfaEnabled: true });
    }
    return res.json(issueSession(res, user));
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const disableMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (isProduction()) {
      return res.status(403).json({ message: 'MFA stays on for production accounts.' });
    }
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
    applyRememberedUsername(res, req.body?.rememberMe, user.username);
    return res.json(issueSession(res, user));
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export {
  login,
  logout,
  getRememberedUsername,
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