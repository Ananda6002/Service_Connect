const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = async () => {
  try {
    const connect = require('./config/db');
    await connect();
  } catch (err) {
    console.error('Database connection failed', err);
  }
};

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Database connection
connectDB();

// Middleware
app.use(cors({
  origin: '*', // In development, allow requests from any origin. Can restrict to React client domain in production.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Complaint Management System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Listen on configured port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
