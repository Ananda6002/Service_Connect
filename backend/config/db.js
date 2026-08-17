const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  // Ensure Node uses a working DNS resolver for Atlas SRV records
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB Atlas SRV connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
