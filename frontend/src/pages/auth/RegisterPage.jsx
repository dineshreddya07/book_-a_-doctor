import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaStethoscope,
  FaUserInjured,
  FaCheckCircle,
  FaUserMd,
  FaRobot,
} from 'react-icons/fa';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSelectRole = (selectedRole) => {
    setForm({ ...form, role: selectedRole });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all standard inputs.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/me');
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map((e) => e.message).join(', '));
      } else {
        setError(err.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden mx-auto" style={{ maxWidth: '960px' }}>
        <div className="row g-0">
          {/* Left Column - Marketing Visuals (visible on md and up) */}
          <div className="col-md-5 d-none d-md-flex flex-column justify-content-between p-5 text-white position-relative" 
               style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
            <div>
              <div className="d-flex align-items-center gap-2 mb-4">
                <span className="bg-white text-primary d-flex align-items-center justify-content-center rounded-3" style={{ width: '40px', height: '40px' }}>
                  <FaStethoscope size={20} />
                </span>
                <span className="fw-bold fs-4">MedCare</span>
              </div>

              <h2 className="fw-bold lh-sm mb-3">Begin Your Digital Healthcare Journey</h2>
              <p className="opacity-95 text-light small mb-4">
                Create a secure credentials profile to access medical dashboards, book verified clinicians, and utilize context-aware AI assistants.
              </p>
            </div>

            <div className="d-flex flex-column gap-3.5 mt-5">
              <div className="d-flex align-items-center gap-3">
                <span className="bg-white bg-opacity-20 text-white rounded-circle p-2.5 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                  <FaStethoscope size={18} />
                </span>
                <div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>Verified Medical Specialists</h6>
                  <span className="opacity-80 small" style={{ fontSize: '0.75rem' }}>Top tier healthcare practitioners</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="bg-white bg-opacity-20 text-white rounded-circle p-2.5 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                  <FaRobot size={18} />
                </span>
                <div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>AI Diagnostics Triage</h6>
                  <span className="opacity-80 small" style={{ fontSize: '0.75rem' }}>Automated analysis of symptoms</span>
                </div>
              </div>
            </div>

            <div className="text-white opacity-60 small mt-5 pt-3 border-top border-white border-opacity-10">
              Secure patient encryption &bull; HIPAA Compliant
            </div>
          </div>

          {/* Right Column - Sleek Registration Form */}
          <div className="col-md-7 p-4 p-md-5 bg-white d-flex flex-column justify-content-center">
            <div className="mb-4">
              <h3 className="fw-bold text-dark mb-1">Create Account</h3>
              <p className="text-secondary small">Register secure credentials to enter MedCare workspace portals</p>
            </div>

            {error && (
              <div className="alert alert-danger border-0 rounded-3 py-2.5 px-3 mb-4 small d-flex align-items-center gap-2">
                <FaLock className="text-danger flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              {/* Full Name */}
              <div>
                <label className="form-label small fw-semibold text-secondary mb-1.5">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 border-2">
                    <FaUser className="text-muted" />
                  </span>
                  <input
                    name="name"
                    type="text"
                    className="form-control bg-light border-start-0 border-2 ps-1 py-2.5 small"
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="form-label small fw-semibold text-secondary mb-1.5">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 border-2">
                    <FaEnvelope className="text-muted" />
                  </span>
                  <input
                    name="email"
                    type="email"
                    className="form-control bg-light border-start-0 border-2 ps-1 py-2.5 small"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="form-label small fw-semibold text-secondary mb-1.5">Account Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 border-2">
                    <FaLock className="text-muted" />
                  </span>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control bg-light border-start-0 border-end-0 border-2 ps-1 py-2.5 small"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="input-group-text bg-light border-start-0 border-2 text-muted px-3"
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Card-based Role Selector */}
              <div className="mt-2">
                <label className="form-label small fw-semibold text-secondary mb-2">Select Your Registry Role</label>
                <div className="row g-3">
                  {/* Patient Card */}
                  <div className="col-6">
                    <div
                      onClick={() => handleSelectRole('patient')}
                      className={`card p-3 rounded-3 cursor-pointer text-center h-100 transition-all ${
                        form.role === 'patient'
                          ? 'border-primary border-2 bg-primary-subtle'
                          : 'border-light hover-bg-light'
                      }`}
                    >
                      <div className="position-absolute top-0 end-0 p-2 text-primary" style={{ display: form.role === 'patient' ? 'block' : 'none' }}>
                        <FaCheckCircle size={16} />
                      </div>
                      <div className="fs-3 text-primary mb-1"><FaUserInjured /></div>
                      <h6 className="fw-bold mb-1 small text-dark">Patient</h6>
                      <p className="text-secondary mb-0" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>Book doctors & uploads reports</p>
                    </div>
                  </div>

                  {/* Doctor Card */}
                  <div className="col-6">
                    <div
                      onClick={() => handleSelectRole('doctor')}
                      className={`card p-3 rounded-3 cursor-pointer text-center h-100 transition-all ${
                        form.role === 'doctor'
                          ? 'border-primary border-2 bg-primary-subtle'
                          : 'border-light hover-bg-light'
                      }`}
                    >
                      <div className="position-absolute top-0 end-0 p-2 text-primary" style={{ display: form.role === 'doctor' ? 'block' : 'none' }}>
                        <FaCheckCircle size={16} />
                      </div>
                      <div className="fs-3 text-primary mb-1"><FaUserMd /></div>
                      <h6 className="fw-bold mb-1 small text-dark">Doctor</h6>
                      <p className="text-secondary mb-0" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>Manage slots & consult patients</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary rounded-pill py-2.5 fw-bold shadow-sm mt-4 d-flex align-items-center justify-content-center gap-2 hover-scale"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Register Account</span>
                )}
              </button>

              <div className="text-center mt-3 pt-2 border-top border-light">
                <span className="text-secondary small">Already have an account? </span>
                <Link to="/login" className="text-primary fw-semibold small text-decoration-none hover-underline">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
