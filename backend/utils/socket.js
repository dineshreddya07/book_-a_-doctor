const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig, clientUrl } = require('../config/env');
const Message = require('../models/Message');

let io = null;

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: clientUrl || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket middleware for JWT verification
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        return next();
      } catch (err) {
        console.warn('Socket authentication error:', err.message);
      }
    }
    // Allow connection but unauthenticated
    next();
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(socket.userId);
      console.log(`User connected: ${socket.userId} (Role: ${socket.userRole})`);
    } else {
      console.log('Anonymous socket connected');
    }

    // Handle typing indicators
    socket.on('typing', ({ recipientId, isTyping }) => {
      if (socket.userId && recipientId) {
        io.to(recipientId).emit('typing_status', {
          senderId: socket.userId,
          isTyping,
        });
      }
    });

    // Handle seen status updates
    socket.on('message_seen', async ({ messageId, senderId }) => {
      try {
        if (messageId) {
          await Message.findByIdAndUpdate(messageId, { seen: true });
          if (senderId) {
            io.to(senderId).emit('message_status_update', { messageId, seen: true });
          }
        }
      } catch (error) {
        console.error('Error marking message as seen via socket:', error.message);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        console.log(`User disconnected: ${socket.userId}`);
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const notifyUser = (userId, type, payload) => {
  if (io && userId) {
    io.to(userId.toString()).emit('notification', { type, payload });
  }
};

const sendLiveMessage = (recipientId, message) => {
  if (io && recipientId) {
    io.to(recipientId.toString()).emit('new_message', message);
  }
};

module.exports = {
  init,
  getIo,
  notifyUser,
  sendLiveMessage,
};
