import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserMd, FaCalendarCheck, FaRobot, FaStar, FaStethoscope, FaEnvelope, FaChevronRight } from 'react-icons/fa';
import api from '../../services/api';

const CATEGORIES = [
  { name: 'Cardiology', icon: '❤️', desc: 'Heart and blood vessel treatments' },
  { name: 'Dermatology', icon: '🧼', desc: 'Skin, hair, and nail health care' },
  { name: 'Pediatrics', icon: '👶', desc: 'Medical care for infants and kids' },
  { name: 'Neurology', icon: '🧠', desc: 'Brain and nervous system disorders' },
  { name: 'Orthopedics', icon: '🦴', desc: 'Bone and joint surgery treatment' },
  { name: 'Ophthalmology', icon: '👁️', desc: 'Eye examinations and surgeries' },
];

const FAQS = [
  { q: 'How do I book an appointment?', a: 'Sign in, go to the Doctors tab, choose a specialist, select an available slot, and click Book Appointment.' },
  { q: 'What is the AI Health Assistant?', a: 'It is a virtual tool that can summarize medical reports, check symptoms, and recommend medical specialties based on your questions.' },
  { q: 'Can I upload files for doctor consultation?', a: 'Yes, patients can upload PDFs and image reports to their profile, and doctors can access them during the review process.' },
  { q: 'How do doctor approvals work?', a: 'Doctors register with their medical license number and qualifications. Administrators verify and approve profiles before they go live.' },
];

