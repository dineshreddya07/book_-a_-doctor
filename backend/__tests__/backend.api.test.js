const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.CLIENT_URL = 'http://localhost:3000';
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost/test';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { autoIndex: true });
  app = require('../app');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Backend API integration', () => {
  it('should complete the main backend flow with auth, role middleware, CRUD, and protected routes', async () => {
    const patientRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Patient One',
        email: 'patient1@example.com',
        password: 'Password123',
        role: 'patient',
      })
      .expect(201);

    const patientToken = patientRes.body.data.token;
    const patientId = patientRes.body.data.user.id;

    const doctorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Doctor One',
        email: 'doctor1@example.com',
        password: 'Password123',
        role: 'doctor',
      })
      .expect(201);

    expect(doctorRes.body.data.user.role).toBe('doctor');
    const doctorToken = doctorRes.body.data.token;

    const doctorUser = await User.findOne({ email: 'doctor1@example.com' });
    expect(doctorUser).toBeTruthy();

    const doctorProfile = await Doctor.findOne({ user: doctorUser._id });
    expect(doctorProfile).toBeTruthy();
    expect(doctorProfile.status).toBe('approved');

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123' })
      .expect(200);

    const adminToken = adminLogin.body.data.token;
    expect(adminLogin.body.data.user.role).toBe('admin');

    const approveRes = await request(app)
      .patch(`/api/doctors/${doctorProfile._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended' })
      .expect(200);

    expect(approveRes.body.data.status).toBe('suspended');

    // Restore to approved for subsequent integration test list assertions
    await Doctor.findByIdAndUpdate(doctorProfile._id, { status: 'approved' });

    const doctorsList = await request(app).get('/api/doctors').expect(200);
    expect(Array.isArray(doctorsList.body.data)).toBe(true);
    expect(doctorsList.body.data.length).toBeGreaterThanOrEqual(1);

    const patientLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient1@example.com', password: 'Password123' })
      .expect(200);

    expect(patientLogin.body.data.user.email).toBe('patient1@example.com');

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${patientLogin.body.data.token}`)
      .expect(200);

    expect(meRes.body.data.user.email).toBe('patient1@example.com');

    const appointmentRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientLogin.body.data.token}`)
      .send({
        doctor: doctorProfile._id,
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Checkup',
      })
      .expect(201);

    expect(appointmentRes.body.data.doctor).toBe(doctorProfile._id.toString());

    const patientAppointments = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${patientLogin.body.data.token}`)
      .expect(200);

    expect(patientAppointments.body.data.length).toBe(1);

    const doctorAppointments = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(doctorAppointments.body.data.length).toBe(1);

    const meProfileRes = await request(app)
      .get('/api/doctors/profile/me')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(meProfileRes.body.data.user.email).toBe('doctor1@example.com');

    const updateProfile = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${patientLogin.body.data.token}`)
      .send({ name: 'Patient Updated' })
      .expect(200);

    expect(updateProfile.body.data.name).toBe('Patient Updated');

    const usersRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(usersRes.body.data.length).toBeGreaterThanOrEqual(3);

    const createDocRes = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Doctor Created Admin',
        email: 'docadmin@example.com',
        password: 'Password123',
        specialty: 'Neurology',
        licenseNumber: 'LIC-ADMIN-999',
        fees: 150,
      })
      .expect(201);

    expect(createDocRes.body.data.user.name).toBe('Doctor Created Admin');
    expect(createDocRes.body.data.specialty).toBe('Neurology');
    expect(createDocRes.body.data.status).toBe('approved');

    await request(app)
      .delete(`/api/users/${patientId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const deletedPatient = await User.findById(patientId);
    expect(deletedPatient).toBeNull();
  });
});
