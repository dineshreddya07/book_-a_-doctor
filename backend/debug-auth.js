process.env.JWT_SECRET = 'testsecret';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('./app');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

(async () => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { autoIndex: true });

  const admin = await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'Password123', role: 'admin' });
  console.log('admin created', admin._id.toString());

  const login = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'Password123' });
  console.log('login status', login.status);
  console.log('login body', login.body);

  const token = login.body.data?.token;
  console.log('token', token);

  const doc = await Doctor.create({ user: admin._id, status: 'approved' });
  console.log('doc id', doc._id.toString());

  const patchRes = await request(app)
    .patch(`/api/doctors/${doc._id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'rejected' });
  console.log('patch status', patchRes.status);
  console.log('patch body', patchRes.body);

  await mongoose.disconnect();
  await mongoServer.stop();
})();
