import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API, { API_BASE_URL } from '../services/api';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // For modal preview
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await API.get('/complaints/user');
      if (res.data.success) {
        setComplaints(res.data.complaints);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper stats counters
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    active: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length
  };

  // Filtering criteria
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStepStatus = (status, nodeName) => {
    if (status === 'Pending') {
      if (nodeName === 'Pending') return 'active';
      return '';
    }
    if (status === 'In Progress') {
      if (nodeName === 'Pending') return 'completed';
      if (nodeName === 'In Progress') return 'active';
      return '';
    }
    if (status === 'Resolved') {
      return 'completed';
    }
    return '';
  };

  return (
    <div className="container py-5">
      {/* Header section */}
      <div className="row mb-5 align-items-center">
        <div className="col-md-8">
          <h2 className="brand-font text-info mb-1">Welcome back, {user?.name}!</h2>
          <p className="text-secondary small">Track, manage, and file complaints on your neighborhood infrastructure issues.</p>
        </div>
        <div className="col-md-4 text-md-end mt-3 mt-md-0">
          <Link to="/submit-complaint" className="btn btn-cyan btn-lg py-3 px-4 shadow">
            <i className="bi bi-plus-circle-fill me-2"></i> File New Complaint
          </Link>
        </div>
      </div>

      {/* Metrics breakdown dashboard widgets */}
      <div className="row g-4 mb-5">
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-total text-center">
            <h5 className="text-secondary small fw-medium mb-1">Total Filed</h5>
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
            <h5 className="text-secondary small fw-medium mb-1">In Progress</h5>
            <h2 className="fw-bold mb-0 text-purple brand-font" style={{ color: '#8b5cf6' }}>{stats.active}</h2>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-resolved text-center">
            <h5 className="text-secondary small fw-medium mb-1">Resolved</h5>
            <h2 className="fw-bold mb-0 text-emerald brand-font" style={{ color: '#10b981' }}>{stats.resolved}</h2>
          </div>
        </div>
      </div>

      {/* Filters section */}
      <div className="glass-card p-4 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-secondary text-secondary">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control form-control-custom ps-0"
                style={{ borderLeft: 'none' }}
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-8 text-md-end">
            <div className="btn-group" role="group">
              {['All', 'Pending', 'In Progress', 'Resolved'].map((status) => (
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

      {/* Complaints List Cards */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary">Loading your submitted complaints...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="glass-card p-5 text-center">
          <i className="bi bi-folder-x text-secondary fs-1"></i>
          <h4 className="mt-3 brand-font">No complaints found</h4>
          <p className="text-secondary small">
            {searchQuery || statusFilter !== 'All' 
              ? 'No items match your active filters. Try resetting search parameters.'
              : 'You have not submitted any complaints yet.'}
          </p>
          {!searchQuery && statusFilter === 'All' && (
            <Link to="/submit-complaint" className="btn btn-cyan mt-3 px-4">
              File Your First Complaint
            </Link>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {filteredComplaints.map((c) => (
            <div className="col-md-6" key={c._id}>
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  {/* Title & Badges */}
                  <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
                    <span className={`priority-tag priority-${c.priority.toLowerCase()}`}>
                      {c.priority} Priority
                    </span>
                    <span className={`status-badge status-${c.status.replace(/\s+/g, '').toLowerCase()}`}>
                      <i className={`bi bi-${c.status === 'Resolved' ? 'check-circle' : c.status === 'In Progress' ? 'arrow-repeat' : 'clock'}`}></i>
                      {c.status}
                    </span>
                  </div>

                  <h3 className="brand-font fs-5 text-light mb-2">{c.title}</h3>
                  <p className="text-secondary small mb-4" style={{ display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.description}
                  </p>

                  {/* Complaint Progress Stepper */}
                  <div className="mb-4">
                    <h6 className="text-secondary small fw-medium mb-3">Resolution Flow</h6>
                    <div className="stepper px-2">
                      <div className="d-flex flex-column align-items-center">
                        <div className={`step-node ${getStepStatus(c.status, 'Pending')}`}>
                          <i className="bi bi-send small"></i>
                        </div>
                        <span className="text-secondary small mt-1" style={{ fontSize: '0.7rem' }}>Submitted</span>
                      </div>
                      <div className="d-flex flex-column align-items-center">
                        <div className={`step-node ${getStepStatus(c.status, 'In Progress')}`}>
                          <i className="bi bi-wrench small"></i>
                        </div>
                        <span className="text-secondary small mt-1" style={{ fontSize: '0.7rem' }}>Active</span>
                      </div>
                      <div className="d-flex flex-column align-items-center">
                        <div className={`step-node ${getStepStatus(c.status, 'Resolved')}`}>
                          <i className="bi bi-check2-all small"></i>
                        </div>
                        <span className="text-secondary small mt-1" style={{ fontSize: '0.7rem' }}>Resolved</span>
                      </div>
                    </div>
                  </div>

                  {/* Image attachment / Location / Assignments */}
                  <div className="row g-3 mb-3">
                    {c.image && (
                      <div className="col-4">
                        <div 
                          className="border border-secondary rounded-3 overflow-hidden position-relative" 
                          style={{ height: '70px', cursor: 'pointer' }}
                          onClick={() => setSelectedImage(`${API_BASE_URL}${c.image}`)}
                        >
                          <img
                            src={`${API_BASE_URL}${c.image}`}
                            alt="Incident attachment"
                            className="w-100 h-100"
                            style={{ objectFit: 'cover' }}
                          />
                          <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-70 text-center text-white" style={{ fontSize: '0.55rem', padding: '1px 0' }}>
                            <i className="bi bi-fullscreen"></i> Zoom
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={c.image ? "col-8" : "col-12"}>
                      <div className="p-3 bg-dark bg-opacity-30 rounded-3 border border-secondary border-opacity-10 h-100">
                        <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-geo-alt-fill text-info me-1"></i>
                          <strong className="text-light">Location: </strong>
                          {c.location.address || `Coordinates (${c.location.latitude.toFixed(4)}, ${c.location.longitude.toFixed(4)})`}
                        </div>
                        <div className="text-secondary small mt-1" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-person-badge-fill text-info me-1"></i>
                          <strong className="text-light">Worker: </strong>
                          {c.assignedWorker}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin notes if resolved */}
                {c.adminComments && (
                  <div className="mt-3 p-3 rounded-3 bg-emerald bg-opacity-10 border-start border-3 border-success text-success small" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                    <strong className="d-block mb-1"><i className="bi bi-chat-square-text-fill me-1"></i> Resolution Notes:</strong>
                    {c.adminComments}
                  </div>
                )}
                
                <div className="border-top border-secondary border-opacity-10 pt-3 mt-3 d-flex justify-content-between align-items-center">
                  <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                    Filed: {new Date(c.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                  <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                    Updated: {new Date(c.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal Lightbox overlay */}
      {selectedImage && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-90 d-flex align-items-center justify-content-center" 
          style={{ zIndex: 1050, cursor: 'zoom-out' }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="position-relative p-2" style={{ maxWidth: '90%', maxHeight: '90%' }}>
            <img 
              src={selectedImage} 
              alt="Expanded view" 
              className="img-fluid rounded-3 border border-secondary"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
            <button 
              className="btn btn-outline-light btn-sm position-absolute top-0 end-0 m-3 rounded-circle"
              onClick={() => setSelectedImage(null)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
