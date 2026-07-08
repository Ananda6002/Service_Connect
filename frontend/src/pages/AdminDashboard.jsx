import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import API, { API_BASE_URL } from '../services/api';

// Create status-colored custom leaflet markers to avoid missing asset paths
const getMarkerIcon = (status) => {
  let color = '#f59e0b'; // Pending: Yellow
  if (status === 'In Progress') color = '#8b5cf6'; // In Progress: Purple
  if (status === 'Resolved') color = '#10b981'; // Resolved: Green

  return new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px ${color}; transform: translate(-4px, -4px);"></div>`,
    className: 'custom-leaflet-marker-status',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive action states
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [workerName, setWorkerName] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ type: '', msg: '' });

  const adminMapRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await API.get('/complaints/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      
      // Fetch all complaints
      const complaintsRes = await API.get('/complaints');
      if (complaintsRes.data.success) {
        setComplaints(complaintsRes.data.complaints);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorker = async (complaintId) => {
    if (!workerName.trim()) return;
    setActionLoading(true);
    setAlertInfo({ type: '', msg: '' });
    try {
      const res = await API.put(`/complaints/${complaintId}/assign`, { assignedWorker: workerName });
      if (res.data.success) {
        setAlertInfo({ type: 'success', msg: `Assigned successfully to ${workerName}!` });
        // Refresh local items
        setComplaints(prev => prev.map(c => c._id === complaintId ? { ...c, assignedWorker: workerName, status: c.status === 'Pending' ? 'In Progress' : c.status } : c));
        // Reset inputs
        if (selectedComplaint && selectedComplaint._id === complaintId) {
          setSelectedComplaint(prev => ({ ...prev, assignedWorker: workerName, status: prev.status === 'Pending' ? 'In Progress' : prev.status }));
        }
        setWorkerName('');
        // Update stats
        fetchData();
      }
    } catch (error) {
      setAlertInfo({ type: 'danger', msg: 'Failed to assign worker.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    setActionLoading(true);
    setAlertInfo({ type: '', msg: '' });
    try {
      const res = await API.put(`/complaints/${complaintId}/status`, { 
        status: newStatus, 
        adminComments: resolutionComment 
      });
      
      if (res.data.success) {
        setAlertInfo({ type: 'success', msg: `Complaint updated to status: ${newStatus}!` });
        setComplaints(prev => prev.map(c => c._id === complaintId ? { ...c, status: newStatus, adminComments: resolutionComment } : c));
        if (selectedComplaint && selectedComplaint._id === complaintId) {
          setSelectedComplaint(prev => ({ ...prev, status: newStatus, adminComments: resolutionComment }));
        }
        setResolutionComment('');
        fetchData();
      }
    } catch (error) {
      setAlertInfo({ type: 'danger', msg: 'Failed to update status.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter complaints based on selections
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="container py-5">
      {/* Title block */}
      <div className="mb-4">
        <h2 className="brand-font text-info mb-1">Administrative Control Portal</h2>
        <p className="text-secondary small">Review filed citizen complaints, coordinate tasks, manage priorities, and track status</p>
      </div>

      {alertInfo.msg && (
        <div className={`alert alert-${alertInfo.type} border-0 bg-${alertInfo.type} bg-opacity-10 text-${alertInfo.type} rounded-3 p-3 mb-4`}>
          <i className="bi bi-info-circle-fill me-2"></i> {alertInfo.msg}
        </div>
      )}

      {/* Stats Counter Modules */}
      <div className="row g-4 mb-5">
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-total text-center">
            <h5 className="text-secondary small fw-medium mb-1">Total Submissions</h5>
            <h2 className="fw-bold mb-0 text-white brand-font">{stats.total}</h2>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-pending text-center">
            <h5 className="text-secondary small fw-medium mb-1">Pending Review</h5>
            <h2 className="fw-bold mb-0 text-warning brand-font">{stats.pending}</h2>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-active text-center">
            <h5 className="text-secondary small fw-medium mb-1">Active / Assignees</h5>
            <h2 className="fw-bold mb-0 text-purple brand-font" style={{ color: '#8b5cf6' }}>{stats.inProgress}</h2>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="glass-card metric-card metric-resolved text-center">
            <h5 className="text-secondary small fw-medium mb-1">Resolved Cases</h5>
            <h2 className="fw-bold mb-0 text-emerald brand-font" style={{ color: '#10b981' }}>{stats.resolved}</h2>
          </div>
        </div>
      </div>

      {/* Map Overview Section */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="glass-card p-4">
            <h4 className="brand-font text-light fs-5 mb-3">
              <i className="bi bi-map-fill text-info me-2"></i> Interactive Complaint Map Layout
            </h4>
            <div className="map-container" style={{ height: '360px' }}>
              <MapContainer
                center={[28.6139, 77.2090]} // default Central marker
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                ref={adminMapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {complaints
                  .filter(c => c.location && c.location.latitude && c.location.longitude)
                  .map(c => (
                    <Marker 
                      key={c._id} 
                      position={[c.location.latitude, c.location.longitude]} 
                      icon={getMarkerIcon(c.status)}
                    >
                      <Popup>
                        <div style={{ color: '#1e293b', width: '220px' }}>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase', 
                            color: c.priority === 'High' ? '#f43f5e' : c.priority === 'Medium' ? '#f59e0b' : '#06b6d4',
                            display: 'block',
                            marginBottom: '2px'
                          }}>
                            {c.priority} Priority - {c.status}
                          </span>
                          <strong style={{ fontSize: '0.9rem' }}>{c.title}</strong>
                          <p style={{ margin: '5px 0', fontSize: '0.8rem', color: '#64748b' }}>
                            {c.description.substring(0, 80)}...
                          </p>
                          <small style={{ display: 'block', borderTop: '1px solid #e2e8f0', paddingTop: '4px', fontSize: '0.7rem' }}>
                            <strong>Reporter:</strong> {c.userId?.name || 'Unknown'}
                          </small>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>
            <div className="d-flex flex-wrap gap-4 mt-3 small text-secondary">
              <div className="d-flex align-items-center gap-2">
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                Pending Review
              </div>
              <div className="d-flex align-items-center gap-2">
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }}></span>
                In Progress
              </div>
              <div className="d-flex align-items-center gap-2">
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                Resolved
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Filters + Complaints List Table */}
      <div className="row g-4">
        {/* Left Side: Filtering and Table */}
        <div className={selectedComplaint ? 'col-lg-7' : 'col-lg-12'}>
          <div className="glass-card p-4 h-100">
            <h4 className="brand-font fs-5 text-light mb-4">Review Submissions</h4>

            {/* Filter bars */}
            <div className="row g-3 mb-4">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="Search title, details, reporter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-3">
                <select
                  className="form-select form-control-custom"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="col-6 col-md-4">
                <select
                  className="form-select form-control-custom"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            </div>

            {/* Table layout */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status"></div>
                <p className="mt-3 text-secondary">Loading complaints...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-patch-question fs-1 text-secondary"></i>
                <p className="mt-3 text-secondary">No complaints match your active filters.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover border-secondary align-middle mb-0" style={{ background: 'transparent' }}>
                  <thead>
                    <tr style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <th className="border-0 text-secondary small fw-bold">Citizen</th>
                      <th className="border-0 text-secondary small fw-bold">Issue Title</th>
                      <th className="border-0 text-secondary small fw-bold">Priority</th>
                      <th className="border-0 text-secondary small fw-bold">Status</th>
                      <th className="border-0 text-secondary small fw-bold text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((c) => (
                      <tr 
                        key={c._id} 
                        style={{ cursor: 'pointer', borderColor: 'rgba(255,255,255,0.05)' }}
                        onClick={() => {
                          setSelectedComplaint(c);
                          setWorkerName(c.assignedWorker === 'Unassigned' ? '' : c.assignedWorker);
                          setUpdatingStatus(c.status);
                        }}
                        className={selectedComplaint?._id === c._id ? 'table-active' : ''}
                      >
                        <td className="border-secondary border-opacity-10 py-3">
                          <strong className="text-light d-block">{c.userId?.name || 'Anonymous'}</strong>
                          <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>{c.userId?.email}</span>
                        </td>
                        <td className="border-secondary border-opacity-10">
                          <span className="text-light d-block text-truncate" style={{ maxWidth: '180px' }}>{c.title}</span>
                          <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="border-secondary border-opacity-10">
                          <span className={`priority-tag priority-${c.priority.toLowerCase()}`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="border-secondary border-opacity-10">
                          <span className={`status-badge status-${c.status.replace(/\s+/g, '').toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                            {c.status}
                          </span>
                        </td>
                        <td className="border-secondary border-opacity-10 text-end">
                          <button className="btn btn-outline-custom btn-sm py-2 px-3">
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Action Panel: Modify status, assignments, details */}
        {selectedComplaint && (
          <div className="col-lg-5">
            <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="brand-font text-info fs-5 mb-0">Complaint Details</h4>
                  <button 
                    type="button" 
                    className="btn btn-outline-custom p-1 rounded-circle" 
                    onClick={() => setSelectedComplaint(null)}
                    style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <i className="bi bi-x-lg small"></i>
                  </button>
                </div>

                {/* Info summary */}
                <div className="mb-4">
                  <span className={`priority-tag priority-${selectedComplaint.priority.toLowerCase()} mb-2 d-inline-block`}>
                    {selectedComplaint.priority} Priority
                  </span>
                  <h3 className="brand-font fs-5 text-light">{selectedComplaint.title}</h3>
                  <p className="text-secondary small mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedComplaint.description}
                  </p>
                  
                  {/* Incident Image View */}
                  {selectedComplaint.image && (
                    <div className="mb-3">
                      <label className="text-secondary small fw-medium d-block mb-1">Attachment Thumbnail</label>
                      <a 
                        href={`${API_BASE_URL}${selectedComplaint.image}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="d-inline-block border border-secondary rounded-3 overflow-hidden"
                      >
                        <img 
                          src={`${API_BASE_URL}${selectedComplaint.image}`} 
                          alt="Incident proof" 
                          style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'cover' }}
                        />
                      </a>
                    </div>
                  )}

                  <hr className="border-secondary border-opacity-20 my-3" />

                  {/* Geolocation metadata */}
                  <div className="mb-3">
                    <span className="text-secondary small d-block">
                      <i className="bi bi-geo-alt-fill text-info me-1"></i>
                      <strong>Reported Location: </strong>
                      {selectedComplaint.location.address || 'GPS Coordinates'}
                    </span>
                    <span className="text-secondary small d-block mt-1 ps-4" style={{ fontSize: '0.75rem' }}>
                      Latitude: {selectedComplaint.location.latitude.toFixed(6)}, Longitude: {selectedComplaint.location.longitude.toFixed(6)}
                    </span>
                  </div>

                  <span className="text-secondary small d-block">
                    <i className="bi bi-person-fill text-info me-1"></i>
                    <strong>Reporter Name: </strong>
                    {selectedComplaint.userId?.name || 'Anonymous citizen'} ({selectedComplaint.userId?.email})
                  </span>
                </div>

                <hr className="border-secondary border-opacity-20 my-4" />

                {/* Worker assignment module */}
                <div className="mb-4">
                  <label className="form-label text-light small fw-medium">Assign Tasks to worker</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      placeholder="Enter worker's name..."
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                    />
                    <button
                      className="btn btn-cyan px-3"
                      type="button"
                      onClick={() => handleAssignWorker(selectedComplaint._id)}
                      disabled={actionLoading}
                    >
                      Assign
                    </button>
                  </div>
                  <span className="text-secondary small mt-1 d-block" style={{ fontSize: '0.75rem' }}>
                    Current Worker: <strong className="text-light">{selectedComplaint.assignedWorker}</strong>
                  </span>
                </div>

                {/* Status & Resolution comment module */}
                <div className="mb-4">
                  <label className="form-label text-light small fw-medium">Resolution Actions</label>
                  <div className="mb-3">
                    <select
                      className="form-select form-control-custom"
                      value={updatingStatus}
                      onChange={(e) => setUpdatingStatus(e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  {updatingStatus === 'Resolved' && (
                    <div className="mb-3">
                      <label className="form-label text-secondary small">Resolution Notes (will display to Citizen)</label>
                      <textarea
                        className="form-control form-control-custom"
                        rows="3"
                        placeholder="Explain resolution (e.g. hazard removed, repair team completed potholes fixing)..."
                        value={resolutionComment}
                        onChange={(e) => setResolutionComment(e.target.value)}
                      ></textarea>
                    </div>
                  )}

                  <button
                    className="btn btn-cyan w-100 py-2 mt-2"
                    type="button"
                    onClick={() => handleUpdateStatus(selectedComplaint._id, updatingStatus)}
                    disabled={actionLoading}
                  >
                    Save Status & Comments
                  </button>
                </div>
              </div>

              {selectedComplaint.adminComments && (
                <div className="mt-3 p-3 rounded-3 bg-secondary bg-opacity-20 border-start border-3 border-info text-info small">
                  <strong>Previous Resolution Notes:</strong>
                  <p className="mb-0 text-light mt-1">{selectedComplaint.adminComments}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
