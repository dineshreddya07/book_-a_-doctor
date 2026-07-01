const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const getDoctors = asyncHandler(async (req, res) => {
  const {
    search,
    specialty,
    experienceYears,
    location,
    feesMin,
    feesMax,
    rating,
    sort,
    page = 1,
    limit = 10,
    status
  } = req.query;

  const matchQuery = {};

  // Status restriction
  if (status) {
    matchQuery.status = status;
  } else {
    // If not specified, default to approved for patients/guests
    matchQuery.status = 'approved';
  }

  // Name or Specialty Search
  if (search) {
    const matchingUsers = await User.find({
      role: 'doctor',
      name: { $regex: search, $options: 'i' },
    }).select('_id');
    const userIds = matchingUsers.map((u) => u._id);

    matchQuery.$or = [
      { user: { $in: userIds } },
      { specialty: { $regex: search, $options: 'i' } },
    ];
  }

  // Individual filters
  if (specialty) {
    matchQuery.specialty = { $regex: specialty, $options: 'i' };
  }

  if (experienceYears) {
    matchQuery.experienceYears = { $gte: parseInt(experienceYears, 10) };
  }

  if (location) {
    matchQuery.clinicAddress = { $regex: location, $options: 'i' };
  }

  if (feesMin || feesMax) {
    matchQuery.fees = {};
    if (feesMin) matchQuery.fees.$gte = parseInt(feesMin, 10);
    if (feesMax) matchQuery.fees.$lte = parseInt(feesMax, 10);
  }

  if (rating) {
    matchQuery.averageRating = { $gte: parseFloat(rating) };
  }

  // Sorting
  let sortObj = {};
  if (sort === 'fees') {
    sortObj.fees = 1;
  } else if (sort === 'fees_desc') {
    sortObj.fees = -1;
  } else if (sort === 'experience') {
    sortObj.experienceYears = -1;
  } else if (sort === 'rating') {
    sortObj.averageRating = -1;
  } else {
    sortObj.createdAt = -1; // Default newest
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skipNum = (pageNum - 1) * limitNum;

  const total = await Doctor.countDocuments(matchQuery);
  const doctors = await Doctor.find(matchQuery)
    .populate('user', 'name email role profilePhoto phone address')
    .sort(sortObj)
    .skip(skipNum)
    .limit(limitNum);

  res.status(200).json(
    new ApiResponse(200, 'Doctors retrieved successfully', doctors, {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    })
  );
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('user', 'name email role profilePhoto phone address');
  if (!doctor) {
    throw new ApiError(404, 'Doctor not found');
  }
  res.status(200).json(new ApiResponse(200, 'Doctor retrieved', doctor));
});

const updateDoctor = asyncHandler(async (req, res) => {
  // Auto-approve pending doctors upon updating their profile details
  const existingDoc = await Doctor.findOne({ user: req.user._id });
  if (existingDoc && existingDoc.status === 'pending') {
    req.body.status = 'approved';
  }

  // Allow doctors to update their own profile details
  const doctor = await Doctor.findOneAndUpdate({ user: req.user._id }, req.body, {
    new: true,
    runValidators: true,
  }).populate('user', 'name email role profilePhoto phone address');

  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  res.status(200).json(new ApiResponse(200, 'Doctor updated', doctor));
});

const updateDoctorStatus = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate('user', 'name email role profilePhoto phone address');

  if (!doctor) {
    throw new ApiError(404, 'Doctor not found');
  }

  res.status(200).json(new ApiResponse(200, 'Doctor status updated', doctor));
});

const createDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    address,
    profilePhoto,
    specialty,
    qualifications,
    licenseNumber,
    experienceYears = 0,
    clinicAddress,
    bio,
    fees = 0,
    education = [],
    availability = [],
    status = 'approved',
  } = req.body;

  // Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  // Create User document
  const user = await User.create({
    name,
    email,
    password,
    role: 'doctor',
    phone,
    address,
    profilePhoto,
  });

  // Create Doctor document referencing the User
  const doctor = await Doctor.create({
    user: user._id,
    specialty,
    qualifications,
    licenseNumber,
    experienceYears,
    clinicAddress,
    bio,
    fees,
    education,
    availability,
    status,
  });

  const populatedDoctor = await Doctor.findById(doctor._id).populate(
    'user',
    'name email role profilePhoto phone address'
  );

  res.status(201).json(new ApiResponse(201, 'Doctor created successfully', populatedDoctor));
});

const getDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id }).populate(
    'user',
    'name email role profilePhoto phone address'
  );

  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  res.status(200).json(new ApiResponse(200, 'Doctor profile retrieved', doctor));
});

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  createDoctor,
  getDoctorProfile,
};
