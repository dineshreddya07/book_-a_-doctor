import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaStethoscope, FaArrowLeft, FaRegCheckCircle } from 'react-icons/fa';
import api from '../../services/api';

const BookingPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/doctors/${doctorId}`);
        setDoctor(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch doctor details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [doctorId]);

  // When date changes, update slots list based on day-of-week
  useEffect(() => {
    if (!selectedDate || !doctor || !doctor.availability) {
      setAvailableSlots([]);
      setSelectedSlot('');
      return;
    }

    const dateObj = new Date(selectedDate);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDayName = daysOfWeek[dateObj.getDay()];

    const dayAvailability = doctor.availability.find(
      (avail) => avail.day.toLowerCase() === selectedDayName.toLowerCase()
    );

    if (dayAvailability && dayAvailability.slots) {
      setAvailableSlots(dayAvailability.slots);
    } else {
      setAvailableSlots([]);
    }
    setSelectedSlot('');
  }, [selectedDate, doctor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and an available time slot.');
      return;
    }

    setError('');
    try {
      // Parse date and slot into a single Date object
      // selectedDate is 'YYYY-MM-DD', selectedSlot is e.g. '09:00 AM' or '02:30 PM'
      const [time, modifier] = selectedSlot.split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      if (modifier === 'PM' && hours < 12) {
        hours += 12;
      }
      if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }

      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, parseInt(minutes, 10), 0, 0);

      await api.post('/appointments', {
        doctor: doctorId,
        appointmentDate: appointmentDate.toISOString(),
        reason: reason || 'Routine health checkup',
      });

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit appointment request.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <span className="mt-3 text-secondary">Loading booking schedule...</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm border-0 rounded-4 p-5 max-width-600 mx-auto">
          <FaRegCheckCircle className="text-success display-2 mb-4" />
          <h2 className="fw-bold mb-3">Booking Requested!</h2>
          <p className="text-secondary mb-4">
            Your appointment request with <span className="fw-semibold text-dark">Dr. {doctor?.user?.name}</span> has been sent. You will be notified once the doctor reviews and confirms the request.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/patient" className="btn btn-primary rounded-pill px-4">
              Go to Dashboard
            </Link>
            <Link to="/doctors" className="btn btn-outline-secondary rounded-pill px-4">
              Book Another
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const doctorUser = doctor?.user || {};
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="container py-4">
      <div className="mb-4">
        <Link to="/doctors" className="text-decoration-none d-flex align-items-center gap-2 text-primary fw-semibold small">
          <FaArrowLeft /> Back to Doctor Directory
        </Link>
      </div>

      {error && <div className="alert alert-danger rounded-4 shadow-sm mb-4">{error}</div>}

      <div className="row g-4">
        {/* Doctor Summary Info */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 p-4 text-center">
            <img
              src={doctorUser.profilePhoto || 'https://picsum.photos/id/47/300/300'}
              alt={doctorUser.name}
              className="rounded-circle object-fit-cover shadow-sm mx-auto mb-3"
              style={{ width: '120px', height: '120px', border: '4px solid #eef6ff' }}
              onError={(e) => {
                e.target.src = 'https://picsum.photos/id/47/300/300';
              }}
            />
            <h4 className="fw-bold mb-1">Dr. {doctorUser.name}</h4>
            <p className="text-primary small fw-semibold mb-3 d-flex align-items-center justify-content-center gap-1">
              <FaStethoscope /> {doctor.specialty || 'General Specialist'}
            </p>

            <div className="text-start bg-light rounded-3 p-3 small text-secondary">
              <div className="mb-2">
                <span className="fw-bold text-dark">Clinic Address:</span> {doctor.clinicAddress || 'Healthcare Clinic Center'}
              </div>
              <div className="mb-2">
                <span className="fw-bold text-dark">Experience:</span> {doctor.experienceYears || 0} Years
              </div>
              <div>
                <span className="fw-bold text-dark">Consultation Fee:</span> ${doctor.fees || 0}
              </div>
            </div>

            {/* Availability reference */}
            <div className="mt-4 text-start">
              <h6 className="fw-bold text-dark small mb-2">Weekly Availability Hours:</h6>
              {doctor.availability && doctor.availability.length > 0 ? (
                <div className="d-flex flex-column gap-1.5">
                  {doctor.availability.map((avail) => (
                    <div key={avail.day} className="d-flex justify-content-between text-secondary small border-bottom border-light pb-1">
                      <span className="fw-semibold text-dark">{avail.day}</span>
                      <span className="text-muted">{avail.slots?.join(', ') || 'No Slots'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small">No weekly availability set.</p>
              )}
            </div>
          </div>
        </div>

        {/* Scheduler Form */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <h3 className="fw-bold mb-4">Choose Appointment Time</h3>

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
              {/* Date selection */}
              <div>
                <label className="form-label text-dark fw-semibold mb-2">
                  <FaCalendarAlt className="text-primary me-1.5" /> Select Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  className="form-control form-control-lg border-2"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>

              {/* Slot selection */}
              {selectedDate && (
                <div>
                  <label className="form-label text-dark fw-semibold mb-2">
                    <FaClock className="text-primary me-1.5" /> Available Slots
                  </label>
                  {availableSlots.length === 0 ? (
                    <div className="alert alert-warning border-0 rounded-3">
                      Dr. {doctorUser.name} has no available slots scheduled on this day. Please pick another date.
                    </div>
                  ) : (
                    <div className="row g-2">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <div key={slot} className="col-6 col-sm-4 col-md-3">
                            <button
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`btn w-100 rounded-pill py-2.5 fw-semibold transition-all small ${
                                isSelected ? 'btn-primary shadow-sm' : 'btn-outline-primary bg-light border-0'
                              }`}
                            >
                              {slot}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Reason description */}
              <div>
                <label className="form-label text-dark fw-semibold mb-2">Reason for Appointment</label>
                <textarea
                  className="form-control border-2"
                  placeholder="Describe your symptoms or reason for consulting the doctor (optional)..."
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="pt-2 border-top border-light">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm"
                  disabled={!selectedDate || !selectedSlot}
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
