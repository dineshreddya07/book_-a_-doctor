const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
   path: path.join(__dirname, '..', '.env'),
});
  console.log('Loaded MONGODB_URI:', process.env.MONGODB_URI);

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} is not set in environment variables.`);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
  geminiApiKey: process.env.GEMINI_API_KEY,
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};
