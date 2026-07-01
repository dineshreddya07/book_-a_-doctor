import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Strip '/api' from the backend url if present for socket connection
  const url = backendUrl.replace(/\/api\/?$/, '');

  socket = io(url, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Real-time socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Real-time socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
