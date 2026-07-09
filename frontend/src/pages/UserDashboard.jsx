import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Search filters
  const [selectedService, setSelectedService] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingDesc, setBookingDesc] = useState('');
  const [bookingLoc, setBookingLoc] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const servicesList = ['Electrician', 'Plumber', 'Technician', 'Carpenter', 'Painter', 'AC Repair'];

  useEffect(() => {
    fetchProviders();
    fetchBookings();
  }, []);

  const fetchProviders = async (service = '', loc = '') => {
    try {
      setLoadingProviders(true);
      let url = '/bookings/providers';
      const params = [];
      if (service) params.push(`serviceType=${encodeURIComponent(service)}`);
      if (loc) params.push(`location=${encodeURIComponent(loc)}`);
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
    fetchProviders(selectedService, locationQuery);
  };

  const handleResetSearch = () => {
    setSelectedService('');
    setLocationQuery('');
    fetchProviders('', '');
  };

  const openBookingModal = (provider) => {
    setSelectedProvider(provider);
    setBookingDesc('');
    setBookingLoc('');
    setBookingError('');
    setBookingSuccess('');
    setShowBookingModal(true);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!bookingDesc || !bookingLoc) {
      setBookingError('Please fill in all booking details.');
      return;
    }
    try {
      setSubmittingBooking(true);
      setBookingError('');
      const res = await API.post('/bookings', {
        providerId: selectedProvider._id,
        serviceType: selectedProvider.skills[0] || 'General Service',
        description: bookingDesc,
        location: bookingLoc
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
      <div className="row mb-5">
        <div className="col-12">
          <h2 className="brand-font gradient-title mb-1">Welcome, {user?.name}!</h2>
          <p className="text-secondary small">Search and connect with nearby professional service providers, book a job, and track status.</p>
        </div>
      </div>

      {/* Main Grid: Search & Booking details */}
      <div className="row g-4">
        {/* Left column: Provider search & listing */}
        <div className="col-lg-8">
          <div className="glass-card p-4 mb-4">
            <h4 className="brand-font fs-5 text-light mb-3"><i className="bi bi-search me-2 text-info"></i> Find Service Providers</h4>
            <form onSubmit={handleSearch} className="row g-3">
              <div className="col-md-5">
                <select
                  className="form-select form-control-custom"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="">All Services</option>
                  {servicesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="Search by location (e.g. Seattle)"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-grid">
                <button type="submit" className="btn btn-cyan py-2">Search</button>
              </div>
            </form>
            {(selectedService || locationQuery) && (
              <div className="mt-3">
                <button onClick={handleResetSearch} className="btn btn-outline-custom btn-sm">
                  Clear Filters
                </button>
              </div>
            )}
          </div>

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
                        <div className="d-flex gap-2 flex-wrap mt-2">
                          {prov.skills.map(s => (
                            <span key={s} className="badge bg-dark border border-info text-info small px-2 py-1">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-md-end">
                        <span className="text-info fw-bold fs-5">${prov.hourlyRate}/hr</span>
                        <p className="text-secondary small mb-0"><i className="bi bi-geo-alt-fill text-warning me-1"></i>{prov.location}</p>
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
                    <div className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-geo-alt-fill text-warning me-1"></i> {b.location}
                    </div>
                    <div className="text-secondary small mt-1" style={{ fontSize: '0.65rem' }}>
                      Requested: {new Date(b.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}
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
                  <span className="text-info fw-bold">${selectedProvider.hourlyRate}/hr</span>
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
                  <div className="mb-4">
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
    </div>
  );
};

export default UserDashboard;