const HomePage = () => {
  const [topDoctors, setTopDoctors] = useState([]);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    const fetchTopDoctors = async () => {
      try {
        const res = await api.get('/doctors', { params: { sort: 'rating', limit: 4 } });
        setTopDoctors(res.data.data.slice(0, 4));
      } catch (err) {
        console.error('Failed to load top doctors:', err);
      }
    };
    fetchTopDoctors();
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setContactSuccess(false), 5000);
  };

  return (
    <div className="homepage-container w-100">
      {/* 1. Hero Banner */}
      <section className="hero-section py-5 px-3 mb-5 rounded-4 position-relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 text-center text-lg-start">
              <span className="badge bg-white text-primary mb-3 px-3 py-2 fw-semibold rounded-pill">Leading Digital Healthcare</span>
              <h1 className="display-4 fw-bold mb-3">Your Health, Guided by Expert Hands & AI</h1>
              <p className="lead mb-4 opacity-90">
                Book appointments with certified doctor specialists, manage medical reports, and get intelligent health diagnostics recommendations instantaneously.
              </p>
              <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start">
                <Link to="/doctors" className="btn btn-light text-primary btn-lg rounded-pill px-4 fw-bold shadow">
                  Browse Doctors <FaChevronRight size={12} className="ms-1" />
                </Link>
                <Link to="/ai" className="btn btn-outline-light btn-lg rounded-pill px-4 fw-bold">
                  Try AI Symptom Checker
                </Link>
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-block text-center position-relative">
              {/* Doctor illustration overlay or generating clean UI */}
              <div className="bg-white text-dark p-4 rounded-4 shadow-lg text-start mx-auto position-relative" style={{ maxWidth: '420px', transform: 'rotate(2deg)' }}>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="bg-primary-subtle text-primary p-2.5 rounded-circle fs-4">🤖</span>
                  <div>
                    <h6 className="fw-bold mb-0">Virtual AI Diagnosis</h6>
                    <span className="text-secondary small">Smart Specialization Check</span>
                  </div>
                </div>
                <p className="small text-secondary mb-3">
                  "Patient describes chest pressure radiating to left arm. Recommending immediate Cardiology consult."
                </p>
                <Link to="/ai" className="btn btn-sm btn-primary rounded-pill w-100 fw-semibold">
                  Start Analysis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Value Cards */}
      <section className="container py-4 mb-5">
        <div className="row g-4 text-center">
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-xs rounded-4 p-4 hover-translate">
              <div className="fs-1 text-primary mb-3"><FaUserMd /></div>
              <h4 className="fw-bold mb-2">Verified Specialists</h4>
              <p className="text-secondary small">Consult with credentialed and approved doctors across numerous specialties.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-xs rounded-4 p-4 hover-translate">
              <div className="fs-1 text-success mb-3"><FaCalendarCheck /></div>
              <h4 className="fw-bold mb-2">Instant Scheduling</h4>
              <p className="text-secondary small">Book time slots online and view instant status updates and text notifications.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-xs rounded-4 p-4 hover-translate">
              <div className="fs-1 text-info mb-3"><FaRobot /></div>
              <h4 className="fw-bold mb-2">AI Diagnostics Support</h4>
              <p className="text-secondary small">Analyze symptoms and summarize PDF medical charts before your clinic visit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Specialties Categories */}
      <section className="bg-light py-5 mb-5 rounded-4">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Search Doctors by Specialty</h2>
            <p className="text-secondary">Find the right care based on medical departments and treatment focus</p>
          </div>
          <div className="row g-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="col-md-4 col-sm-6">
                <Link to={`/doctors?specialty=${cat.name}`} className="text-decoration-none text-dark">
                  <div className="card border-0 shadow-xs rounded-4 p-3.5 h-100 hover-bg-primary transition-all">
                    <div className="fs-2 mb-2">{cat.icon}</div>
                    <h5 className="fw-bold mb-1">{cat.name}</h5>
                    <p className="text-secondary small mb-0">{cat.desc}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Top Rated Doctors Carousel/Grid */}
      <section className="container py-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Top Rated Specialists</h2>
            <p className="text-secondary mb-0">High-performing doctors with patient recommendation scores</p>
          </div>
          <Link to="/doctors" className="btn btn-outline-primary rounded-pill px-4 small fw-semibold">
            See All Doctors
          </Link>
        </div>

        <div className="row g-4">
          {topDoctors.length === 0 ? (
            <div className="text-center text-muted col-12">No Doctor's Available</div>
          ) : (
            topDoctors.map((doc) => {
              const u = doc.user || {};
              return (
                <div key={doc._id} className="col-lg-3 col-sm-6">
                  <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden text-center p-3">
                    <img
                      src={u.profilePhoto || 'https://picsum.photos/id/47/300/300'}
                      alt={u.name}
                      className="rounded-circle object-fit-cover shadow-sm mx-auto mb-3"
                      style={{ width: '96px', height: '96px', border: '3px solid #eef6ff' }}
                      onError={(e) => {
                        e.target.src = 'https://picsum.photos/id/47/300/300';
                      }}
                    />
                    <h5 className="fw-bold mb-1 text-truncate">{u.name || 'Doctor'}</h5>
                    <p className="text-primary small fw-semibold mb-2">{doc.specialty || 'Medical Specialist'}</p>
                    <div className="d-flex align-items-center justify-content-center gap-1 text-warning small mb-3">
                      <FaStar /> <span>{doc.averageRating ? doc.averageRating.toFixed(1) : '5.0'}</span>
                      <span className="text-muted">({doc.totalReviews || 0} reviews)</span>
                    </div>
                    <Link to={`/book/${doc._id}`} className="btn btn-primary rounded-pill btn-sm w-100 fw-semibold">
                      Book Now
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 5. FAQs Grid */}
      <section className="bg-light py-5 mb-5 rounded-4">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Frequently Asked Questions</h2>
            <p className="text-secondary">Quick answers about our medical appointments booking platform</p>
          </div>
          <div className="row g-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="col-md-6">
                <div className="card border-0 rounded-4 p-4 h-100 bg-white shadow-xs">
                  <h5 className="fw-bold mb-2 text-primary">Q: {faq.q}</h5>
                  <p className="text-secondary small mb-0">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Contact Us Form */}
      <section className="container py-4 mb-5 max-width-800">
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold">Contact Our Support Team</h2>
            <p className="text-secondary">Have issues with a booking or doctor registration? Send us a line.</p>
          </div>

          {contactSuccess && (
            <div className="alert alert-success rounded-3 shadow-sm mb-4">
              Your query has been submitted. A support executive will reach out to you within 24 hours.
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Your Name</label>
              <input
                type="text"
                className="form-control bg-light border-0 py-2.5 rounded-3"
                placeholder="e.g. John Doe"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Your Email</label>
              <input
                type="email"
                className="form-control bg-light border-0 py-2.5 rounded-3"
                placeholder="e.g. john@example.com"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold text-secondary">Message</label>
              <textarea
                className="form-control bg-light border-0 py-2.5 rounded-3"
                placeholder="How can we assist you?"
                rows={4}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
              />
            </div>
            <div className="col-12 text-center mt-4">
              <button type="submit" className="btn btn-primary rounded-pill px-5 py-2.5 fw-bold shadow-sm d-inline-flex align-items-center gap-2">
                <FaEnvelope /> Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
