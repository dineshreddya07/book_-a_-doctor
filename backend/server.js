const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { port, nodeEnv } = require('./config/env');
const socketUtil = require('./utils/socket');

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    socketUtil.init(server);

    server.listen(port, () => {
      console.log(`Server running in ${nodeEnv} mode on port ${port}`);
      console.log(`Health check: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
