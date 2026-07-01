const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a local file to Cloudinary or falls back to local URL
 * @param {Object} file - Express multer file object
 * @param {String} folder - Subfolder name e.g., 'reports', 'profiles', 'prescriptions'
 * @returns {Promise<String>} URL of the uploaded file
 */
const uploadToCloud = async (file, folder = 'misc') => {
  if (!file) return null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `book-a-doctor/${folder}`,
        resource_type: 'auto',
      });
      // Delete temporary local file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Failed to delete temp file:', err);
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to local:', error);
      // Fallback to local URL on Cloudinary failure
    }
  }

  // Fallback: Return relative local path
  const uploadType = file.path.includes('reports')
    ? 'reports'
    : file.path.includes('prescriptions')
    ? 'prescriptions'
    : 'profiles';
  return `/uploads/${uploadType}/${file.filename}`;
};

module.exports = {
  uploadToCloud,
  isCloudinaryConfigured,
};
