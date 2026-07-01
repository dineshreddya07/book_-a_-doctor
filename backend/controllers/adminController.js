const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const AIChat = require('../models/AIChat');
const Notification = require('../models/Notification');
const { notifyUser } = require('../utils/socket');
const { NOTIFICATION_TYPES } = require('../utils/constants');

// Get global administrative stats and analytics charts
const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const doctorsCount = await User.countDocuments({ role: 'doctor' });
  const patientsCount = await User.countDocuments({ role: 'patient' });
  const appointmentsCount = await Appointment.countDocuments();

  // Compute total revenue (sum of doctor fees for completed appointments)
  const completedAppointments = await Appointment.find({ status: 'completed' }).populate('doctor');
  const revenue = completedAppointments.reduce((acc, appt) => acc + (appt.doctor?.fees || 0), 0);

  // List of pending doctor approvals
  const pendingDoctors = await Doctor.find({ status: 'pending' }).populate('user', 'name email profilePhoto');

  // Recent users
  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('-password');

  // Recent appointments
  const recentAppointments = await Appointment.find()
    .populate({
      path: 'patient',
      select: 'name email profilePhoto',
    })
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name' },
    })
    .sort({ createdAt: -1 })
    .limit(5);

  // Chart data: Monthly appointments (past 6 months)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthData = {};
  
  // Set up baseline defaults for recent months
  const currentMonthIdx = new Date().getMonth();
  for (let i = 5; i >= 0; i--) {
    const idx = (currentMonthIdx - i + 12) % 12;
    monthData[months[idx]] = 0;
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const apptsForChart = await Appointment.find({
    appointmentDate: { $gte: sixMonthsAgo },
  });

  apptsForChart.forEach((appt) => {
    const m = months[new Date(appt.appointmentDate).getMonth()];
    if (monthData[m] !== undefined) {
      monthData[m]++;
    }
  });

  const appointmentsChart = Object.keys(monthData).map((key) => ({
    name: key,
    value: monthData[key],
  }));

  // Chart data: Doctor popularity (Top doctors based on appointment count)
  const doctors = await Doctor.find().populate('user', 'name');
  const popularityData = [];
  for (const doc of doctors) {
    const count = await Appointment.countDocuments({ doctor: doc._id });
    if (count > 0) {
      popularityData.push({
        name: doc.user?.name || 'Unknown Doctor',
        value: count,
      });
    }
  }
  popularityData.sort((a, b) => b.value - a.value);
  const doctorPopularityChart = popularityData.slice(0, 5);

  // Chart data: Patient growth (past 6 months)
  const patientData = {};
  for (let i = 5; i >= 0; i--) {
    const idx = (currentMonthIdx - i + 12) % 12;
    patientData[months[idx]] = 0;
  }

  const usersForChart = await User.find({
    role: 'patient',
    createdAt: { $gte: sixMonthsAgo },
  });

  usersForChart.forEach((usr) => {
    const m = months[new Date(usr.createdAt).getMonth()];
    if (patientData[m] !== undefined) {
      patientData[m]++;
    }
  });

  const patientGrowthChart = Object.keys(patientData).map((key) => ({
    name: key,
    value: patientData[key],
  }));

  res.status(200).json(
    new ApiResponse(200, 'Admin stats retrieved successfully', {
      cards: {
        totalUsers,
        doctors: doctorsCount,
        patients: patientsCount,
        appointments: appointmentsCount,
        revenue,
      },
      pendingDoctors,
      recentUsers,
      recentAppointments,
      charts: {
        appointmentsChart,
        doctorPopularityChart,
        patientGrowthChart,
      },
    })
  );
});

// Suspend or activate a user account
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body; // 'active' or 'suspended'

  if (!['active', 'suspended'].includes(status)) {
    throw new ApiError(400, 'Invalid status update');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role === 'admin') {
    throw new ApiError(403, 'Admin accounts cannot be suspended');
  }

  user.status = status;
  await user.save();

  res.status(200).json(new ApiResponse(200, `User account is now ${status}`, user));
});

// Retrieve system AI Chat logs
const getAllAIChats = asyncHandler(async (req, res) => {
  const chats = await AIChat.find()
    .populate('user', 'name email role')
    .sort({ updatedAt: -1 });

  res.status(200).json(new ApiResponse(200, 'All system AI logs retrieved', chats));
});

// Broadcast notification to specific roles or all users
const broadcastNotification = asyncHandler(async (req, res) => {
  const { targetRole, title, message } = req.body;

  if (!title || !message) {
    throw new ApiError(400, 'Notification title and message are required');
  }

  const query = {};
  if (targetRole && targetRole !== 'all') {
    query.role = targetRole;
  }

  const users = await User.find(query);

  const notifications = [];
  for (const user of users) {
    const notify = await Notification.create({
      recipient: user._id,
      type: NOTIFICATION_TYPES.AI_ANALYSIS_COMPLETED, // General category
      title,
      message,
      link: '/patient',
    });
    
    // Broadcast via socket
    notifyUser(user._id, NOTIFICATION_TYPES.AI_ANALYSIS_COMPLETED, notify);
    notifications.push(notify);
  }

  res.status(201).json(new ApiResponse(201, `Notification broadcasted to ${users.length} users`, null));
});

module.exports = {
  getAdminStats,
  toggleUserStatus,
  getAllAIChats,
  broadcastNotification,
};
