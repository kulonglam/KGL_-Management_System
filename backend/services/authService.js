import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Configure max profile image size bytes.
const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024;
// Configure allowed profile image MIME types.
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
// Configure role limits by branch.
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

// Check whether a user record matches the legacy Orban identity.
const isLegacyOrbanIdentity = (user) => {
  const username = String(user?.username || '').toLowerCase();
  const name = String(user?.name || '').toLowerCase();
  return username === 'orban' || name === 'mr. orban';
};

// Parse profile image update input from API payload.
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

// Generate JWT token for a user ID.
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion, jti: randomUUID() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h'
  });
};

// Validate password against the application's minimum complexity policy.
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

// Build a public user payload from a user document.
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

// Ensure legacy director can access cross-branch totals.
const ensureLegacyDirectorTotalsAccess = async (user) => {
  if (
    user.role === 'director' &&
    user.canViewCrossBranchTotals !== true &&
    isLegacyOrbanIdentity(user)
  ) {
    user.canViewCrossBranchTotals = true;
    await user.save();
  }
};

// Check branch role maximums before create/update.
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
    if (role === 'sales_agent') return 'Each branch can only have 2 attendants';
  }

  return null;
};

// Check branch role minimums before a role/branch move or deletion.
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
    if (role === 'sales_agent') return 'Each branch must always have 2 attendants';
  }

  return null;
};

// Hash a plaintext password for persistence.
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Validate manager-level access to another user record.
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

// Create a typed service error with HTTP status metadata.
const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Register a new user with branch and role guardrails.
const registerUser = async ({ actorUser, payload }) => {
  const { name, username, password, role, branch, profileImage } = payload;

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
    branch: assignedBranch
  });

  if (!user) {
    throw createServiceError(400, 'Invalid user data');
  }

  return user;
};

// Update an existing user with access and branch role safety checks.
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
    const existing = await User.findOne({
      username,
      _id: mongoose.trusted({ $ne: user._id })
    });
    if (existing) {
      throw createServiceError(400, 'Username already exists');
    }
    user.username = username;
  }
  if (role !== undefined) nextRole = role;

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
  checkRoleLimits,
  checkRoleMinimumAfterRemoval,
  hashPassword,
  getManagerUserAccessError,
  validatePasswordStrength,
  registerUser,
  updateUserRecord
};
