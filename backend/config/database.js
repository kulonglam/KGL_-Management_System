/**
 * Initializes MongoDB connectivity with mongoose safety options and startup failure handling.
 * File: backend/config/database.js
 */

import mongoose from 'mongoose';

// Handle connect db.
const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    mongoose.set('sanitizeFilter', true);
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;





