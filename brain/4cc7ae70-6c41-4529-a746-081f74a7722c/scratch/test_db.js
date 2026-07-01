const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Manually parse the backend .env file
const envPath = 'c:/Users/A Dinesh Reddy/OneDrive/Desktop/INTERNSHIP/backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const User = require('c:/Users/A Dinesh Reddy/OneDrive/Desktop/INTERNSHIP/backend/models/User');
const Doctor = require('c:/Users/A Dinesh Reddy/OneDrive/Desktop/INTERNSHIP/backend/models/Doctor');
const Appointment = require('c:/Users/A Dinesh Reddy/OneDrive/Desktop/INTERNSHIP/backend/models/Appointment');

async function test() {
  try {
    const uri = env.MONGODB_URI;
    console.log('Connecting to MongoDB: ' + uri);
    await mongoose.connect(uri);
    console.log('Connected.');

    const users = await User.find({});
    console.log('\n--- USERS ---');
    users.forEach(u => console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));

    const doctors = await Doctor.find({});
    console.log('\n--- DOCTORS ---');
    doctors.forEach(d => console.log(`ID: ${d._id}, UserRef: ${d.user}, Specialty: ${d.specialty}, Status: ${d.status}`));

    const appointments = await Appointment.find({});
    console.log('\n--- APPOINTMENTS ---');
    appointments.forEach(a => console.log(`ID: ${a._id}, PatientRef: ${a.patient}, DoctorRef: ${a.doctor}, Date: ${a.appointmentDate}, Status: ${a.status}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

test();
