const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'superSecretKeyForToken1234', {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const cityCoords = {
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'Houston': { lat: 29.7604, lng: -95.3698 },
  'Phoenix': { lat: 33.4484, lng: -112.0740 },
  'Philadelphia': { lat: 39.9526, lng: -75.1652 },
  'San Antonio': { lat: 29.4241, lng: -98.4936 },
  'San Diego': { lat: 32.7157, lng: -117.1611 },
  'Dallas': { lat: 32.7767, lng: -96.7970 },
  'San Jose': { lat: 37.3387, lng: -121.8853 }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, skills, location, phone, bio, hourlyRate, latitude, longitude } = req.body;

    // Check if fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Determine the role
    let requestedRole = 'user';
    if (role === 'provider') {
      requestedRole = 'provider';
    } else if (role === 'admin') {
      requestedRole = 'admin';
    }

    const userData = {
      name,
      email,
      password,
      role: requestedRole
    };

    // If coordinates are provided, use them. Otherwise, try to assign default city coordinates.
    let userLat = null;
    let userLng = null;
    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLng = parseFloat(longitude);
    } else if (location) {
      const defaultCoords = cityCoords[location];
      if (defaultCoords) {
        userLat = defaultCoords.lat;
        userLng = defaultCoords.lng;
      }
    }

    // Assign coordinate fields to standard users and providers
    userData.latitude = userLat;
    userData.longitude = userLng;

    // Add provider details if role is provider
    if (requestedRole === 'provider') {
      userData.skills = skills || [];
      userData.location = location || '';
      userData.phone = phone || '';
      userData.bio = bio || '';
      userData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : 0;
    }

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          skills: user.skills,
          location: user.location,
          phone: user.phone,
          bio: user.bio,
          hourlyRate: user.hourlyRate,
          latitude: user.latitude,
          longitude: user.longitude
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        location: user.location,
        phone: user.phone,
        bio: user.bio,
        hourlyRate: user.hourlyRate,
        latitude: user.latitude,
        longitude: user.longitude
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, location, phone, skills, bio, hourlyRate } = req.body;

    // Fields that any user can update
    if (name) user.name = name;
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }
    if (phone !== undefined) user.phone = phone;

    // Update location and coordinates if changed
    if (location && location !== user.location) {
      user.location = location;
      const defaultCoords = cityCoords[location];
      if (defaultCoords) {
        user.latitude = defaultCoords.lat;
        user.longitude = defaultCoords.lng;
      }
    }

    // Role-specific fields (for providers)
    if (user.role === 'provider') {
      if (skills !== undefined) user.skills = skills;
      if (bio !== undefined) user.bio = bio;
      if (hourlyRate !== undefined) user.hourlyRate = parseFloat(hourlyRate) || 0;
    }

    const updatedUser = await user.save();

    const userObj = updatedUser.toObject();
    delete userObj.password;

    res.json({
      success: true,
      user: userObj
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};
