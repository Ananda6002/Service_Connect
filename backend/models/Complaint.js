const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a complaint title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  image: {
    type: String, // Will store the relative URL/path to the uploaded image file
    default: ''
  },
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required']
    },
    address: {
      type: String,
      default: ''
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedWorker: {
    type: String,
    default: 'Unassigned'
  },
  adminComments: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
complaintSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
