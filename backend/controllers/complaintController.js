const Complaint = require('../models/Complaint');
const mongoose = require('mongoose');

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Private (User/Admin)
const createComplaint = async (req, res) => {
  try {
    const { title, description, latitude, longitude, address, priority } = req.body;

    if (!title || !description || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, latitude, and longitude coordinates'
      });
    }

    // Determine the image path if an image file was uploaded
    let imageUrl = '';
    if (req.file) {
      // Store the relative path which can be served static
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const complaint = await Complaint.create({
      title,
      description,
      image: imageUrl,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || ''
      },
      priority: priority || 'Medium',
      userId: req.user._id,
      status: 'Pending',
      assignedWorker: 'Unassigned'
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all complaints for the logged-in user
// @route   GET /api/complaints/user
// @access  Private (User/Admin)
const getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all complaints (Admin Only)
// @route   GET /api/complaints
// @access  Private (Admin Only)
const getAllComplaints = async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    // Build query filters
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update complaint status and admin notes (Admin Only)
// @route   PUT /api/complaints/:id/status
// @access  Private (Admin Only)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminComments } = req.body;
    
    if (!status || !['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status' });
    }

    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = status;
    if (adminComments !== undefined) {
      complaint.adminComments = adminComments;
    }
    
    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint status updated successfully',
      complaint
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign complaint to worker (Admin Only)
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin Only)
const assignComplaintWorker = async (req, res) => {
  try {
    const { assignedWorker } = req.body;

    if (!assignedWorker) {
      return res.status(400).json({ success: false, message: 'Please provide worker name' });
    }

    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.assignedWorker = assignedWorker;
    // Auto-advance status to In Progress if it was Pending upon assignment
    if (complaint.status === 'Pending') {
      complaint.status = 'In Progress';
    }

    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint worker assigned successfully',
      complaint
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics (Admin Only)
// @route   GET /api/complaints/stats
// @access  Private (Admin Only)
const getComplaintStats = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });

    // Breakdowns by priority
    const priorityStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorities = { Low: 0, Medium: 0, High: 0 };
    priorityStats.forEach(item => {
      if (priorities.hasOwnProperty(item._id)) {
        priorities[item._id] = item.count;
      }
    });

    res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        priorities
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
  assignComplaintWorker,
  getComplaintStats
};
