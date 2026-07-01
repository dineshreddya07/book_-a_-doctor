const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');
const { ALLOWED_EXTENSIONS } = require('../utils/constants');
const { maxFileSize } = require('../config/env');

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.uploadType || 'profiles';
    cb(null, path.join(__dirname, '..', 'uploads', uploadType));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter,
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, `File too large. Max size: ${maxFileSize / (1024 * 1024)}MB`));
    }
    return next(new ApiError(400, err.message));
  }
  return next(err);
};

module.exports = { upload, handleMulterError };
