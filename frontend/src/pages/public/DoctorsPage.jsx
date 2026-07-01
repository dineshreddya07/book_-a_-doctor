import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaStar, FaStethoscope, FaFilter, FaRegCommentDots, FaMoneyBillWave } from 'react-icons/fa';
import api from '../../services/api';

const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'General Medicine',
  'Neurology',
  'Orthopedics',
  'Gynecology',
  'Ophthalmology',
  'Psychiatry',
];

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReviews, setExpandedReviews] = useState({}); // { [docId]: reviewsArray }
  const [reviewsLoading, setReviewsLoading] = useState({}); // { [docId]: boolean }

  // Filter and pagination states
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [location, setLocation] = useState('');
  const [feesMin, setFeesMin] = useState('');
  const [feesMax, setFeesMax] = useState('');
  const [rating, setRating] = useState('');
  const [sort, setSort] = useState('rating');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search,
        specialty,
        experienceYears,
        location,
        feesMin,
        feesMax,
        rating,
        sort,
        page,
        limit: 8,
      };

      const res = await api.get('/doctors', { params });
      setDoctors(res.data.data);
      setTotalPages(res.data.meta?.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialty, rating, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSpecialty('');
    setExperienceYears('');
    setLocation('');
    setFeesMin('');
    setFeesMax('');
    setRating('');
    setSort('rating');
    setPage(1);
    // Directly fetch with reset values
    setTimeout(() => {
      fetchDoctors();
    }, 50);
  };

  const toggleReviews = async (docId) => {
    if (expandedReviews[docId]) {
      // Collapse
      const updated = { ...expandedReviews };
      delete updated[docId];
      setExpandedReviews(updated);
    } else {
      // Fetch reviews
      setReviewsLoading((prev) => ({ ...prev, [docId]: true }));
      try {
        const res = await api.get(`/reviews/doctor/${docId}`);
        setExpandedReviews((prev) => ({ ...prev, [docId]: res.data.data }));
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setReviewsLoading((prev) => ({ ...prev, [docId]: false }));
      }
    }
  };

  return (
    <div className="doctors-container container py-4">
      <div className="row mb-4">
        <div className="col-12 text-center text-md-start">
          <h1 className="fw-bold primary-color-text">Find Trusted Specialists</h1>
          <p className="text-secondary">Search, sort, filter, and instantly book appointments with certified medical doctors.</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Sidebar Filters */}
        <div className="col-lg-3">
          <div className="card shadow-sm border-0 rounded-4 p-4 filters-sidebar">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <FaFilter className="text-primary" /> Filters
              </h5>
              <button onClick={handleResetFilters} className="btn btn-sm btn-link text-decoration-none p-0 text-danger fw-semibold">
                Reset All
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-secondary small fw-semibold">Search Name or Keyword</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0 ps-1"
                    placeholder="Search doctor or clinic..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-secondary small fw-semibold">Specialty</label>
                <select className="form-select bg-light" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                  <option value="">All Specialties</option>
                  {SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-secondary small fw-semibold">Min Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control bg-light"
                  placeholder="e.g. 5"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label text-secondary small fw-semibold">Location / Clinic</label>
                <input
                  type="text"
                  className="form-control bg-light"
                  placeholder="e.g. New York"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold">Min Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control bg-light"
                    placeholder="Min"
                    value={feesMin}
                    onChange={(e) => setFeesMin(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold">Max Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control bg-light"
                    placeholder="Max"
                    value={feesMax}
                    onChange={(e) => setFeesMax(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-secondary small fw-semibold">Minimum Rating</label>
                <select className="form-select bg-light" value={rating} onChange={(e) => setRating(e.target.value)}>
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ ★ Stars</option>
                  <option value="4.0">4.0+ ★ Stars</option>
                  <option value="3.5">3.5+ ★ Stars</option>
                  <option value="3.0">3.0+ ★ Stars</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary rounded-pill w-100 mt-2 fw-semibold shadow-sm">
                Apply Search
              </button>
            </form>
          </div>
        </div>

        {/* Doctor Grid and Sorting */}
        <div className="col-lg-9">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <p className="mb-0 text-secondary">
              Showing <span className="fw-bold text-dark">{doctors.length}</span> doctors
            </p>
            <div className="d-flex align-items-center gap-2">
              <span className="text-secondary small fw-semibold text-nowrap">Sort By:</span>
              <select className="form-select form-select-sm border-0 shadow-sm bg-white" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="rating">Highest Rating</option>
                <option value="fees">Fees: Low to High</option>
                <option value="fees_desc">Fees: High to Low</option>
                <option value="experience">Most Experienced</option>
                <option value="newest">Newest Join</option>
              </select>
            </div>
          </div>

          {error && <div className="alert alert-danger rounded-4 shadow-sm">{error}</div>}

          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <span className="mt-3 text-secondary">Searching matching doctors...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="card shadow-sm border-0 rounded-4 text-center p-5">
              <FaStethoscope className="display-4 text-muted mb-3" />
              <h4 className="fw-bold">No Doctors Found</h4>
              <p className="text-secondary">Try adjusting your filters or search criteria.</p>
              <button onClick={handleResetFilters} className="btn btn-primary rounded-pill px-4 mt-2 align-self-center">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {doctors.map((doctor) => {
                const userObj = doctor.user || {};
                const name = userObj.name || 'Doctor';
                const photo = userObj.profilePhoto || '/assets/images/default-doctor.png';
                const isExpanded = !!expandedReviews[doctor._id];
                const reviews = expandedReviews[doctor._id] || [];

                return (
                  <div key={doctor._id} className="col-12">
                    <div className="card border-0 shadow-sm rounded-4 doctor-list-card p-3 p-md-4">
                      <div className="row g-3 align-items-start">
                        {/* Avatar */}
                        <div className="col-auto">
                          <img
                            src={photo}
                            alt={name}
                            className="rounded-circle object-fit-cover shadow-sm"
                            style={{ width: '88px', height: '88px', border: '3px solid #eef6ff' }}
                            onError={(e) => {
                              e.target.src = 'https://picsum.photos/id/47/300/300';
                            }}
                          />
                        </div>

                        {/* Details */}
                        <div className="col">
                          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-1">
                            <div>
                              <h5 className="fw-bold mb-1">{name}</h5>
                              <p className="text-primary small fw-semibold mb-2 d-flex align-items-center gap-1">
                                <FaStethoscope /> {doctor.specialty || 'General Practitioner'}
                              </p>
                            </div>
                            <div className="d-flex align-items-center gap-1 bg-warning-subtle text-warning px-2.5 py-1 rounded-pill small fw-semibold">
                              <FaStar className="pb-0.5" />
                              <span>{doctor.averageRating ? doctor.averageRating.toFixed(1) : '5.0'}</span>
                              <span className="text-secondary">({doctor.totalReviews || 0} reviews)</span>
                            </div>
                          </div>

                          <p className="text-secondary small mb-3">{doctor.bio || 'Experienced specialist dedicated to providing personalized patient care.'}</p>

                          <div className="d-flex flex-wrap gap-x-4 gap-y-2 mb-3 text-secondary small">
                            <div>
                              <span className="fw-semibold text-dark">Experience:</span> {doctor.experienceYears || 0} Years
                            </div>
                            <div>
                              <span className="fw-semibold text-dark">Consultation:</span> ${doctor.fees || 0}
                            </div>
                            {doctor.clinicAddress && (
                              <div>
                                <span className="fw-semibold text-dark">Clinic:</span> {doctor.clinicAddress}
                              </div>
                            )}
                          </div>

                          <div className="d-flex flex-wrap gap-2 pt-2 border-top border-light">
                            <Link to={`/book/${doctor._id}`} className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm small">
                              Book Appointment
                            </Link>
                            <button
                              onClick={() => toggleReviews(doctor._id)}
                              className="btn btn-outline-secondary rounded-pill px-4 small d-flex align-items-center gap-1"
                              disabled={reviewsLoading[doctor._id]}
                            >
                              <FaRegCommentDots />
                              {reviewsLoading[doctor._id] ? 'Loading...' : isExpanded ? 'Hide Reviews' : 'View Reviews'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Reviews section */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 border-top border-light-subtle bg-light-subtle rounded-3 p-3">
                          <h6 className="fw-bold mb-3 d-flex align-items-center gap-1">
                            Reviews ({reviews.length})
                          </h6>
                          {reviews.length === 0 ? (
                            <p className="text-muted small mb-0">No reviews submitted yet for this doctor.</p>
                          ) : (
                            <div className="d-flex flex-column gap-3">
                              {reviews.map((rev) => (
                                <div key={rev._id} className="pb-2 border-bottom border-light-subtle last-no-border">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="fw-semibold small">{rev.patient?.name || 'Anonymous Patient'}</span>
                                    <span className="text-warning small d-flex align-items-center gap-0.5">
                                      <FaStar /> {rev.rating}
                                    </span>
                                  </div>
                                  <p className="text-secondary small mb-0 italic">"{rev.comment}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <nav>
                <ul className="pagination shadow-sm rounded-pill overflow-hidden">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="page-link border-0 px-3 py-2">
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                      <button onClick={() => setPage(i + 1)} className="page-link border-0 px-3 py-2">
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="page-link border-0 px-3 py-2">
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorsPage;
