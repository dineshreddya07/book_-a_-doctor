import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaBell,
  FaRobot,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaUserCircle,
  FaStethoscope,
  FaClipboardList,
  FaChartLine,
  FaTimes,
  FaPaperPlane,
} from 'react-icons/fa';
import api from '../services/api';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';

const MainLayout = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifDropdownRef = useRef(null);

  // Floating AI chatbot state
  const [showFloatingAi, setShowFloatingAi] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { role: 'model', content: 'Hello! I am your AI Health Assistant. How can I help you today? Please note that my advice is informational and does not replace a doctor consultation.' },
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Handle Theme Toggle
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Handle Socket.io and Notifications
  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      setNotifications([]);
      return;
    }

    // Initialize Socket
    const socket = initSocket(token);

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifications();

    // Listen for realtime notifications
    socket.on('notification', ({ type, payload }) => {
      setNotifications((prev) => [payload, ...prev]);
    });

    return () => {
      socket.off('notification');
      disconnectSocket();
    };
  }, [token, user]);

  // Click outside notification dropdown to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to bottom of floating AI chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, showFloatingAi]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleDeleteNotif = async (notifId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notifId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Submit message to floating AI chat
  const handleFloatingAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMessage = aiInput;
    setAiMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await api.post('/ai/chat', { mode: 'assistant', input: userMessage });
      const aiReply = res.data.data.response;
      setAiMessages((prev) => [...prev, { role: 'model', content: aiReply }]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Sorry, I am having trouble connecting right now. Please try again.' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="app-shell d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <header className="topbar sticky-top py-2.5 px-3 px-md-5">
        <Link to="/" className="brand d-flex align-items-center gap-2">
          <span className="logo-icon bg-primary text-white d-flex align-items-center justify-content-center rounded-3" style={{ width: '36px', height: '36px' }}>
            <FaStethoscope size={18} />
          </span>
          <span className="brand-text fw-bold text-primary">MedCare</span>
        </Link>

        <nav className="nav-links d-flex align-items-center gap-3">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            Home
          </NavLink>
          <NavLink to="/doctors" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            Doctors
          </NavLink>

          {user && (
            <>
              {user.role === 'patient' && (
                <NavLink to="/patient" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                  <FaClipboardList className="me-1.5" /> Dashboard
                </NavLink>
              )}
              {user.role === 'doctor' && (
                <NavLink to="/doctor" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                  <FaStethoscope className="me-1.5" /> Workspace
                </NavLink>
              )}
              {user.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                  <FaChartLine className="me-1.5" /> Admin
                </NavLink>
              )}
              <NavLink to="/ai" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                AI Assistant
              </NavLink>
            </>
          )}

          {!user ? (
            <>
              <Link to="/login" className="btn btn-sm btn-outline-primary rounded-pill px-3.5 py-1.5 fw-semibold text-decoration-none">
                Login
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-semibold text-decoration-none shadow-sm">
                Register
              </Link>
            </>
          ) : (
            <div className="d-flex align-items-center gap-2">
              {/* Notification Bell */}
              <div className="position-relative" ref={notifDropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="nav-icon-btn p-2 rounded-circle border-0 bg-transparent text-secondary position-relative transition-all"
                >
                  <FaBell size={18} />
                  {unreadCount > 0 && (
                    <span className="position-absolute top-1 start-75 translate-middle badge rounded-pill bg-danger border border-white p-1" style={{ fontSize: '0.65rem' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="dropdown-menu show position-absolute end-0 mt-2 shadow border-0 rounded-4 p-0 overflow-hidden" style={{ width: '320px', zIndex: 1050 }}>
                    <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
                      <span className="fw-bold">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="btn btn-sm btn-link text-white text-decoration-none p-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notification-list overflow-auto" style={{ maxHeight: '280px' }}>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted small">No new notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => {
                              handleMarkRead(notif._id);
                              if (notif.link) {
                                navigate(notif.link);
                              }
                              setShowNotifications(false);
                            }}
                            className={`p-3 border-bottom border-light cursor-pointer hover-bg-light transition-all small d-flex gap-2.5 align-items-start ${
                              !notif.isRead ? 'bg-primary-subtle' : ''
                            }`}
                          >
                            <div className="flex-grow-1">
                              <div className="fw-bold text-dark mb-0.5">{notif.title}</div>
                              <div className="text-secondary">{notif.message}</div>
                              <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotif(notif._id, e)}
                              className="btn btn-close btn-sm p-0 m-0"
                              style={{ width: '8px', height: '8px', opacity: 0.5 }}
                              aria-label="Delete"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity info */}
              <div className="d-none d-md-flex flex-column text-end small me-1">
                <span className="fw-bold text-dark">{user.name}</span>
                <span className="text-muted text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>{user.role}</span>
              </div>

              <button onClick={logout} className="nav-icon-btn p-2 rounded-circle border-0 bg-transparent text-danger transition-all" title="Logout">
                <FaSignOutAlt size={18} />
              </button>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="nav-icon-btn p-2 rounded-circle border-0 bg-transparent text-secondary transition-all"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <FaSun size={18} className="text-warning" /> : <FaMoon size={18} />}
          </button>
        </nav>
      </header>

      {/* Main Page Area */}
      <main className="page-content flex-grow-1">
        <Outlet />
      </main>

      {/* Floating AI chatbot bubble */}
      {user && (
        <div className="floating-ai-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1040 }}>
          {showFloatingAi ? (
            <div className="card shadow-lg border-0 rounded-4 floating-ai-box overflow-hidden mb-3" style={{ width: '350px', height: '450px' }}>
              <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2 fw-bold">
                  <FaRobot size={20} className="floating-bob" />
                  <span>AI Assistant</span>
                </div>
                <button onClick={() => setShowFloatingAi(false)} className="btn btn-sm text-white p-0">
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Message History */}
              <div className="card-body bg-light overflow-auto p-3 d-flex flex-column gap-3 small" style={{ height: 'calc(100% - 110px)' }}>
                {aiMessages.map((msg, index) => (
                  <div key={index} className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div
                      className={`p-2.5 rounded-3 max-width-80 shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-br-0'
                          : 'bg-white text-dark border rounded-bl-0'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="d-flex justify-content-start">
                    <div className="bg-white text-dark border p-2.5 rounded-3 rounded-bl-0 d-flex gap-1 align-items-center">
                      <span className="spinner-grow spinner-grow-sm text-primary" />
                      <span className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: '0.2s' }} />
                      <span className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleFloatingAiSubmit} className="p-2 border-top bg-white d-flex gap-2">
                <input
                  type="text"
                  className="form-control rounded-pill border-light ps-3 small"
                  placeholder="Ask a health query..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={aiLoading}
                />
                <button type="submit" className="btn btn-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }} disabled={aiLoading}>
                  <FaPaperPlane size={14} />
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowFloatingAi(true)}
              className="btn btn-primary rounded-circle shadow-lg p-3 d-flex align-items-center justify-content-center floating-ai-btn hover-scale"
              style={{ width: '56px', height: '56px' }}
            >
              <FaRobot size={24} className="floating-bob" />
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="footer bg-white border-top py-3 text-center small text-secondary mt-auto">
        <div className="container">
          &copy; {new Date().getFullYear()} MedCare Platform. All rights reserved. Registered medical advice only.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
