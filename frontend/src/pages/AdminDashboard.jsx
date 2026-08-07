import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get('/admin/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setErrorMsg('Failed to load administrative stats. Make sure you are authorized.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger rounded-3 p-4">
          <i className="bi bi-exclamation-triangle-fill fs-4 me-2"></i> {errorMsg}
        </div>
      </div>
    );
  }

  const { stats, users, bookings } = data;

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="row mb-5">
        <div className="col-12">
          <h2 className="brand-font gradient-title mb-1">Admin Control Center</h2>
          <p className="text-secondary small">System statistics, user registration, and active booking records tracking.</p>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="glass-card p-3 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${activeTab === 'overview' ? 'btn-cyan' : 'btn-outline-custom'} px-4 py-2`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-speedometer me-2"></i> System Overview
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'users' ? 'btn-cyan' : 'btn-outline-custom'} px-4 py-2`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people me-2"></i> Registered Users ({users.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'bookings' ? 'btn-cyan' : 'btn-outline-custom'} px-4 py-2`}
            onClick={() => setActiveTab('bookings')}
          >
            <i className="bi bi-calendar-event me-2"></i> Booking Log ({bookings.length})
          </button>
        </div>
        <button className="btn btn-outline-custom" onClick={fetchAdminStats} title="Refresh Data">
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div>
          {/* Metrics Widget Group 1: Users */}
          <h5 className="brand-font text-info mb-3"><i className="bi bi-people-fill me-2"></i> User Demographics</h5>
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <div className="glass-card p-4 text-center">
                <span className="text-secondary small d-block mb-1">Total Registered</span>
                <h2 className="fw-bold mb-0 text-white brand-font">{stats.users.total}</h2>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-4 text-center border border-info border-opacity-15">
                <span className="text-secondary small d-block mb-1">Service Providers</span>
                <h2 className="fw-bold mb-0 text-info brand-font">{stats.users.providers}</h2>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-4 text-center">
                <span className="text-secondary small d-block mb-1">Standard Clients</span>
                <h2 className="fw-bold mb-0 text-emerald brand-font" style={{ color: '#10b981' }}>{stats.users.clients}</h2>
              </div>
            </div>
          </div>

          {/* Metrics Widget Group 2: Bookings */}
          <h5 className="brand-font text-info mb-3"><i className="bi bi-clock-history me-2"></i> Service Bookings</h5>
          <div className="row g-4 mb-4">
            <div className="col-6 col-md-3">
              <div className="glass-card p-3 text-center">
                <span className="text-secondary small d-block mb-1">Total Bookings</span>
                <h4 className="fw-bold mb-0 text-white brand-font">{stats.bookings.total}</h4>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="glass-card p-3 text-center border border-warning border-opacity-15">
                <span className="text-secondary small d-block mb-1">Pending</span>
                <h4 className="fw-bold mb-0 text-warning brand-font">{stats.bookings.pending}</h4>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="glass-card p-3 text-center border border-primary border-opacity-15">
                <span className="text-secondary small d-block mb-1">Active / Accepted</span>
                <h4 className="fw-bold mb-0 text-primary brand-font" style={{ color: '#fb923c' }}>{stats.bookings.accepted}</h4>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="glass-card p-3 text-center border border-success border-opacity-15">
                <span className="text-secondary small d-block mb-1">Completed</span>
                <h4 className="fw-bold mb-0 text-success brand-font" style={{ color: '#10b981' }}>{stats.bookings.completed}</h4>
              </div>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-6 col-md-3">
              <div className="glass-card p-3 text-center border border-danger border-opacity-15">
                <span className="text-secondary small d-block mb-1">Rejected Requests</span>
                <h4 className="fw-bold mb-0 text-danger brand-font">{stats.bookings.rejected}</h4>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="glass-card p-3 text-center">
                <span className="text-secondary small d-block mb-1">Submitted Reviews</span>
                <h4 className="fw-bold mb-0 text-warning brand-font">{stats.reviews.total}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="glass-card p-4">
          <h4 className="brand-font fs-5 text-light mb-4"><i className="bi bi-people me-2"></i> User Administration</h4>
          <div className="table-responsive">
            <table className="table table-dark table-hover border-secondary border-opacity-15">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Location/City</th>
                  <th scope="col">Rating Stats</th>
                  <th scope="col">Created Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td><strong className="text-light">{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'bg-danger' : u.role === 'provider' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{u.location || <span className="text-secondary small">N/A</span>}</td>
                    <td>
                      {u.role === 'provider' ? (
                        <span className="text-warning small">★ {u.averageRating ? u.averageRating.toFixed(1) : '0.0'} ({u.numReviews} reviews)</span>
                      ) : (
                        <span className="text-secondary small">N/A</span>
                      )}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="glass-card p-4">
          <h4 className="brand-font fs-5 text-light mb-4"><i className="bi bi-calendar-event me-2"></i> Booking Administration</h4>
          <div className="table-responsive">
            <table className="table table-dark table-hover border-secondary border-opacity-15">
              <thead>
                <tr>
                  <th scope="col">Client</th>
                  <th scope="col">Provider</th>
                  <th scope="col">Service Type</th>
                  <th scope="col">Address</th>
                  <th scope="col">Scheduled Date/Time</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created At</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td><strong className="text-light">{b.user?.name || 'Unknown'}</strong></td>
                    <td>{b.provider?.name || 'Unknown'}</td>
                    <td><span className="text-info">{b.serviceType}</span></td>
                    <td><span className="small text-secondary">{b.location}</span></td>
                    <td>
                      {b.bookingDate ? (
                        <span className="small text-light">{new Date(b.bookingDate).toLocaleDateString()} at {b.bookingTime}</span>
                      ) : (
                        <span className="text-secondary small">N/A</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        b.status === 'Completed' ? 'bg-success' :
                        b.status === 'Accepted' ? 'bg-primary' :
                        b.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
