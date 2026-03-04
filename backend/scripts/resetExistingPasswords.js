import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { validatePasswordStrength } from '../services/authService.js';

dotenv.config();

const parseCliArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  args.forEach((arg) => {
    if (!arg.startsWith('--')) return;
    const [rawKey, ...valueParts] = arg.slice(2).split('=');
    const key = rawKey.trim();
    const value = valueParts.join('=').trim();
    parsed[key] = value;
  });

  return parsed;
};

const main = async () => {
  const cliArgs = parseCliArgs();
  const password = cliArgs.password || process.env.RESET_PASSWORD || '';
  const usernamesRaw = cliArgs.usernames || process.env.RESET_USERNAMES || '';
  const usernames = usernamesRaw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  if (!password) {
    throw new Error(
      'Provide a new password using --password=<value> or RESET_PASSWORD env variable'
    );
  }

  const passwordPolicyError = validatePasswordStrength(password);
  if (passwordPolicyError) {
    throw new Error(passwordPolicyError);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const filter =
      usernames.length > 0 ? { username: mongoose.trusted({ $in: usernames }) } : {};
    const users = await User.find(filter).select('_id username tokenVersion');

    if (users.length === 0) {
      console.log('No users matched the reset filter.');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const bulkOps = users.map((user) => ({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            password: hashedPassword,
            loginAttempts: 0,
            lockUntil: null
          },
          $inc: {
            tokenVersion: 1
          }
        }
      }
    }));

    const result = await User.bulkWrite(bulkOps);
    const updatedCount = Number(result.modifiedCount || 0);

    console.log(`Updated passwords for ${updatedCount} user(s).`);
    console.log(
      `Affected usernames: ${users.map((user) => user.username).sort().join(', ')}`
    );
  } finally {
    await mongoose.disconnect();
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Password reset failed: ${error.message}`);
    process.exit(1);
  });
