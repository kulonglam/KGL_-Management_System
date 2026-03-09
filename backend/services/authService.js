/**
 * Provides authentication/account domain utilities: token generation, password policy checks,
 * profile-image validation, role guardrails, and user create/update workflows.
 * File: backend/services/authService.js
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { getJwtClaimOptions } from '../config/security.js';

// Maximum allowed profile image payload size (1 MB).
const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024;
// Supported profile image MIME types accepted by update/profile APIs.
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
// Branch staffing limits enforced during user create/update/delete flows.
const BRANCH_ROLE_LIMITS = {
  manager: { min: 1, max: 1 },
  sales_agent: { min: 2, max: 2 }
};
const PASSWORD_POLICY = {
  minLength: 10,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSymbol: /[^A-Za-z0-9]/
};
const ORBAN_DIRECTOR_USERNAME = 'orban';
const GENERIC_LOGIN_FAILURE = {
  statusCode: 401,
  message: 'Invalid credentials'
};

// Normalize usernames for exact account-identity comparisons.
const normalizeUsername = (value) => String(value || '').trim().toLowerCase();

// Return true only for the director account reserved for Mr. Orban.
const isDirectorOrbanAccount = (user) =>
  user?.role === 'director' && normalizeUsername(user?.username) === ORBAN_DIRECTOR_USERNAME;

// Validate and normalize profile image input; returns update metadata or a validation error string.
const parseProfileImageUpdate = (rawValue) => {
  if (rawValue === undefined) {
    return { hasUpdate: false, value: undefined };
  }

  if (rawValue === null || rawValue === '') {
    return { hasUpdate: true, value: '' };
  }

  if (typeof rawValue !== 'string') {
    return { error: 'Profile image must be a valid image.' };
  }

  const value = rawValue.trim();
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);

  if (!match) {
    return { error: 'Profile image format is invalid.' };
  }

  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(mimeType)) {
    return { error: 'Profile image must be PNG, JPG, or WEBP.' };
  }

  const imageSize = Buffer.byteLength(match[2], 'base64');
  if (imageSize > MAX_PROFILE_IMAGE_SIZE) {
    return { error: 'Profile image must be 1 MB or smaller.' };
  }

  return { hasUpdate: true, value };
};

// Create a signed JWT for a user, embedding tokenVersion and a unique JTI claim.
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign(
    { id, tokenVersion, jti: randomUUID() },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '12h',
      ...getJwtClaimOptions()
    }
  );
};

// Return the generic login failure payload used to avoid leaking account state.
const getGenericLoginFailure = () => ({ ...GENERIC_LOGIN_FAILURE });

// Enforce password complexity policy and return a human-readable error when a rule fails.
const validatePasswordStrength = (password) => {
  const value = String(password || '');
  if (value.length < PASSWORD_POLICY.minLength) {
    return `Password must be at least ${PASSWORD_POLICY.minLength} characters`;
  }
  if (!PASSWORD_POLICY.hasUppercase.test(value)) {
    return 'Password must include at least one uppercase letter';
  }
  if (!PASSWORD_POLICY.hasLowercase.test(value)) {
    return 'Password must include at least one lowercase letter';
  }
  if (!PASSWORD_POLICY.hasNumber.test(value)) {
    return 'Password must include at least one number';
  }
  if (!PASSWORD_POLICY.hasSymbol.test(value)) {
    return 'Password must include at least one symbol';
  }
  return null;
};

// Build the safe API-facing user payload, optionally including a fresh JWT token.
const toUserPayload = (user, includeToken = false) => {
  const payload = {
    _id: user._id,
    name: user.name,
    username: user.username,
    profileImage: user.profileImage || '',
    role: user.role,
    branch: user.branch
  };

  if (includeToken) {
    payload.token = generateToken(user._id, Number(user.tokenVersion || 0));
  }

  return payload;
};

// Keep the stored cross-branch flag aligned with the reserved Orban director account.
const ensureLegacyDirectorTotalsAccess = async (user) => {
  const shouldHaveTotalsAccess = isDirectorOrbanAccount(user);

  if (user.canViewCrossBranchTotals !== shouldHaveTotalsAccess) {
    user.canViewCrossBranchTotals = shouldHaveTotalsAccess;
    await user.save();
  }
};

// Enforce branch maximum staffing caps for a role, optionally excluding one record during updates.
const checkRoleLimits = async (role, branch, excludeUserId = null) => {
  const roleLimits = BRANCH_ROLE_LIMITS[role];
  if (!roleLimits || !branch) {
    return null;
  }

  const query = { role, branch };
  if (excludeUserId) {
    query._id = mongoose.trusted({ $ne: excludeUserId });
  }

  const count = await User.countDocuments(query);
  if (count >= roleLimits.max) {
    if (role === 'manager') return 'Each branch can only have 1 manager';
    if (role === 'sales_agent') return 'Each branch can only have 2 sales agents';
  }

  return null;
};

// Enforce minimum staffing floors before deleting/moving a user out of a required role.
const checkRoleMinimumAfterRemoval = async (role, branch, excludeUserId) => {
  const roleLimits = BRANCH_ROLE_LIMITS[role];
  if (!roleLimits || !branch) {
    return null;
  }

  const query = {
    role,
    branch
  };

  if (excludeUserId) {
    query._id = mongoose.trusted({ $ne: excludeUserId });
  }

  const remainingCount = await User.countDocuments(query);
  if (remainingCount < roleLimits.min) {
    if (role === 'manager') return 'Each branch must always have 1 manager';
    if (role === 'sales_agent') return 'Each branch must retain at least 2 sales agents';
  }

  return null;
};

// Generate a salted bcrypt hash for secure password persistence.
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Revoke all currently issued JWTs for a user by rotating the token version server-side.
const revokeUserTokens = async (userId) => {
  if (!userId) {
    throw createServiceError(400, 'User id is required');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { tokenVersion: 1 } },
    { new: true, runValidators: false }
  );

  if (!user) {
    throw createServiceError(404, 'User not found');
  }

  return user;
};

// Return an access error for manager-scoped operations when target user is outside allowed scope.
const getManagerUserAccessError = (managerUser, targetUser) => {
  if (managerUser.role !== 'manager') {
    return null;
  }

  if (targetUser.role === 'director') {
    return 'Access denied';
  }

  if (targetUser.branch !== managerUser.branch) {
    return 'Access denied to this branch';
  }

  return null;
};

// Construct a domain/service error object that carries an HTTP status code.
const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Create a new user after validating profile image, password policy, branch assignment, and role limits.
const registerUser = async ({ actorUser, payload }) => {
  const { name, username, password, role, branch, profileImage } = payload;
  const normalizedUsername = normalizeUsername(username);

  const parsedProfileImage = parseProfileImageUpdate(profileImage);
  if (parsedProfileImage.error) {
    throw createServiceError(400, parsedProfileImage.error);
  }
  const passwordPolicyError = validatePasswordStrength(password);
  if (passwordPolicyError) {
    throw createServiceError(400, passwordPolicyError);
  }

  const isManager = actorUser && actorUser.role === 'manager';
  if (isManager) {
    const allowedRoles = ['manager', 'sales_agent'];
    if (!allowedRoles.includes(role)) {
      throw createServiceError(400, 'Invalid role for manager');
    }
    if (!actorUser.branch) {
      throw createServiceError(400, 'Manager branch is missing. Re-login or fix the user record.');
    }
  }

  const userExists = await User.findOne({ username });
  if (userExists) {
    throw createServiceError(400, 'User already exists');
  }

  const hashedPassword = await hashPassword(password);
  const assignedBranch = isManager ? actorUser.branch : branch;

  if (role !== 'director' && !assignedBranch) {
    throw createServiceError(400, 'Branch is required');
  }
  if (role === 'director' && normalizedUsername !== ORBAN_DIRECTOR_USERNAME) {
    throw createServiceError(400, 'Director role is reserved for the orban account');
  }

  const limitError = await checkRoleLimits(role, assignedBranch);
  if (limitError) {
    throw createServiceError(400, limitError);
  }

  const user = await User.create({
    name,
    username,
    password: hashedPassword,
    profileImage: parsedProfileImage.hasUpdate ? parsedProfileImage.value : '',
    role,
    branch: assignedBranch,
    canViewCrossBranchTotals: role === 'director' && normalizedUsername === ORBAN_DIRECTOR_USERNAME
  });

  if (!user) {
    throw createServiceError(400, 'Invalid user data');
  }

  return user;
};

// Update an existing user while enforcing scope rules, staffing limits, and password policy.
const updateUserRecord = async ({ actorUser, targetUserId, payload }) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    throw createServiceError(404, 'User not found');
  }

  const accessError = getManagerUserAccessError(actorUser, user);
  if (accessError) {
    throw createServiceError(403, accessError);
  }

  const { name, username, role, password } = payload;
  const currentRole = user.role;
  const currentBranch = user.branch;
  let nextRole = currentRole;
  let nextBranch = currentBranch;
  let nextUsername = user.username;

  if (actorUser.role === 'manager') {
    const allowedRoles = ['manager', 'sales_agent'];
    if (role && !allowedRoles.includes(role)) {
      throw createServiceError(400, 'Invalid role for manager');
    }
    nextBranch = actorUser.branch;
  } else if (payload.branch !== undefined) {
    nextBranch = payload.branch;
  }

  if (name !== undefined) user.name = name;
  if (username !== undefined) {
    if (isDirectorOrbanAccount(user) && normalizeUsername(username) !== ORBAN_DIRECTOR_USERNAME) {
      throw createServiceError(400, 'Mr. Orban account username cannot be changed');
    }
    const existing = await User.findOne({
      username,
      _id: mongoose.trusted({ $ne: user._id })
    });
    if (existing) {
      throw createServiceError(400, 'Username already exists');
    }
    user.username = username;
    nextUsername = username;
  }
  if (role !== undefined) nextRole = role;
  if (nextRole === 'director' && normalizeUsername(nextUsername) !== ORBAN_DIRECTOR_USERNAME) {
    throw createServiceError(400, 'Director role is reserved for the orban account');
  }

  const roleOrBranchChanged = nextRole !== currentRole || nextBranch !== currentBranch;
  if (roleOrBranchChanged) {
    const minimumError = await checkRoleMinimumAfterRemoval(currentRole, currentBranch, user._id);
    if (minimumError) {
      throw createServiceError(400, minimumError);
    }
  }

  const limitError = await checkRoleLimits(nextRole, nextBranch, user._id);
  if (limitError) {
    throw createServiceError(400, limitError);
  }

  user.role = nextRole;
  user.branch = nextBranch;
  user.canViewCrossBranchTotals = nextRole === 'director' && normalizeUsername(nextUsername) === ORBAN_DIRECTOR_USERNAME;

  if (password) {
    const passwordPolicyError = validatePasswordStrength(password);
    if (passwordPolicyError) {
      throw createServiceError(400, passwordPolicyError);
    }
    user.password = await hashPassword(password);
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  }

  return user.save();
};

export {
  parseProfileImageUpdate,
  toUserPayload,
  ensureLegacyDirectorTotalsAccess,
  isDirectorOrbanAccount,
  checkRoleLimits,
  checkRoleMinimumAfterRemoval,
  hashPassword,
  getGenericLoginFailure,
  getManagerUserAccessError,
  revokeUserTokens,
  validatePasswordStrength,
  registerUser,
  updateUserRecord
};





