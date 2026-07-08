import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom py-3">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <i className="bi bi-shield-exclamation text-info fs-3"></i>
          <span className="brand-font fw-bold text-info">ResolveNet</span>
        </Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {user && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom ${isActive('/dashboard')}`} to="/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i> Dashboard
                  </Link>
                </li>
                {user.role === 'user' && (
                  <li className="nav-item">
                    <Link className={`nav-link nav-link-custom ${isActive('/submit-complaint')}`} to="/submit-complaint">
                      <i className="bi bi-plus-circle me-1"></i> File Complaint
                    </Link>
                  </li>
                )}
                {user.role === 'admin' && (
                  <li className="nav-item">
                    <Link className={`nav-link nav-link-custom ${isActive('/admin')}`} to="/admin">
                      <i className="bi bi-kanban me-1"></i> Admin Portal
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            {user ? (
              <>
                <span className="text-secondary small">
                  Logged in as <strong className="text-info">{user.name}</strong> ({user.role})
                </span>
                <button className="btn btn-outline-custom btn-sm py-2" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </>
            ) : (
              <>
                {location.pathname !== '/login' && (
                  <Link className="btn btn-outline-custom px-4" to="/login">Login</Link>
                )}
                {location.pathname !== '/register' && (
                  <Link className="btn btn-cyan px-4" to="/register">Get Started</Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
