import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FaClipboardList,
  FaCalendarCheck,
  FaFileMedical,
  FaUserFriends,
  FaClock,
  FaCommentDots,
  FaMoneyBillWave,
  FaCheck,
  FaTimes,
  FaCalendarPlus,
  FaPaperPlane,
  FaUserCog,
} from 'react-icons/fa';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

const DoctorDashboard = () => {
  const { user } = useAuth();

  // Navigation
  const [activeTab, setActiveTab] = useState('appointments');

  // Dashboard records
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patientReports, setPatientReports] = useState([]);

  // Chats management
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { user: {} }
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Availability config state
  const [availability, setAvailability] = useState([]);

  // Status & loaders
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Reschedule status
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    specialty: '',
    experienceYears: 0,
    fees: 0,
    clinicAddress: '',
    bio: '',
    licenseNumber: '',
    qualifications: '',
    education: '',
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get logged-in doctor's profile securely
      const profileRes = await api.get('/doctors/profile/me');
      const currentDoc = profileRes.data.data;
      if (currentDoc) {
        setDoctorProfile(currentDoc);
        setAvailability(currentDoc.availability || []);
        setProfileForm({
          name: currentDoc.user?.name || user?.name || '',
          phone: currentDoc.user?.phone || user?.phone || '',
          address: currentDoc.user?.address || user?.address || '',
          specialty: currentDoc.specialty || '',
          experienceYears: currentDoc.experienceYears || 0,
          fees: currentDoc.fees || 0,
          clinicAddress: currentDoc.clinicAddress || '',
          bio: currentDoc.bio || '',
          licenseNumber: currentDoc.licenseNumber || '',
          qualifications: currentDoc.qualifications?.join(', ') || '',
          education: currentDoc.education?.join(', ') || '',
        });

        // Load appointments and patient reports matching this doctor
        const [apptRes, reportsRes] = await Promise.all([
          api.get('/appointments'),
          api.get(`/reports/patient/${user._id}`).catch(() => ({ data: { data: [] } })), // fallback
        ]);
        setAppointments(apptRes.data.data);

        // Fetch reports for patients who have booked appointments
        const patientIds = [...new Set(apptRes.data.data.map((a) => a.patient?._id).filter(Boolean))];
        const reportsList = [];
        for (const pId of patientIds) {
          try {
            const pRep = await api.get(`/reports/patient/${pId}`);
            reportsList.push(...pRep.data.data);
          } catch (e) {
            console.error('Error loading reports for patient', pId, e);
          }
        }
        setPatientReports(reportsList);
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchConversations();
  }, []);

  // Listen for live messages if socket is open
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new_message', (msg) => {
      // Refresh conversation list
      fetchConversations();
      // If active conversation matches sender, append message
      if (activeChat && (msg.sender._id === activeChat.user._id || msg.recipient._id === activeChat.user._id)) {
        setChatMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [activeChat]);

  // Scroll active chat panel
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChat]);

  const triggerMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Appointment Status Updates
  const handleUpdateStatus = async (apptId, status) => {
    setActionLoading(true);
    try {
      await api.put(`/appointments/${apptId}`, { status });
      triggerMessage(`Appointment status updated to ${status}.`);
      fetchDashboardData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to update appointment.', 'danger');
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

  // Availability setup
  const handleAddSlot = (day, slot) => {
    const existingDay = availability.find((a) => a.day === day);
    let updatedAvailability = [];

    if (existingDay) {
      if (existingDay.slots.includes(slot)) return; // already added
      updatedAvailability = availability.map((a) =>
        a.day === day ? { ...a, slots: [...a.slots, slot] } : a
      );
    } else {
      updatedAvailability = [...availability, { day, slots: [slot] }];
    }
    setAvailability(updatedAvailability);
  };

  const handleRemoveSlot = (day, slot) => {
    const updatedAvailability = availability
      .map((a) => {
        if (a.day === day) {
          return { ...a, slots: a.slots.filter((s) => s !== slot) };
        }
        return a;
      })
      .filter((a) => a.slots.length > 0); // remove day if empty
    setAvailability(updatedAvailability);
  };

  const handleSaveAvailability = async () => {
    setActionLoading(true);
    try {
      await api.put(`/doctors/${doctorProfile._id}`, { availability });
      triggerMessage('Availability hours updated successfully!');
      fetchDashboardData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to save availability.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Active Chats Actions
  const handleSelectConversation = async (convo) => {
    setActiveChat(convo);
    setChatLoading(true);
    try {
      const res = await api.get(`/messages/history/${convo.user._id}`);
      setChatMessages(res.data.data);
      // Mark read
      await api.post('/messages/read', { partnerId: convo.user._id });
      fetchConversations(); // refresh unread counters
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat) return;

    const payload = {
      recipientId: activeChat.user._id,
      text: chatInput,
    };
    setChatInput('');
    try {
      const res = await api.post('/messages', payload);
      setChatMessages((prev) => [...prev, res.data.data]);
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put('/users/me', {
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
      });

      const qualificationsArray = profileForm.qualifications
        ? profileForm.qualifications.split(',').map((q) => q.trim()).filter(Boolean)
        : [];
      const educationArray = profileForm.education
        ? profileForm.education.split(',').map((ed) => ed.trim()).filter(Boolean)
        : [];

      await api.put(`/doctors/${doctorProfile._id}`, {
        specialty: profileForm.specialty,
        experienceYears: parseInt(profileForm.experienceYears, 10) || 0,
        fees: parseFloat(profileForm.fees) || 0,
        clinicAddress: profileForm.clinicAddress,
        bio: profileForm.bio,
        licenseNumber: profileForm.licenseNumber,
        qualifications: qualificationsArray,
        education: educationArray,
      });

      triggerMessage('Workspace profile details updated successfully!');
      fetchDashboardData();
    } catch (err) {
      triggerMessage(err.response?.data?.message || 'Failed to update workspace profile.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics Calculations
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const activeBookingsCount = appointments.filter((a) => ['approved', 'rescheduled'].includes(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const totalRevenue = completedCount * (doctorProfile?.fees || 0);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 w-100">
        <div className="spinner-border text-primary" role="status" />
        <span className="mt-3 text-secondary">Loading doctor workspace...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container container py-4 w-100">
      {/* Action Messages */}
      {message.text && (
        <div className={`alert alert-${message.type} rounded-4 shadow-sm mb-4`} role="alert">
          {message.text}
        </div>
      )}

      {/* Headline Header */}
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="fw-bold mb-1">Doctor Workspace</h2>
            <p className="text-secondary mb-0">
              Dr. {doctorProfile?.user?.name} | {doctorProfile?.specialty || 'General Practitioner'} |{' '}
              <span className="badge bg-success-subtle text-success text-capitalize">{doctorProfile?.status}</span>
            </p>
          </div>
          <div className="d-flex gap-2">
            <button onClick={() => setActiveTab('slots')} className="btn btn-outline-primary rounded-pill px-4 small">
              Availability Setup
            </button>
            <button onClick={() => setActiveTab('chats')} className="btn btn-primary rounded-pill px-4 small d-flex align-items-center gap-1.5">
              <FaCommentDots /> Message Patients
            </button>
          </div>
        </div>
      </div>

      {/* Doctor Analytics Panel */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white h-100">
            <h3 className="fw-bold text-warning display-6 mb-1">{pendingCount}</h3>
            <span className="text-secondary small fw-semibold">Pending Requests</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white h-100">
            <h3 className="fw-bold text-primary display-6 mb-1">{activeBookingsCount}</h3>
            <span className="text-secondary small fw-semibold">Upcoming Bookings</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white h-100">
            <h3 className="fw-bold text-success display-6 mb-1">{completedCount}</h3>
            <span className="text-secondary small fw-semibold">Consultations Completed</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white h-100">
            <h3 className="fw-bold text-success display-6 mb-1">${totalRevenue}</h3>
            <span className="text-secondary small fw-semibold">Revenue Earnings</span>
          </div>
        </div>
      </div>

      {/* Work Tabs content */}
      <div className="row g-4">
        <div className="col-lg-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white d-flex flex-column gap-1.5">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'appointments' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaClipboardList className="me-2" /> Booking Requests
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'reports' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaFileMedical className="me-2" /> Shared Patient Reports
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'slots' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaClock className="me-2" /> Consultation Hours
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`btn text-start rounded-3 px-3 py-2 fw-semibold border-0 ${
                activeTab === 'chats' ? 'btn-primary shadow-xs' : 'btn-light text-dark'
              }`}
            >
              <FaCommentDots className="me-2" /> Chat Dashboard
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

        <div className="col-lg-9">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
            {/* Tab 1: Appointments management */}
            {activeTab === 'appointments' && (
              <div>
                <h4 className="fw-bold mb-4">Patient Consultations Schedule</h4>
                {appointments.length === 0 ? (
                  <p className="text-muted text-center py-5">No patient bookings scheduled at this time.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {appointments.map((appt) => {
                      const patientUser = appt.patient || {};
                      const isPending = appt.status === 'pending';
                      const isApproved = appt.status === 'approved' || appt.status === 'rescheduled';

                      return (
                        <div key={appt._id} className="border rounded-4 p-3 hover-bg-light transition-all">
                          <div className="row g-3 align-items-center">
                            <div className="col-sm-2 text-center text-sm-start">
                              <img
                                src={patientUser.profilePhoto || 'https://picsum.photos/id/64/300/300'}
                                alt={patientUser.name}
                                className="rounded-circle object-fit-cover shadow-xs"
                                style={{ width: '60px', height: '60px' }}
                                onError={(e) => {
                                  e.target.src = 'https://picsum.photos/id/64/300/300';
                                }}
                              />
                            </div>
                            <div className="col-sm-6 text-center text-sm-start">
                              <h6 className="fw-bold mb-1">{patientUser.name || 'Patient'}</h6>
                              <div className="small text-secondary mb-1">
                                Date: {new Date(appt.appointmentDate).toLocaleString()}
                              </div>
                              <p className="small text-muted mb-0 italic">Reason: "{appt.reason}"</p>
                              {patientUser.phone && <div className="small text-secondary mt-1">Phone: {patientUser.phone}</div>}
                            </div>
                            <div className="col-sm-4 text-center text-sm-end">
                              <span className={`badge px-2.5 py-1.5 rounded-pill mb-2 text-capitalize ${
                                appt.status === 'approved' ? 'bg-success-subtle text-success' :
                                appt.status === 'completed' ? 'bg-primary-subtle text-primary' :
                                appt.status === 'cancelled' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'
                              }`}>
                                {appt.status}
                              </span>

                              <div className="d-flex gap-1.5 justify-content-center justify-content-sm-end mt-2">
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateStatus(appt._id, 'approved')}
                                      className="btn btn-xs btn-success rounded-pill px-2.5 fw-bold"
                                      disabled={actionLoading}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(appt._id, 'rejected')}
                                      className="btn btn-xs btn-outline-danger rounded-pill px-2.5"
                                      disabled={actionLoading}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {isApproved && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateStatus(appt._id, 'completed')}
                                      className="btn btn-xs btn-success rounded-pill px-2.5 fw-bold"
                                      disabled={actionLoading}
                                    >
                                      Mark Completed
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRescheduleAppt(appt);
                                        setRescheduleDate(new Date(appt.appointmentDate).toISOString().slice(0, 16));
                                      }}
                                      className="btn btn-xs btn-outline-warning rounded-pill px-2.5"
                                      disabled={actionLoading}
                                    >
                                      Reschedule
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

                {/* Reschedule Box */}
                {rescheduleAppt && (
                  <div className="card shadow-xs border-0 rounded-4 mt-4 p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Propose New Date/Time</h6>
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
                        Confirm Reschedule
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Shared Reports */}
            {activeTab === 'reports' && (
              <div>
                <h4 className="fw-bold mb-4">Patient Shared Records Folder</h4>
                {patientReports.length === 0 ? (
                  <p className="text-muted text-center py-4">No patient reports have been shared with you.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle table-hover small">
                      <thead className="table-light">
                        <tr>
                          <th>Patient Name</th>
                          <th>Report Title</th>
                          <th>Upload Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientReports.map((report) => (
                          <tr key={report._id}>
                            <td>{report.patient?.name || 'Patient'}</td>
                            <td>
                              <div className="fw-bold">{report.title}</div>
                              <div className="text-secondary small">{report.description}</div>
                            </td>
                            <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                            <td>
                              <a
                                href={report.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary btn-xs rounded-pill"
                              >
                                View File
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Consultation Slots Setup */}
            {activeTab === 'slots' && (
              <div>
                <h4 className="fw-bold mb-2">Weekly Consultation Hours Setup</h4>
                <p className="text-secondary small mb-4">Add or remove time slots across days of the week. Patients can book these online.</p>

                <div className="d-flex flex-column gap-4">
                  {DAYS.map((day) => {
                    const dayObj = availability.find((a) => a.day === day) || { day, slots: [] };
                    return (
                      <div key={day} className="border-bottom pb-3">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2">
                          <h6 className="fw-bold text-primary mb-0">{day}</h6>
                          <div className="d-flex flex-wrap gap-1">
                            {DEFAULT_SLOTS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleAddSlot(day, s)}
                                className="btn btn-xs btn-outline-secondary rounded-pill"
                              >
                                + {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {dayObj.slots.length === 0 ? (
                          <span className="text-muted small italic">No consultation slots configured.</span>
                        ) : (
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {dayObj.slots.map((slot) => (
                              <span
                                key={slot}
                                className="badge bg-primary text-white rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 small"
                              >
                                {slot}
                                <FaTimes className="cursor-pointer" onClick={() => handleRemoveSlot(day, slot)} />
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={handleSaveAvailability}
                    className="btn btn-primary rounded-pill fw-bold py-2.5 mt-3 shadow-sm align-self-start"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving config...' : 'Save Availability Hours'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Chat room with patients */}
            {activeTab === 'chats' && (
              <div className="row g-0 rounded-4 overflow-hidden border" style={{ height: '500px' }}>
                {/* Conversations list sidebar */}
                <div className="col-4 border-end bg-light overflow-auto h-100">
                  <div className="bg-white p-3 border-bottom fw-bold text-secondary text-uppercase small" style={{ letterSpacing: '0.5px' }}>
                    Active Chats
                  </div>
                  {conversations.length === 0 ? (
                    <div className="p-3 text-center text-muted small mt-4">No active conversations.</div>
                  ) : (
                    conversations.map((convo) => {
                      const partner = convo.user || {};
                      const isSelected = activeChat && activeChat.user._id === partner._id;
                      return (
                        <div
                          key={partner._id}
                          onClick={() => handleSelectConversation(convo)}
                          className={`p-3 border-bottom cursor-pointer hover-bg-light transition-all d-flex align-items-center gap-2.5 ${
                            isSelected ? 'bg-primary-subtle border-start border-primary border-3' : ''
                          }`}
                        >
                          <img
                            src={partner.profilePhoto || 'https://picsum.photos/id/64/300/300'}
                            alt={partner.name}
                            className="rounded-circle object-fit-cover shadow-xs"
                            style={{ width: '40px', height: '40px' }}
                          />
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="fw-bold small text-truncate">{partner.name || 'Patient'}</div>
                            <div className="text-secondary small text-truncate">{convo.lastMessage?.text || 'Attachment file'}</div>
                          </div>
                          {convo.unreadCount > 0 && (
                            <span className="badge rounded-pill bg-danger">{convo.unreadCount}</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Conversation area */}
                <div className="col-8 d-flex flex-column h-100 bg-white">
                  {!activeChat ? (
                    <div className="m-auto text-center text-muted p-4">
                      <FaCommentDots className="display-4 text-muted mb-2" />
                      <h6>Patient Messaging Desk</h6>
                      <p className="small">Select a patient from the sidebar list to view histories or message them.</p>
                    </div>
                  ) : (
                    <>
                      {/* Active Chat Header */}
                      <div className="p-3 border-bottom d-flex align-items-center gap-2.5 bg-light">
                        <img
                          src={activeChat.user.profilePhoto || 'https://picsum.photos/id/64/300/300'}
                          alt={activeChat.user.name}
                          className="rounded-circle object-fit-cover shadow-xs"
                          style={{ width: '38px', height: '38px' }}
                        />
                        <h6 className="fw-bold mb-0">{activeChat.user.name}</h6>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3.5 bg-light-subtle">
                        {chatLoading ? (
                          <div className="m-auto spinner-border text-primary spinner-border-sm" />
                        ) : (
                          chatMessages.map((msg) => {
                            const isMe = msg.sender._id === user._id;
                            return (
                              <div key={msg._id} className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div
                                  className={`p-2.5 rounded-3 max-width-75 shadow-xs small ${
                                    isMe ? 'bg-primary text-white rounded-br-0' : 'bg-white text-dark border rounded-bl-0'
                                  }`}
                                >
                                  <div>{msg.text}</div>
                                  <div className="text-end small opacity-70 mt-1" style={{ fontSize: '0.65rem' }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Send Form */}
                      <form onSubmit={handleSendMessage} className="p-2 border-top bg-white d-flex gap-2">
                        <input
                          type="text"
                          className="form-control rounded-pill border-light ps-3 small"
                          placeholder="Type your medical response..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                          <FaPaperPlane size={14} />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h4 className="fw-bold mb-4">Workspace Profile Settings</h4>
                <form onSubmit={handleProfileSubmit} className="d-flex flex-column gap-3.5">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Contact Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +1 (555) 019-2834"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Medical Specialty</label>
                      <select
                        className="form-select"
                        value={profileForm.specialty}
                        onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                        required
                      >
                        <option value="">Select Specialty</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Gynecology">Gynecology</option>
                        <option value="Ophthalmology">Ophthalmology</option>
                        <option value="Psychiatry">Psychiatry</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Medical License Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileForm.licenseNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Qualifications (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. MD, MBBS, FACC"
                        value={profileForm.qualifications}
                        onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Education/Training (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Harvard Medical School, Johns Hopkins"
                        value={profileForm.education}
                        onChange={(e) => setProfileForm({ ...profileForm, education: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={profileForm.experienceYears}
                        onChange={(e) => setProfileForm({ ...profileForm, experienceYears: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Consultation Fees ($)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={profileForm.fees}
                        onChange={(e) => setProfileForm({ ...profileForm, fees: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label small fw-semibold text-secondary">Clinic Address</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. 100 Main St, Suite 200, Boston, MA"
                      value={profileForm.clinicAddress}
                      onChange={(e) => setProfileForm({ ...profileForm, clinicAddress: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label small fw-semibold text-secondary">Residential/Mailing Address</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. 45 Oak St, Newton, MA"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label small fw-semibold text-secondary">Biography (Bio)</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Share your medical background, treatment philosophies..."
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary rounded-pill fw-bold py-2.5 mt-3 shadow-sm" disabled={actionLoading}>
                    {actionLoading ? 'Saving updates...' : 'Save Workspace Profile'}
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

export default DoctorDashboard;
