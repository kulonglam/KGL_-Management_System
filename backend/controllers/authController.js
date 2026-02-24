import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const MAX_PROFILE_IMAGE_SIZE_BYTES = 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const BRANCH_ROLE_LIMITS = {
  manager: { min: 1, max: 1 },
  sales_agent: { min: 2, max: 2 }
};

const isLegacyOrbanIdentity = (user) => {
  const username = String(user?.username || '').toLowerCase();
  const name = String(user?.name || '').toLowerCase();
  return username === 'orban' || name === 'mr. orban';
};

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
  if (imageSize > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return { error: 'Profile image must be 1 MB or smaller.' };
  }

  return { hasUpdate: true, value };
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Helper to check role limits per branch
const checkRoleLimits = async (role, branch, excludeUserId = null) => {
  const roleLimits = BRANCH_ROLE_LIMITS[role];
  if (!roleLimits || !branch) {
    return null;
  }

  const query = { role, branch };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const count = await User.countDocuments(query);
  if (count >= roleLimits.max) {
    if (role === 'manager') return 'Each branch can only have 1 manager';
    if (role === 'sales_agent') return 'Each branch can only have 2 attendants';
  }

  return null;
};

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
    query._id = { $ne: excludeUserId };
  }

  const remainingCount = await User.countDocuments(query);
  if (remainingCount < roleLimits.min) {
    if (role === 'manager') return 'Each branch must always have 1 manager';
    if (role === 'sales_agent') return 'Each branch must always have 2 attendants';
  }

  return null;
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.role === 'director' && user.canViewCrossBranchTotals !== true && isLegacyOrbanIdentity(user)) {
        user.canViewCrossBranchTotals = true;
        await user.save();
      }

      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage || '',
        role: user.role,
        branch: user.branch,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      const existing = await User.findOne({
        username,
        _id: { $ne: user._id }
      });

      if (existing) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      user.username = username;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (parsedProfileImage.hasUpdate) {
      user.profileImage = parsedProfileImage.value;
    }

    const updatedUser = await user.save();

    return res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      profileImage: updatedUser.profileImage || '',
      role: updatedUser.role,
      branch: updatedUser.branch
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { name, username, password, role, branch, profileImage } = req.body;
    const parsedProfileImage = parseProfileImageUpdate(profileImage);
    if (parsedProfileImage.error) {
      return res.status(400).json({ message: parsedProfileImage.error });
    }

    const isManager = req.user && req.user.role === 'manager';

    // Only managers can register users and can only create manager/sales_agent within their branch
    if (isManager) {
      const allowedRoles = ['manager', 'sales_agent'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role for manager' });
      }
      if (!req.user.branch) {
        return res.status(400).json({ message: 'Manager branch is missing. Re-login or fix the user record.' });
      }
    }

    // Check if user exists
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const assignedBranch = isManager ? req.user.branch : branch;

    if (role !== 'director' && !assignedBranch) {
      return res.status(400).json({ message: 'Branch is required' });
    }

    const limitError = await checkRoleLimits(role, assignedBranch);
    if (limitError) {
      return res.status(400).json({ message: limitError });
    }

    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      profileImage: parsedProfileImage.hasUpdate ? parsedProfileImage.value : '',
      role,
      branch: assignedBranch
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage || '',
        role: user.role,
        branch: user.branch,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'manager') {
      filter.branch = req.user.branch;
      filter.role = { $in: ['manager', 'sales_agent'] };
    }

    const pagination = parsePagination(req.query);
    const usersQuery = User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    if (pagination.enabled) {
      usersQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const users = await usersQuery;
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
      })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'manager') {
      if (user.role === 'director') {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (user.branch !== req.user.branch) {
        return res.status(403).json({ message: 'Access denied to this branch' });
      }
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'manager') {
      if (user.role === 'director') {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (user.branch !== req.user.branch) {
        return res.status(403).json({ message: 'Access denied to this branch' });
      }
    }

    const { name, username, role, password } = req.body;
    const currentRole = user.role;
    const currentBranch = user.branch;
    let nextRole = currentRole;
    let nextBranch = currentBranch;

    if (req.user.role === 'manager') {
      const allowedRoles = ['manager', 'sales_agent'];
      if (role && !allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role for manager' });
      }
      nextBranch = req.user.branch;
    } else if (req.body.branch !== undefined) {
      nextBranch = req.body.branch;
    }

    if (name !== undefined) user.name = name;
    if (username !== undefined) user.username = username;

    if (role !== undefined) {
      nextRole = role;
    }

    const roleOrBranchChanged = nextRole !== currentRole || nextBranch !== currentBranch;
    if (roleOrBranchChanged) {
      const minimumError = await checkRoleMinimumAfterRemoval(currentRole, currentBranch, user._id);
      if (minimumError) {
        return res.status(400).json({ message: minimumError });
      }
    }

    const limitError = await checkRoleLimits(nextRole, nextBranch, user._id);
    if (limitError) {
      return res.status(400).json({ message: limitError });
    }

    user.role = nextRole;
    user.branch = nextBranch;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      profileImage: updatedUser.profileImage || '',
      role: updatedUser.role,
      branch: updatedUser.branch
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'manager') {
      if (user.role === 'director') {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (user.branch !== req.user.branch) {
        return res.status(403).json({ message: 'Access denied to this branch' });
      }
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

export {
  login,
  getMe,
  updateMe,
  register,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
