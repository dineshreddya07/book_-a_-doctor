const mongoose = require('mongoose');
const dns = require('dns');
const { mongodbUri, nodeEnv } = require('./env');

// Force using public DNS servers if running locally/in dev to avoid querySrv resolution failures
if (nodeEnv !== 'production') {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (err) {
    console.warn('Warning: Could not set DNS servers manually:', err.message);
  }
}

let mongoMemoryServer = null;

const connectDB = async () => {
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // 1. Try connecting to the primary MONGODB_URI (Atlas)
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    const conn = await mongoose.connect(mongodbUri, {
      autoIndex: nodeEnv !== 'production',
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    });
    console.log(`MongoDB Connected to Atlas: ${conn.connection.host}`);
    return;
  } catch (atlasErr) {
    console.warn('\n⚠️ MongoDB Atlas connection failed.');
    console.warn('Reason:', atlasErr.message);
    console.warn('This is usually because your IP address is not whitelisted in the MongoDB Atlas dashboard.');
  }

  // 2. Try local MongoDB fallback (persistent disk DB)
  const localUri = 'mongodb://127.0.0.1:27017/book-a-doctor';
  try {
    console.log(`\nAttempting to connect to local MongoDB`);
    const conn = await mongoose.connect(localUri, {
      autoIndex: nodeEnv !== 'production',
      serverSelectionTimeoutMS: 3000, // 3 seconds timeout
    });
    console.log(`MongoDB Connected to local database (disk): ${conn.connection.host}`);
    return;
  } catch (localErr) {
    console.warn('⚠️ Local MongoDB connection failed.');
  }

  // 3. Fallback to In-Memory MongoDB Server (for development/testing)
  if (nodeEnv !== 'production') {
    try {
      console.log('\n========================================================================');
      console.log('⚠️ WARNING: Failed to connect to MongoDB Atlas and Local MongoDB!');
      console.log('🚀 Starting In-Memory MongoDB Server fallback...');
      console.log('👉 Registered users/doctors will NOT be stored permanently on restart!');
      console.log('========================================================================\n');
      
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoMemoryServer.getUri();
      
      const conn = await mongoose.connect(inMemoryUri, {
        autoIndex: true,
      });
      console.log(`MongoDB Connected to In-Memory Server: ${conn.connection.host}`);
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB server:', memErr.message);
      throw new Error('Could not connect to any MongoDB instance (Atlas, Local, or In-Memory).');
    }
  } else {
    throw new Error('Could not connect to MongoDB Atlas in production environment.');
  }
};

const cleanup = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      console.log('Stopping In-Memory MongoDB Server...');
      await mongoMemoryServer.stop();
    }
  } catch (err) {
    console.error('Error during database cleanup:', err.message);
  }
};

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

module.exports = connectDB;
