import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await API.put('/notifications/read');
      if (res.data.success) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking notifications read:', error);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      const res = await API.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="dock-container">
      <nav className="navbar-dock">
        {/* Brand/Logo - compact */}
        <Link className="dock-brand" to="/">
          <i className="bi bi-tools text-emerald"></i>
          <span className="brand-name font-heading">ServiceConnect</span>
        </Link>
        
        <div className="dock-divider"></div>

        {/* Navigation Items */}
        <div className="dock-items">
          {user ? (
            <>
              {user.role === 'user' && (
                <Link className={`dock-item ${isActive('/dashboard')}`} to="/dashboard">
                  <i className="bi bi-search"></i>
                  <span className="dock-label">Find Services</span>
                </Link>
              )}
              {user.role === 'provider' && (
                <Link className={`dock-item ${isActive('/provider-dashboard')}`} to="/provider-dashboard">
                  <i className="bi bi-speedometer2"></i>
                  <span className="dock-label">Jobs Dashboard</span>
                </Link>
              )}
              {user.role === 'admin' && (
                <Link className={`dock-item ${isActive('/admin-dashboard')}`} to="/admin-dashboard">
                  <i className="bi bi-shield-check"></i>
                  <span className="dock-label">Admin Panel</span>
                </Link>
              )}
              
              {/* Notification Bell */}
              <div className="position-relative d-flex align-items-center" ref={notifRef} style={{ cursor: 'pointer' }}>
                <button
                  className="dock-item bg-transparent border-0 position-relative"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  title="Notifications"
                >
                  <i className="bi bi-bell"></i>
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger border border-dark" style={{ fontSize: '0.55rem', padding: '0.25em 0.45em' }}>
                      {unreadCount}
                    </span>
                  )}
                  <span className="dock-label">Notifications</span>
                </button>

                {showNotifDropdown && (
                  <div className="position-absolute glass-card p-3 text-light" style={{
                    bottom: '75px',
                    right: '-10px',
                    width: '320px',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    zIndex: 2000,
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(25, 28, 36, 0.95)',
                    borderRadius: '12px'
                  }}>
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-20">
                      <h6 className="brand-font mb-0 text-info" style={{ fontSize: '0.9rem' }}><i className="bi bi-bell-fill me-1"></i> Notifications</h6>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="btn btn-link p-0 text-cyan small"
                          style={{ fontSize: '0.7rem', textDecoration: 'none' }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-secondary text-center small py-3 mb-0">No notifications yet</p>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {notifications.map(n => (
                          <div
                            key={n._id}
                            onClick={() => !n.isRead && handleMarkSingleRead(n._id)}
                            className={`p-2 rounded small text-wrap text-start ${n.isRead ? 'bg-dark bg-opacity-20 text-secondary' : 'bg-info bg-opacity-10 border border-info border-opacity-20 text-light'}`}
                            style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              <strong className={n.isRead ? 'text-secondary' : 'text-info'}>{n.title}</strong>
                              {!n.isRead && <span className="badge bg-cyan rounded-circle p-1 mt-1" style={{ width: '6px', height: '6px' }} />}
                            </div>
                            <p className="mb-1 text-wrap text-break text-secondary animate-fade-in" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>{n.message}</p>
                            <span className="text-secondary" style={{ fontSize: '0.6rem' }}>
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="dock-user-info d-none d-md-flex">
                <span className="text-secondary small">
                  Hi, <strong className="text-emerald">{user.name}</strong>
                </span>
              </div>

              <button className="dock-btn-logout" onClick={handleLogout} title="Logout">
                <i className="bi bi-box-arrow-right"></i>
                <span className="dock-label">Logout</span>
              </button>
            </>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link className={`dock-item ${isActive('/login')}`} to="/login">
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span className="dock-label">Login</span>
                </Link>
              )}
              {location.pathname !== '/register' && (
                <Link className={`dock-item ${isActive('/register')}`} to="/register">
                  <i className="bi bi-person-plus"></i>
                  <span className="dock-label">Register</span>
                </Link>
              )}
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
