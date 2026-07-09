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
