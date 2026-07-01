import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FaCalendarAlt,
  FaFileMedical,
  FaUserCog,
  FaPlusCircle,
  FaTrash,
  FaStar,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaStarHalfAlt,
} from 'react-icons/fa';
import api from '../../services/api';

const PatientDashboard = () => {
  const { user } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('appointments');

  // Core records lists
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]); // for report uploads

  // Form states
  const [reportForm, setReportForm] = useState({ title: '', description: '', doctorId: '', file: null });
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [reviewForm, setReviewForm] = useState({ doctorId: '', rating: 5, comment: '' });
  const [selectedReviewAppt, setSelectedReviewAppt] = useState(null);

  // Status management
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Reschedule states
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [apptRes, reportRes, docRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/reports'),
        api.get('/doctors', { params: { limit: 100 } }),
      ]);
      setAppointments(apptRes.data.data);
      setReports(reportRes.data.data);
      setDoctorsList(docRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const triggerMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Appointment Actions
  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setActionLoading(true);
    try {
      await api.put(`/appointments/${apptId}`, { status: 'cancelled' });
      triggerMessage('Appointment cancelled successfully.');
      fetchDashboardData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to cancel appointment.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    setActionLoading(true);
    try {
      await api.put(`/appointments/${rescheduleAppt._id}`, {
        status: 'rescheduled',
        appointmentDate: new Date(rescheduleDate).toISOString(),
      });
      triggerMessage('Appointment rescheduled request sent.');
      setRescheduleAppt(null);
      setRescheduleDate('');
      fetchDashboardData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to reschedule.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Report Actions
  const handleReportUpload = async (e) => {
    e.preventDefault();
    if (!reportForm.file || !reportForm.title) {
      triggerMessage('Title and file are required.', 'danger');
      return;
    }

    setActionLoading(true);
    const formData = new FormData();
    formData.append('title', reportForm.title);
    formData.append('description', reportForm.description);
    if (reportForm.doctorId) formData.append('doctorId', reportForm.doctorId);
    formData.append('file', reportForm.file);

    try {
      await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      triggerMessage('Medical report uploaded successfully!');
      setReportForm({ title: '', description: '', doctorId: '', file: null });
      fetchDashboardData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to upload report.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/reports/${reportId}`);
      triggerMessage('Report deleted.');
      fetchDashboardData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to delete report.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put('/users/me', profileForm);
      triggerMessage('Profile updated successfully.');
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to update profile.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment) return;
    setActionLoading(true);
    try {
      await api.post('/reviews', {
        doctorId: reviewForm.doctorId,
        rating: parseInt(reviewForm.rating, 10),
        comment: reviewForm.comment,
      });
      triggerMessage('Thank you! Review submitted.');
      setSelectedReviewAppt(null);
      setReviewForm({ doctorId: '', rating: 5, comment: '' });
      fetchDashboardData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to submit review.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Aggregated card metrics
  const totalBookings = appointments.length;
  const upcomingCount = appointments.filter((a) => ['pending', 'approved', 'rescheduled'].includes(a.status)).length;
  const reportsCount = reports.length;

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 w-100">
        <div className="spinner-border text-primary" role="status" />
        <span className="mt-3 text-secondary">Loading patient dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container container py-4 w-100">
      {/* Messages */}
      {message.text && (
        <div className={`alert alert-${message.type} rounded-4 shadow-sm mb-4`} role="alert">
          {message.text}
        </div>
      )}

      {/* Hero Welcome banner */}
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="fw-bold mb-1">Welcome back, {user?.name}!</h2>
            <p className="text-secondary mb-0">Manage your appointments, download medical prescriptions, and consult AI logs.</p>
          </div>
          <button onClick={() => setActiveTab('upload_report')} className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-1">
            <FaPlusCircle /> Upload New Report
          </button>
        </div>
      </div>

      {/* Metrics Quickcards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center h-100 bg-white">
            <h3 className="fw-bold text-primary display-6 mb-1">{totalBookings}</h3>
            <span className="text-secondary small fw-semibold">Total Bookings</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center h-100 bg-white">
            <h3 className="fw-bold text-warning display-6 mb-1">{upcomingCount}</h3>
            <span className="text-secondary small fw-semibold">Upcoming Appointments</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center h-100 bg-white">
            <h3 className="fw-bold text-success display-6 mb-1">{reportsCount}</h3>
            <span className="text-secondary small fw-semibold">Uploaded Reports</span>
          </div>
        </div>
      </div>

      {/* Tab bar navigation */}
      <div className="row g-4">
        <div className="col-lg-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white d-flex flex-column gap-1.5">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'appointments' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaCalendarAlt className="me-2" /> Appointments
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'reports' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaFileMedical className="me-2" /> Medical Reports
            </button>
            <button
              onClick={() => setActiveTab('upload_report')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'upload_report' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaPlusCircle className="me-2" /> Upload Report
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'profile' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaUserCog className="me-2" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Tab contents */}
        <div className="col-lg-9">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
            {/* Tab 1: Appointments */}
            {activeTab === 'appointments' && (
              <div>
                <h4 className="fw-bold mb-4">Your Appointment Timeline</h4>
                {appointments.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <p className="mb-3">You have no scheduled appointments.</p>
                    <button onClick={() => navigate('/doctors')} className="btn btn-primary rounded-pill px-4 btn-sm">
                      Find a Doctor Now
                    </button>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {appointments.map((appt) => {
                      const doc = appt.doctor || {};
                      const docUser = doc.user || {};
                      const isCompleted = appt.status === 'completed';
                      const isPending = ['pending', 'rescheduled'].includes(appt.status);

                      return (
                        <div key={appt._id} className="border rounded-4 p-3 hover-bg-light transition-all">
                          <div className="row g-3 align-items-center">
                            <div className="col-sm-2 text-center text-sm-start">
                              <img
                                src={docUser.profilePhoto || 'https://picsum.photos/id/47/300/300'}
                                alt={docUser.name}
                                className="rounded-circle object-fit-cover shadow-xs"
                                style={{ width: '60px', height: '60px' }}
                                onError={(e) => {
                                  e.target.src = 'https://picsum.photos/id/47/300/300';
                                }}
                              />
                            </div>
                            <div className="col-sm-6 text-center text-sm-start">
                              <h6 className="fw-bold mb-1">Dr. {docUser.name || 'Specialist'}</h6>
                              <p className="text-primary small mb-1">{doc.specialty || 'General Practice'}</p>
                              <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-sm-start small text-secondary">
                                <span className="d-flex align-items-center gap-1">
                                  <FaCalendarAlt /> {new Date(appt.appointmentDate).toLocaleString()}
                                </span>
                                <span>Fee: ${doc.fees || 0}</span>
                              </div>
                              <p className="text-secondary small mt-2 mb-0 italic">Reason: "{appt.reason}"</p>
                            </div>
                            <div className="col-sm-4 text-center text-sm-end">
                              <span
                                className={`badge mb-2 px-2.5 py-1.5 rounded-pill text-capitalize ${
                                  appt.status === 'approved'
                                    ? 'bg-success-subtle text-success'
                                    : appt.status === 'cancelled'
                                    ? 'bg-danger-subtle text-danger'
                                    : appt.status === 'completed'
                                    ? 'bg-primary-subtle text-primary'
                                    : 'bg-warning-subtle text-warning'
                                }`}
                              >
                                {appt.status}
                              </span>

                              <div className="d-flex gap-1.5 justify-content-center justify-content-sm-end mt-2">
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setRescheduleAppt(appt);
                                        setRescheduleDate(new Date(appt.appointmentDate).toISOString().slice(0, 16));
                                      }}
                                      className="btn btn-xs btn-outline-warning rounded-pill px-2.5 small"
                                      disabled={actionLoading}
                                    >
                                      Reschedule
                                    </button>
                                    <button
                                      onClick={() => handleCancelAppointment(appt._id)}
                                      className="btn btn-xs btn-outline-danger rounded-pill px-2.5 small"
                                      disabled={actionLoading}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}

                                {isCompleted && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedReviewAppt(appt);
                                        setReviewForm({ doctorId: doc._id, rating: 5, comment: '' });
                                      }}
                                      className="btn btn-xs btn-outline-warning rounded-pill px-2.5 small d-flex align-items-center gap-1"
                                      disabled={actionLoading}
                                    >
                                      <FaStar /> Review Doctor
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reschedule Modal/Form Overlay */}
                {rescheduleAppt && (
                  <div className="card shadow border-0 rounded-4 mt-4 p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Reschedule Consultation</h6>
                      <button onClick={() => setRescheduleAppt(null)} className="btn btn-close btn-sm" />
                    </div>
                    <form onSubmit={handleRescheduleSubmit} className="d-flex flex-column gap-3">
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn btn-primary rounded-pill btn-sm w-100 fw-bold shadow-xs">
                        Request New Time
                      </button>
                    </form>
                  </div>
                )}

                {/* Submit Review Form */}
                {selectedReviewAppt && (
                  <div className="card shadow border-0 rounded-4 mt-4 p-4 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">Review consultation with Dr. {selectedReviewAppt.doctor?.user?.name}</h5>
                      <button onClick={() => setSelectedReviewAppt(null)} className="btn btn-close btn-sm" />
                    </div>
                    <form onSubmit={handleReviewSubmit} className="d-flex flex-column gap-3">
                      <div>
                        <label className="form-label small fw-semibold text-secondary">Star Rating (1-5)</label>
                        <select
                          className="form-select"
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value, 10) })}
                        >
                          <option value="5">5 Stars (Excellent)</option>
                          <option value="4">4 Stars (Good)</option>
                          <option value="3">3 Stars (Average)</option>
                          <option value="2">2 Stars (Poor)</option>
                          <option value="1">1 Star (Terrible)</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label small fw-semibold text-secondary">Comments</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Tell us about your diagnostic session, prescription, behavior..."
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-warning text-dark rounded-pill fw-bold btn-sm shadow-sm mt-2">
                        Submit Doctor Rating
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Reports */}
            {activeTab === 'reports' && (
              <div>
                <h4 className="fw-bold mb-4">Patient Medical Folders</h4>
                {reports.length === 0 ? (
                  <p className="text-muted text-center py-4">No uploaded medical documents found.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle table-hover small">
                      <thead className="table-light">
                        <tr>
                          <th>Document Title</th>
                          <th>Related Doctor</th>
                          <th>Upload Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report) => (
                          <tr key={report._id}>
                            <td>
                              <div className="fw-bold">{report.title}</div>
                              <div className="text-secondary small">{report.description}</div>
                            </td>
                            <td>{report.doctor?.user?.name ? `Dr. ${report.doctor.user.name}` : 'General'}</td>
                            <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <a
                                  href={report.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-outline-primary btn-xs rounded-pill"
                                >
                                  View File
                                </a>
                                <button
                                  onClick={() => handleDeleteReport(report._id)}
                                  className="btn btn-outline-danger btn-xs rounded-pill"
                                  disabled={actionLoading}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Upload Report Form */}
            {activeTab === 'upload_report' && (
              <div>
                <h4 className="fw-bold mb-4">Share Medical Records</h4>
                <form onSubmit={handleReportUpload} className="d-flex flex-column gap-3.5">
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Document Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Heart Rate ECG Chart, Blood Glucose Test"
                      value={reportForm.title}
                      onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Description / Symptoms</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Describe what this report evaluates..."
                      value={reportForm.description}
                      onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Link to Specialist Doctor (Optional)</label>
                    <select
                      className="form-select"
                      value={reportForm.doctorId}
                      onChange={(e) => setReportForm({ ...reportForm, doctorId: e.target.value })}
                    >
                      <option value="">None (Keep private)</option>
                      {doctorsList.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          Dr. {doc.user?.name} - {doc.specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Attachment File (PDF, Images)</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setReportForm({ ...reportForm, file: e.target.files[0] })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary rounded-pill fw-bold py-2.5 mt-3 shadow-sm" disabled={actionLoading}>
                    {actionLoading ? 'Uploading records...' : 'Upload Medical Report'}
                  </button>
                </form>
              </div>
            )}

            {/* Tab 4: Profile Editor */}
            {activeTab === 'profile' && (
              <div>
                <h4 className="fw-bold mb-4">Patient Profile Manager</h4>
                <form onSubmit={handleProfileSubmit} className="d-flex flex-column gap-3.5">
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Residential Address</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. 123 Health Ave, suite 4B"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary rounded-pill fw-bold py-2.5 mt-3 shadow-sm" disabled={actionLoading}>
                    {actionLoading ? 'Saving updates...' : 'Save Profile Settings'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
