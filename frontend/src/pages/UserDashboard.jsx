import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import MapModal from '../components/MapModal';
import DashboardMap from '../components/DashboardMap';

const UserDashboard = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const startEditingProfile = () => {
    setEditName(user?.name || '');
    setEditLocation(user?.location || '');
    setEditPhone(user?.phone || '');
    setProfileMsg({ type: '', text: '' });
    setIsEditingProfile(true);
  };

  const handleDiscardProfile = () => {
    setIsEditingProfile(false);
    setProfileMsg({ type: '', text: '' });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName) {
      setProfileMsg({ type: 'danger', text: 'Name is required.' });
      return;
    }
    
    const res = await updateProfile({
      name: editName,
      location: editLocation,
      phone: editPhone
    });

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileMsg({ type: '', text: '' });
      }, 1500);
    } else {
      setProfileMsg({ type: 'danger', text: res.message });
    }
  };
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Search filters
  const [selectedService, setSelectedService] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [searchLat, setSearchLat] = useState(null);
  const [searchLng, setSearchLng] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingDesc, setBookingDesc] = useState('');
  const [bookingLoc, setBookingLoc] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // Leave review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // View reviews modal state
  const [showViewReviewsModal, setShowViewReviewsModal] = useState(false);
  const [selectedProviderForReviews, setSelectedProviderForReviews] = useState(null);
  const [providerReviews, setProviderReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const servicesList = ['Electrician', 'Plumber', 'Technician', 'Carpenter', 'Painter', 'AC Repair'];
  const citiesList = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Coimbatore', 'Madurai', 'Kochi', 'Chandigarh', 'Guwahati', 'Bhubaneswar', 'Dehradun', 'Amritsar', 'Mysore', 'Ranchi', 'Jodhpur'];

  useEffect(() => {
    fetchProviders();
    fetchBookings();
  }, []);

  const fetchProviders = async (service = '', loc = '', lat = null, lng = null) => {
    try {
      setLoadingProviders(true);
      let url = '/bookings/providers';
      const params = [];
      if (service) params.push(`serviceType=${encodeURIComponent(service)}`);
      if (loc) params.push(`location=${encodeURIComponent(loc)}`);
      if (lat) params.push(`lat=${lat}`);
      if (lng) params.push(`lng=${lng}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await API.get(url);
      if (res.data.success) {
        setProviders(res.data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await API.get('/bookings/user');
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProviders(selectedService, locationQuery, searchLat, searchLng);
  };

  const handleResetSearch = () => {
    setSelectedService('');
    setLocationQuery('');
    setSearchLat(null);
    setSearchLng(null);
    fetchProviders('', '', null, null);
  };

  const openBookingModal = (provider) => {
    setSelectedProvider(provider);
    setBookingDesc('');
    setBookingLoc('');
    setBookingDate('');
    setBookingTime('');
    setBookingError('');
    setBookingSuccess('');
    setShowBookingModal(true);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!bookingDesc || !bookingLoc || !bookingDate || !bookingTime) {
      setBookingError('Please fill in all booking details, including preferred date and time.');
      return;
    }
    try {
      setSubmittingBooking(true);
      setBookingError('');
      const res = await API.post('/bookings', {
        providerId: selectedProvider._id,
        serviceType: selectedProvider.skills[0] || 'General Service',
        description: bookingDesc,
        location: bookingLoc,
        bookingDate,
        bookingTime
      });
      if (res.data.success) {
        setBookingSuccess('Service requested successfully! The provider will review your request.');
        fetchBookings();
        setTimeout(() => {
          setShowBookingModal(false);
        }, 2000);
      }
    } catch (error) {
      setBookingError(error.response?.data?.message || 'Failed to send service request.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const openLeaveReviewModal = (booking) => {
    setSelectedBookingForReview(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
    setReviewSuccess('');
    setShowReviewModal(true);
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!reviewComment) {
      setReviewError('Please enter a comment.');
      return;
    }
    try {
      setSubmittingReview(true);
      setReviewError('');
      const res = await API.post('/reviews', {
        bookingId: selectedBookingForReview._id,
        rating: reviewRating,
        comment: reviewComment
      });
      if (res.data.success) {
        setReviewSuccess('Review submitted successfully!');
        fetchBookings();
        fetchProviders(selectedService, locationQuery);
        setTimeout(() => {
          setShowReviewModal(false);
        }, 2000);
      }
    } catch (error) {
      setReviewError(error.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openReviewsModal = async (provider) => {
    setSelectedProviderForReviews(provider);
    setShowViewReviewsModal(true);
    try {
      setLoadingReviews(true);
      const res = await API.get(`/reviews/provider/${provider._id}`);
      if (res.data.success) {
        setProviderReviews(res.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching provider reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Accepted': return 'status-inprogress';
      case 'Completed': return 'status-resolved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  return (
    <div className="container py-5">
      {/* Welcome Banner */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="brand-font gradient-title mb-1">Welcome, {user?.name}!</h2>
          <p className="text-secondary small mb-0">Search and connect with nearby professional service providers, book a job, and track status.</p>
        </div>
      </div>

      {/* Profile Details Block */}
      <div className="glass-card p-4 mb-5 animate-fade-in">
        {!isEditingProfile ? (
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h5 className="text-light brand-font mb-2">
                <i className="bi bi-person-badge text-info me-2"></i> My Profile Summary
              </h5>
              <div className="d-flex flex-wrap gap-3 mt-1 text-secondary small">
                <span>
                  <i className="bi bi-person-fill text-info me-1"></i> <strong>Name:</strong> {user?.name}
                </span>
                <span>
                  <i className="bi bi-geo-alt-fill text-warning me-1"></i> <strong>Location:</strong> {user?.location || 'No location set'}
                </span>
                <span>
                  <i className="bi bi-telephone-fill text-success me-1"></i> <strong>Phone:</strong> {user?.phone || 'No phone set'}
                </span>
              </div>
            </div>
            <button onClick={startEditingProfile} className="btn btn-outline-cyan btn-sm px-3">
              <i className="bi bi-pencil-square me-1"></i> Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile}>
            <h5 className="text-light brand-font mb-3">
              <i className="bi bi-pencil-square text-info me-2"></i> Edit Profile
            </h5>
            
            {profileMsg.text && (
              <div className={`alert alert-${profileMsg.type} p-2 small border-0 bg-${profileMsg.type} bg-opacity-10 text-${profileMsg.type} mb-3`}>
                {profileMsg.text}
              </div>
            )}

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label text-secondary small fw-medium">Full Name</label>
                <input
                  type="text"
                  className="form-control form-control-custom text-light"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label text-secondary small fw-medium">Location</label>
                <input
                  type="text"
                  className="form-control form-control-custom text-light"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Type or select a city"
                  list="cities-datalist-profile"
                />
                <datalist id="cities-datalist-profile">
                  {citiesList.map(city => <option key={city} value={city} />)}
                </datalist>
              </div>
              <div className="col-md-4">
                <label className="form-label text-secondary small fw-medium">Phone Number</label>
                <input
                  type="text"
                  className="form-control form-control-custom text-light"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. (555) 019-2834"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" onClick={handleDiscardProfile} className="btn btn-outline-secondary btn-sm px-4">
                Discard
              </button>
              <button type="submit" className="btn btn-cyan btn-sm px-4">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Grid: Search & Booking details */}
      <div className="row g-4">
        {/* Left column: Provider search & listing */}
        <div className="col-lg-8">
          <div className="glass-card p-4 mb-4 animate-fade-in">
            <h4 className="brand-font fs-5 text-light mb-3"><i className="bi bi-search me-2 text-info"></i> Find Service Providers</h4>
            <form onSubmit={handleSearch} className="row g-3">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control form-control-custom text-light"
                  placeholder="Search Service (e.g. Plumber, Carpenter, Gardening)"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  list="services-datalist"
                />
                <datalist id="services-datalist">
                  {servicesList.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="col-md-5">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Type or select a city"
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setSearchLat(null);
                      setSearchLng(null);
                    }}
                    list="cities-datalist-search"
                  />
                  <datalist id="cities-datalist-search">
                    {citiesList.map(c => <option key={c} value={c} />)}
                  </datalist>
                  <button
                    type="button"
                    className="btn btn-outline-cyan d-flex align-items-center gap-1"
                    onClick={() => setShowMapModal(true)}
                    title="Choose search coordinates center on interactive map"
                  >
                    <i className="bi bi-geo-alt-fill"></i> Map
                  </button>
                </div>
                {searchLat && searchLng && (
                  <div className="mt-1 small text-info font-monospace" style={{ fontSize: '0.7rem' }}>
                    <i className="bi bi-pin-map-fill text-danger me-1"></i>
                    Center: {searchLat.toFixed(4)}, {searchLng.toFixed(4)}
                  </div>
                )}
              </div>
              <div className="col-md-2 d-grid">
                <button type="submit" className="btn btn-cyan py-2">Search</button>
              </div>
            </form>
            {(selectedService || locationQuery || searchLat) && (
              <div className="mt-3">
                <button onClick={handleResetSearch} className="btn btn-outline-custom btn-sm">
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Interactive Map Dashboard widget */}
          <DashboardMap
            providers={providers}
            centerLat={searchLat}
            centerLng={searchLng}
            onBookProvider={openBookingModal}
            onViewReviews={openReviewsModal}
          />

          <h4 className="brand-font fs-5 text-light mb-3">Available Providers</h4>
          {loadingProviders ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : providers.length === 0 ? (
            <div className="glass-card p-5 text-center">
              <i className="bi bi-person-x text-secondary fs-1"></i>
              <h5 className="mt-3 brand-font">No service providers found</h5>
              <p className="text-secondary small">Try widening your search terms or changing selected services.</p>
            </div>
          ) : (
            <div className="row g-3">
              {providers.map(prov => (
                <div className="col-12" key={prov._id}>
                  <div className="glass-card p-4">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                      <div>
                        <h4 className="brand-font fs-5 mb-1 text-light">{prov.name}</h4>
                        <div className="d-flex align-items-center gap-1 mb-2 text-warning small" style={{ fontSize: '0.8rem' }}>
                          <i className="bi bi-star-fill"></i>
                          <span className="text-light">{prov.averageRating ? prov.averageRating.toFixed(1) : '0.0'}</span>
                          <span className="text-secondary">({prov.numReviews || 0} reviews)</span>
                          {prov.numReviews > 0 && (
                            <button
                              onClick={() => openReviewsModal(prov)}
                              className="btn btn-link text-info p-0 ms-2 small"
                              style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                            >
                              View Reviews
                            </button>
                          )}
                        </div>
                        <div className="d-flex gap-2 flex-wrap mt-2">
                          {prov.skills.map(s => (
                            <span key={s} className="badge bg-dark border border-info text-info small px-2 py-1">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-md-end">
                        <span className="text-info fw-bold fs-5">₹{prov.hourlyRate}/hr</span>
                        <p className="text-secondary small mb-0">
                          <i className="bi bi-geo-alt-fill text-warning me-1"></i>{prov.location}
                          {prov.distance !== undefined && prov.distance !== null && (
                            <span className="badge bg-success bg-opacity-10 text-success ms-2 py-1 px-2 rounded" style={{ fontSize: '0.65rem' }}>
                              <i className="bi bi-geo me-1"></i>{prov.distance} km away
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-secondary small mb-3">
                      {prov.bio || "No details provided by this service provider."}
                    </p>
                    
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-3 border-top border-secondary border-opacity-10">
                      <span className="text-secondary small"><i className="bi bi-telephone-fill me-1"></i>{prov.phone || 'No phone'}</span>
                      <button onClick={() => openBookingModal(prov)} className="btn btn-cyan btn-sm px-4">
                        <i className="bi bi-calendar-check me-1"></i> Book Service
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Client Bookings History */}
        <div className="col-lg-4">
          <div className="glass-card p-4">
            <h4 className="brand-font fs-5 text-light mb-4"><i className="bi bi-clock-history me-2 text-info"></i> My Bookings</h4>
            {loadingBookings ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-4 text-secondary small">
                <i className="bi bi-calendar2-x fs-2 mb-2 d-block text-secondary"></i>
                You haven't requested any services yet.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {bookings.map(b => (
                  <div key={b._id} className="p-3 rounded bg-dark bg-opacity-30 border border-secondary border-opacity-15">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="text-light fw-semibold mb-0">{b.provider?.name || 'Unknown Provider'}</h6>
                      <span className={`status-badge ${getStatusBadgeClass(b.status)}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-info small mb-2">{b.serviceType}</p>
                    <p className="text-secondary small mb-2 text-truncate">{b.description}</p>
                    <div className="text-secondary small mb-2" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-geo-alt-fill text-warning me-1"></i> {b.location}
                    </div>
                    {b.bookingDate && (
                      <div className="text-secondary small mb-2" style={{ fontSize: '0.7rem' }}>
                        <i className="bi bi-calendar-event text-info me-1"></i> Scheduled: {new Date(b.bookingDate).toLocaleDateString()} at {b.bookingTime}
                      </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center mt-2 border-top border-secondary border-opacity-10 pt-2">
                      <span className="text-secondary small" style={{ fontSize: '0.65rem' }}>
                        Requested: {new Date(b.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}
                      </span>
                      {b.status === 'Completed' && !b.hasReview && (
                        <button
                          onClick={() => openLeaveReviewModal(b)}
                          className="btn btn-cyan btn-sm py-1 px-2"
                          style={{ fontSize: '0.7rem' }}
                        >
                          <i className="bi bi-star"></i> Review
                        </button>
                      )}
                      {b.status === 'Completed' && b.hasReview && (
                        <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                          <i className="bi bi-check-circle-fill text-success me-1"></i> Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal Dialog */}
      {showBookingModal && selectedProvider && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card p-4 text-light">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title brand-font text-info"><i className="bi bi-calendar-check me-2"></i> Book {selectedProvider.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowBookingModal(false)}></button>
              </div>
              <div className="modal-body">
                {bookingError && (
                  <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger rounded p-3 mb-3">
                    {bookingError}
                  </div>
                )}
                {bookingSuccess && (
                  <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success rounded p-3 mb-3">
                    {bookingSuccess}
                  </div>
                )}

                <div className="mb-3">
                  <span className="text-secondary small">Service Type: </span>
                  <span className="badge bg-info text-dark ms-1">{selectedProvider.skills[0]}</span>
                  <span className="text-secondary small ms-3">Rate: </span>
                  <span className="text-info fw-bold">₹{selectedProvider.hourlyRate}/hr</span>
                </div>

                <form onSubmit={handleCreateBooking}>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-medium">Describe your request</label>
                    <textarea
                      className="form-control form-control-custom"
                      rows="3"
                      placeholder="Specify what requires repair or installation..."
                      value={bookingDesc}
                      onChange={(e) => setBookingDesc(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-medium">Service Address / Location</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      placeholder="e.g. 123 Main St, Apt 4B"
                      value={bookingLoc}
                      onChange={(e) => setBookingLoc(e.target.value)}
                      required
                    />
                  </div>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-medium">Preferred Date</label>
                      <input
                        type="date"
                        className="form-control form-control-custom"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-medium">Preferred Time</label>
                      <input
                        type="time"
                        className="form-control form-control-custom"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-custom" onClick={() => setShowBookingModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-cyan px-4" disabled={submittingBooking}>
                      {submittingBooking ? 'Sending Request...' : 'Send Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Review Modal */}
      {showReviewModal && selectedBookingForReview && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card p-4 text-light">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title brand-font text-info"><i className="bi bi-star"></i> Leave feedback for {selectedBookingForReview.provider?.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReviewModal(false)}></button>
              </div>
              <div className="modal-body">
                {reviewError && (
                  <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger rounded p-3 mb-3">
                    {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success rounded p-3 mb-3">
                    {reviewSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateReview}>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-medium">Rating</label>
                    <select
                      className="form-select form-control-custom"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value))}
                      required
                    >
                      <option value="5">★★★★★ (5 - Excellent)</option>
                      <option value="4">★★★★☆ (4 - Good)</option>
                      <option value="3">★★★☆☆ (3 - Average)</option>
                      <option value="2">★★☆☆☆ (2 - Poor)</option>
                      <option value="1">★☆☆☆☆ (1 - Terrible)</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-secondary small fw-medium">Review Comment</label>
                    <textarea
                      className="form-control form-control-custom"
                      rows="3"
                      placeholder="Share your experience working with this provider..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-custom" onClick={() => setShowReviewModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-cyan px-4" disabled={submittingReview}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Reviews Modal */}
      {showViewReviewsModal && selectedProviderForReviews && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content glass-card p-4 text-light">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title brand-font text-info"><i className="bi bi-chat-text"></i> Reviews for {selectedProviderForReviews.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewReviewsModal(false)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="d-flex align-items-center gap-2 mb-4">
                  <span className="fs-3 fw-bold text-warning">{selectedProviderForReviews.averageRating ? selectedProviderForReviews.averageRating.toFixed(1) : '0.0'}</span>
                  <div>
                    <div className="text-warning">
                      {'★'.repeat(Math.round(selectedProviderForReviews.averageRating || 0)) + '☆'.repeat(5 - Math.round(selectedProviderForReviews.averageRating || 0))}
                    </div>
                    <span className="text-secondary small">Based on {selectedProviderForReviews.numReviews || 0} reviews</span>
                  </div>
                </div>

                {loadingReviews ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-info" role="status"></div>
                  </div>
                ) : providerReviews.length === 0 ? (
                  <p className="text-secondary text-center py-4">No reviews found for this provider yet.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {providerReviews.map(r => (
                      <div key={r._id} className="p-3 rounded bg-dark bg-opacity-30 border border-secondary border-opacity-10">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <strong className="text-light small">{r.user?.name || 'Anonymous'}</strong>
                          <span className="text-warning" style={{ fontSize: '0.75rem' }}>
                            {'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}
                          </span>
                        </div>
                        <p className="text-secondary mb-1 small text-wrap">{r.comment}</p>
                        <span className="text-secondary" style={{ fontSize: '0.65rem' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-3">
                <button type="button" className="btn btn-outline-custom w-100" onClick={() => setShowViewReviewsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MapModal
        show={showMapModal}
        onClose={() => setShowMapModal(false)}
        initialCity={locationQuery}
        initialLat={searchLat}
        initialLng={searchLng}
        onConfirm={({ latitude, longitude, address }) => {
          setSearchLat(latitude);
          setSearchLng(longitude);
          // If search address has city info or resolves, we can update location text if desired,
          // but updating coordinates is the key part for distance-based sorting.
          fetchProviders(selectedService, locationQuery, latitude, longitude);
        }}
      />
    </div>
  );
};

export default UserDashboard;
