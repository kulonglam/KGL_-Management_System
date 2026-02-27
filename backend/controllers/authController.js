import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {
  parseProfileImageUpdate,
  toUserPayload,
  ensureLegacyDirectorTotalsAccess,
  checkRoleMinimumAfterRemoval,
  hashPassword,
  getManagerUserAccessError,
  registerUser,
  updateUserRecord
} from '../services/authService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// Handle login.
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      await ensureLegacyDirectorTotalsAccess(user);
      res.json(toUserPayload(user, true));
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve me.
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update me.
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
      user.password = await hashPassword(password);
    }

    if (parsedProfileImage.hasUpdate) {
      user.profileImage = parsedProfileImage.value;
    }

    const updatedUser = await user.save();

    return res.json(toUserPayload(updatedUser));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Handle register.
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

// Retrieve users.
const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'manager') {
      filter.branch = req.user.branch;
      filter.role = { $in: ['manager', 'sales_agent'] };
    }

    const pagination = parsePagination(req.query);
    const usersQuery = User.find(filter).select('-password').sort({ createdAt: -1 }).lean();

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
// Retrieve user by id.
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const accessError = getManagerUserAccessError(req.user, user);
    if (accessError) {
      return res.status(403).json({ message: accessError });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Update user.
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

// Delete user.
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

export { login, getMe, updateMe, register, getUsers, getUserById, updateUser, deleteUser };
