import { useState, useEffect } from 'react';
import {
  FaUsers,
  FaUserMd,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaUserShield,
  FaBroadcastTower,
  FaFileCode,
  FaCheck,
  FaTimes,
  FaUserSlash,
  FaUserCheck,
} from 'react-icons/fa';
import api from '../../services/api';

const AdminDashboard = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('analytics');

  // Admin stats
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [aiChats, setAiChats] = useState([]);

  // Form states
  const [broadcastForm, setBroadcastForm] = useState({ targetRole: 'all', title: '', message: '' });

  // Loaders
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, aiRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/users'),
        api.get('/admin/ai-logs'),
      ]);
      setStats(statsRes.data.data);
      setPendingDoctors(statsRes.data.data.pendingDoctors || []);
      setUsers(usersRes.data.data);
      setAiChats(aiRes.data.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const triggerMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Doctor Approvals
  const handleDoctorApproval = async (docId, status) => {
    setActionLoading(true);
    try {
      await api.patch(`/doctors/${docId}/status`, { status });
      triggerMessage(`Doctor registration status updated to ${status}.`);
      fetchAdminData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to update status.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // User Suspensions
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      triggerMessage(`User status changed to ${nextStatus}.`);
      fetchAdminData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to update user status.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // User Deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/users/${userId}`);
      triggerMessage('User deleted successfully.');
      fetchAdminData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to delete user.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Broadcast announcement
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) return;
    setActionLoading(true);
    try {
      await api.post('/admin/broadcast', broadcastForm);
      triggerMessage('Broadcast announcement sent to matching users.');
      setBroadcastForm({ targetRole: 'all', title: '', message: '' });
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Broadcast failed.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 w-100">
        <div className="spinner-border text-primary" role="status" />
        <span className="mt-3 text-secondary">Loading admin panel analytics...</span>
      </div>
    );
  }

  const { cards = {}, charts = {} } = stats || {};

  return (
    <div className="dashboard-container container py-4 w-100">
      {/* Alert Notifications */}
      {message.text && (
        <div className={`alert alert-${message.type} rounded-4 shadow-sm mb-4`} role="alert">
          {message.text}
        </div>
      )}

      {/* Admin Title Card */}
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
        <h2 className="fw-bold mb-1">Administrative Workspace</h2>
        <p className="text-secondary mb-0">Monitor doctor registries, audit patient growth trends, and review system logs.</p>
      </div>

      {/* Global Counters */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-sm-6">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white h-100">
            <h3 className="fw-bold text-primary display-6 mb-1">{cards.totalUsers}</h3>
            <span className="text-secondary small fw-semibold">Total Accounts</span>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white h-100">
            <h3 className="fw-bold text-success display-6 mb-1">{cards.doctors}</h3>
            <span className="text-secondary small fw-semibold">Registered Doctors</span>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white h-100">
            <h3 className="fw-bold text-warning display-6 mb-1">{cards.appointments}</h3>
            <span className="text-secondary small fw-semibold">Appointments Scheduled</span>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white h-100">
            <h3 className="fw-bold text-info display-6 mb-1">${cards.revenue}</h3>
            <span className="text-secondary small fw-semibold">Total Earnings Revenue</span>
          </div>
        </div>
      </div>

      {/* Tab controls */}
      <div className="row g-4">
        <div className="col-lg-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white d-flex flex-column gap-1.5">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'analytics' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaUserShield className="me-2" /> Analytics & Trends
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'approvals' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaUserMd className="me-2" /> Doctor Approvals
              {pendingDoctors.length > 0 && (
                <span className="badge rounded-pill bg-danger ms-2">{pendingDoctors.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'users' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaUsers className="me-2" /> Account Managers
            </button>
            <button
              onClick={() => setActiveTab('ai_logs')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'ai_logs' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaFileCode className="me-2" /> AI Assistant Logs
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'broadcast' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaBroadcastTower className="me-2" /> System Broadcast
            </button>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
            {/* Tab 1: SVG Charts & Trends */}
            {activeTab === 'analytics' && (
              <div>
                <h4 className="fw-bold mb-4">MERN Platform Dashboard Activity</h4>
                <div className="row g-4">
                  {/* Monthly appointments SVG chart */}
                  <div className="col-md-6">
                    <div className="border rounded-4 p-3 h-100 bg-light-subtle">
                      <h6 className="fw-bold text-secondary mb-3">Appointments Scheduled (Monthly)</h6>
                      <div className="d-flex align-items-end justify-content-around bg-white p-3 rounded-3" style={{ height: '180px' }}>
                        {charts.appointmentsChart?.map((pt) => (
                          <div key={pt.name} className="d-flex flex-column align-items-center w-100">
                            <div
                              className="bg-primary rounded-top-2 w-50 transition-all hover-opacity-80"
                              style={{ height: `${Math.min(120, (pt.value || 0) * 15 + 4)}px` }}
                              title={`Appointments: ${pt.value}`}
                            />
                            <span className="small text-muted mt-2 fw-semibold" style={{ fontSize: '0.75rem' }}>{pt.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Patient Growth SVG chart */}
                  <div className="col-md-6">
                    <div className="border rounded-4 p-3 h-100 bg-light-subtle">
                      <h6 className="fw-bold text-secondary mb-3">Patient Growth Index</h6>
                      <div className="d-flex align-items-end justify-content-around bg-white p-3 rounded-3" style={{ height: '180px' }}>
                        {charts.patientGrowthChart?.map((pt) => (
                          <div key={pt.name} className="d-flex flex-column align-items-center w-100">
                            <div
                              className="bg-success rounded-top-2 w-50 transition-all hover-opacity-80"
                              style={{ height: `${Math.min(120, (pt.value || 0) * 18 + 4)}px` }}
                              title={`New Patients: ${pt.value}`}
                            />
                            <span className="small text-muted mt-2 fw-semibold" style={{ fontSize: '0.75rem' }}>{pt.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Doctor Popularity Chart */}
                  <div className="col-12 mt-4">
                    <div className="border rounded-4 p-3 bg-light-subtle">
                      <h6 className="fw-bold text-secondary mb-3">Doctor Slot Bookings (Popularity ranking)</h6>
                      <div className="d-flex flex-column gap-3.5 bg-white p-3 rounded-3">
                        {charts.doctorPopularityChart?.length === 0 ? (
                          <div className="text-center text-muted small py-3">No bookings tracked.</div>
                        ) : (
                          charts.doctorPopularityChart?.map((doc, idx) => (
                            <div key={idx}>
                              <div className="d-flex justify-content-between small fw-semibold text-secondary mb-1">
                                <span>Dr. {doc.name}</span>
                                <span>{doc.value} Appointments</span>
                              </div>
                              <div className="progress rounded-pill" style={{ height: '8px' }}>
                                <div
                                  className="progress-bar rounded-pill bg-info"
                                  style={{ width: `${Math.min(100, (doc.value / Math.max(...charts.doctorPopularityChart.map(d=>d.value))) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Doctor Approvals */}
            {activeTab === 'approvals' && (
              <div>
                <h4 className="fw-bold mb-4">Pending Doctor Registrations</h4>
                {pendingDoctors.length === 0 ? (
                  <p className="text-muted text-center py-4">No pending doctor registrations requiring audit.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {pendingDoctors.map((doc) => (
                      <div key={doc._id} className="border rounded-4 p-3 hover-bg-light transition-all">
                        <div className="row g-3 align-items-center">
                          <div className="col-md-2 text-center text-md-start">
                            <img
                              src={doc.user?.profilePhoto || 'https://picsum.photos/id/47/300/300'}
                              alt={doc.user?.name}
                              className="rounded-circle object-fit-cover shadow-xs"
                              style={{ width: '60px', height: '60px' }}
                            />
                          </div>
                          <div className="col-md-7 text-center text-md-start">
                            <h6 className="fw-bold mb-1">Dr. {doc.user?.name}</h6>
                            <p className="text-primary small mb-1">{doc.specialty}</p>
                            <div className="small text-secondary mb-1">Email: {doc.user?.email}</div>
                            <div className="small text-secondary">License: <span className="fw-bold text-dark">{doc.licenseNumber || 'N/A'}</span></div>
                          </div>
                          <div className="col-md-3 text-center text-md-end">
                            <div className="d-flex gap-2 justify-content-center justify-content-md-end">
                              <button
                                onClick={() => handleDoctorApproval(doc._id, 'approved')}
                                className="btn btn-success btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
                                disabled={actionLoading}
                              >
                                <FaCheck /> Approve
                              </button>
                              <button
                                onClick={() => handleDoctorApproval(doc._id, 'rejected')}
                                className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                disabled={actionLoading}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Users Accounts management */}
            {activeTab === 'users' && (
              <div>
                <h4 className="fw-bold mb-4">Account Administration Directory</h4>
                <div className="table-responsive">
                  <table className="table align-middle table-hover small">
                    <thead className="table-light">
                      <tr>
                        <th>User Name</th>
                        <th>Email ID</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((usr) => (
                        <tr key={usr._id}>
                          <td className="fw-bold">{usr.name}</td>
                          <td>{usr.email}</td>
                          <td className="text-uppercase small">{usr.role}</td>
                          <td>
                            <span className={`badge px-2 py-1 rounded-pill ${
                              usr.status === 'suspended' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'
                            }`}>
                              {usr.status || 'active'}
                            </span>
                          </td>
                          <td>
                            {usr.role !== 'admin' && (
                              <div className="d-flex gap-2">
                                <button
                                  onClick={() => handleToggleUserStatus(usr._id, usr.status)}
                                  className={`btn btn-xs rounded-pill d-flex align-items-center gap-1 ${
                                    usr.status === 'suspended' ? 'btn-success' : 'btn-warning text-dark'
                                  }`}
                                  disabled={actionLoading}
                                >
                                  {usr.status === 'suspended' ? <FaUserCheck /> : <FaUserSlash />}
                                  {usr.status === 'suspended' ? 'Activate' : 'Suspend'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(usr._id)}
                                  className="btn btn-xs btn-outline-danger rounded-pill"
                                  disabled={actionLoading}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: AI chat logs auditor */}
            {activeTab === 'ai_logs' && (
              <div>
                <h4 className="fw-bold mb-4">Platform Conversational AI Logs</h4>
                {aiChats.length === 0 ? (
                  <p className="text-muted text-center py-4">No AI diagnostic queries logged in system.</p>
                ) : (
                  <div className="d-flex flex-column gap-3.5">
                    {aiChats.map((chat) => (
                      <div key={chat._id} className="border rounded-4 p-3 bg-light-subtle">
                        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-light">
                          <div>
                            <span className="fw-bold text-dark small">{chat.user?.name || 'Anonymous User'}</span>
                            <span className="text-muted small ms-2">({chat.user?.email || 'N/A'})</span>
                          </div>
                          <span className="text-muted small">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                        </div>

                        {/* Messages sub list */}
                        <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '200px' }}>
                          {chat.messages?.map((msg, idx) => (
                            <div key={idx} className="small">
                              <span className={`fw-bold text-uppercase ${msg.role === 'user' ? 'text-primary' : 'text-success'}`}>
                                {msg.role}:
                              </span>
                              <span className="text-secondary ms-2">{msg.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Broadcast Announcements */}
            {activeTab === 'broadcast' && (
              <div>
                <h4 className="fw-bold mb-2">Broadcast System Alerts</h4>
                <p className="text-secondary small mb-4">Send a broadcast alert to user categories in real-time using Socket.io.</p>

                <form onSubmit={handleBroadcastSubmit} className="d-flex flex-column gap-3.5">
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Target Recipient Role</label>
                    <select
                      className="form-select"
                      value={broadcastForm.targetRole}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                    >
                      <option value="all">All Registered Users</option>
                      <option value="patient">Patients Only</option>
                      <option value="doctor">Doctors Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Alert Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Scheduled System Upgrade"
                      value={broadcastForm.title}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Alert Message</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Describe detail information to broadcast..."
                      value={broadcastForm.message}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary rounded-pill fw-bold py-2.5 mt-3 shadow-sm" disabled={actionLoading}>
                    {actionLoading ? 'Broadcasting...' : 'Broadcast Alert Message'}
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

export default AdminDashboard;
