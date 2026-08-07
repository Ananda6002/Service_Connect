import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const ProviderDashboard = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState(0);
  const [editSkills, setEditSkills] = useState([]);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const servicesList = ['Electrician', 'Plumber', 'Technician', 'Carpenter', 'Painter', 'AC Repair'];
  const citiesList = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Coimbatore', 'Madurai', 'Kochi', 'Chandigarh', 'Guwahati', 'Bhubaneswar', 'Dehradun', 'Amritsar', 'Mysore', 'Ranchi', 'Jodhpur'];

  const startEditingProfile = () => {
    setEditName(user?.name || '');
    setEditLocation(user?.location || '');
    setEditPhone(user?.phone || '');
    setEditBio(user?.bio || '');
    setEditHourlyRate(user?.hourlyRate || 0);
    setEditSkills(user?.skills || []);
    setProfileMsg({ type: '', text: '' });
    setIsEditingProfile(true);
  };

  const handleDiscardProfile = () => {
    setIsEditingProfile(false);
    setProfileMsg({ type: '', text: '' });
  };

  const handleSkillToggle = (skill) => {
    if (editSkills.includes(skill)) {
      setEditSkills(editSkills.filter(s => s !== skill));
    } else {
      setEditSkills([...editSkills, skill]);
    }
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
      phone: editPhone,
      bio: editBio,
      hourlyRate: editHourlyRate,
      skills: editSkills
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
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get('/bookings/provider');
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching provider bookings:', error);
      setErrorMsg('Could not fetch bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await API.put(`/bookings/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setSuccessMsg(`Job status successfully updated to ${newStatus}.`);
        fetchBookings();
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update job status.');
    }
  };

  // Helper stats counters
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    active: bookings.filter(b => b.status === 'Accepted').length,
    completed: bookings.filter(b => b.status === 'Completed').length
  };

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Active') return b.status === 'Accepted';
    return b.status === statusFilter;
  });

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
      {/* Header section */}
      <div className="row mb-5 align-items-center">
        <div className="col-md-8">
          <h2 className="brand-font gradient-title mb-1">Welcome back, {user?.name}!</h2>
          <p className="text-secondary small">Manage client requests, update status, and track your completed jobs.</p>
        </div>
        <div className="col-md-4 text-md-end mt-3 mt-md-0 d-flex gap-3 justify-content-md-end justify-content-center">
          <div className="p-3 glass-card text-center">
            <span className="text-secondary small d-block">Rating</span>
            <strong className="text-warning fs-5 brand-font">
              ★ {user?.averageRating ? user?.averageRating.toFixed(1) : '0.0'}
            </strong>
            <span className="text-secondary d-block small" style={{ fontSize: '0.65rem' }}>
              ({user?.numReviews || 0} reviews)
            </span>
          </div>
          <div className="p-3 glass-card text-center">
            <span className="text-secondary small d-block">My Hourly Rate</span>
            <strong className="text-info fs-5 brand-font">₹{user?.hourlyRate || 0}/hr</strong>
          </div>
        </div>
      </div>

      {/* Profile Details Block */}
      <div className="glass-card p-4 mb-5 animate-fade-in">
        {!isEditingProfile ? (
          <div className="row align-items-center">
            <div className="col-md-9">
              <h5 className="text-light brand-font"><i className="bi bi-person-badge text-info me-2"></i> Provider Profile Summary</h5>
              <p className="text-secondary small mb-2">{user?.bio || "No biography provided. Clients see this on your profile."}</p>
              <div className="d-flex flex-wrap gap-2 mt-3">
                {user?.skills?.map(s => (
                  <span key={s} className="badge bg-dark border border-info text-info px-2 py-1">{s}</span>
                ))}
                <span className="badge bg-dark border border-secondary text-secondary px-2 py-1">
                  <i className="bi bi-geo-alt-fill text-warning me-1"></i> {user?.location || 'No location'}
                </span>
                <span className="badge bg-dark border border-secondary text-secondary px-2 py-1">
                  <i className="bi bi-telephone-fill me-1"></i> {user?.phone || 'No phone'}
                </span>
              </div>
            </div>
            <div className="col-md-3 text-md-end mt-3 mt-md-0">
              <button onClick={startEditingProfile} className="btn btn-outline-cyan btn-sm px-4">
                <i className="bi bi-pencil-square me-1"></i> Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile}>
            <h5 className="text-light brand-font mb-3">
              <i className="bi bi-pencil-square text-info me-2"></i> Edit Provider Profile
            </h5>

            {profileMsg.text && (
              <div className={`alert alert-${profileMsg.type} p-2 small border-0 bg-${profileMsg.type} bg-opacity-10 text-${profileMsg.type} mb-3`}>
                {profileMsg.text}
              </div>
            )}

            <div className="row g-3 mb-3">
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
                  list="cities-datalist-provider"
                />
                <datalist id="cities-datalist-provider">
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
                  placeholder="Phone Number"
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label text-secondary small fw-medium">Hourly Rate (₹)</label>
                <input
                  type="number"
                  className="form-control form-control-custom text-light"
                  value={editHourlyRate}
                  onChange={(e) => setEditHourlyRate(e.target.value)}
                  placeholder="e.g. 50"
                  min="0"
                />
              </div>
              <div className="col-md-8">
                <label className="form-label text-secondary small fw-medium">Bio / Experience Summary</label>
                <textarea
                  className="form-control form-control-custom text-light"
                  rows="2"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell clients about your services..."
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium d-block">Services (Skills)</label>
              <div className="row g-2">
                {servicesList.map(skill => (
                  <div className="col-md-4 col-6" key={skill}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`edit-skill-${skill}`}
                        checked={editSkills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                      />
                      <label className="form-check-label text-light small" htmlFor={`edit-skill-${skill}`}>
                        {skill}
                      </label>
                    </div>
                  </div>
                ))}
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

      {/* Metrics widgets */}
      <div className="row g-4 mb-5">
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-total text-center">
            <h5 className="text-secondary small fw-medium mb-1">Total Bookings</h5>
            <h2 className="fw-bold mb-0 text-white brand-font">{stats.total}</h2>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-pending text-center">
            <h5 className="text-secondary small fw-medium mb-1">Pending</h5>
            <h2 className="fw-bold mb-0 text-warning brand-font">{stats.pending}</h2>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-active text-center">
            <h5 className="text-secondary small fw-medium mb-1">Active Jobs</h5>
            <h2 className="fw-bold mb-0 text-purple brand-font" style={{ color: '#fb923c' }}>{stats.active}</h2>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-resolved text-center">
            <h5 className="text-secondary small fw-medium mb-1">Completed</h5>
            <h2 className="fw-bold mb-0 text-emerald brand-font" style={{ color: '#10b981' }}>{stats.completed}</h2>
          </div>
        </div>
      </div>

      {/* Message alerts */}
      {errorMsg && (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger rounded-3 p-3 mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success rounded-3 p-3 mb-4">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
        </div>
      )}

      {/* Filters section */}
      <div className="glass-card p-4 mb-4">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h4 className="brand-font fs-5 text-light mb-0"><i className="bi bi-list-task text-info me-2"></i> Booked Jobs</h4>
          </div>
          <div className="col-md-6 text-md-end mt-2 mt-md-0">
            <div className="btn-group" role="group">
              {['All', 'Pending', 'Active', 'Completed', 'Rejected'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`btn ${statusFilter === status ? 'btn-cyan' : 'btn-outline-custom'} px-3 py-2`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bookings listing */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="glass-card p-5 text-center">
          <i className="bi bi-inbox text-secondary fs-1"></i>
          <h4 className="mt-3 brand-font">No jobs found</h4>
          <p className="text-secondary small">
            {statusFilter !== 'All' 
              ? 'No requests match your current status filter.'
              : 'You have not received any booking requests yet.'}
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredBookings.map((b) => (
            <div className="col-md-6" key={b._id}>
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
                    <span className="badge bg-dark border border-info text-info small px-2 py-1">
                      {b.serviceType}
                    </span>
                    <span className={`status-badge ${getStatusBadgeClass(b.status)}`}>
                      <i className={`bi bi-${b.status === 'Completed' ? 'check-circle' : b.status === 'Accepted' ? 'arrow-repeat' : 'clock'}`}></i>
                      {b.status}
                    </span>
                  </div>

                  <h3 className="brand-font fs-5 text-light mb-2">Request from: {b.user?.name || 'Unknown'}</h3>
                  <p className="text-secondary small mb-4">{b.description}</p>

                  <div className="p-3 bg-dark bg-opacity-30 rounded-3 border border-secondary border-opacity-10 mb-4">
                    <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-geo-alt-fill text-warning me-1"></i>
                      <strong className="text-light">Service Address: </strong>
                      {b.location}
                    </div>
                    {b.bookingDate && (
                      <div className="text-secondary small mt-1" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-calendar-event text-info me-1"></i>
                        <strong className="text-light">Scheduled Time: </strong>
                        {new Date(b.bookingDate).toLocaleDateString()} at {b.bookingTime}
                      </div>
                    )}
                    <div className="text-secondary small mt-1" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-envelope-fill text-info me-1"></i>
                      <strong className="text-light">Email: </strong>
                      {b.user?.email}
                    </div>
                  </div>
                </div>

                <div>
                  {b.status === 'Pending' && (
                    <div className="d-flex gap-2 pt-3 border-top border-secondary border-opacity-10">
                      <button
                        onClick={() => handleUpdateStatus(b._id, 'Accepted')}
                        className="btn btn-cyan flex-grow-1 py-2"
                      >
                        <i className="bi bi-check-lg me-1"></i> Accept Job
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b._id, 'Rejected')}
                        className="btn btn-outline-danger py-2 px-3"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {b.status === 'Accepted' && (
                    <div className="pt-3 border-top border-secondary border-opacity-10">
                      <button
                        onClick={() => handleUpdateStatus(b._id, 'Completed')}
                        className="btn btn-success w-100 py-2"
                      >
                        <i className="bi bi-check2-all me-1"></i> Mark Job Completed
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-top border-secondary border-opacity-10 pt-3 mt-3 d-flex justify-content-between align-items-center">
                  <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                    Received: {new Date(b.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                  <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                    Updated: {new Date(b.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
