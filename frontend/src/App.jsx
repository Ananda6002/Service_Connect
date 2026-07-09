import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import ProviderDashboard from './pages/ProviderDashboard';

// Protected Route wrapper for standard login check
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-info" role="status"></div>
      </div>
    );
  }

  return token ? children : <Navigate to="/login" replace />;
};

// Provider protected route wrapper
const ProviderRoute = ({ children }) => {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-info" role="status"></div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return user && user.role === 'provider' ? children : <Navigate to="/dashboard" replace />;
};

const AppContent = () => {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User (Client) dashboard page */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {user?.role === 'provider' ? <Navigate to="/provider-dashboard" replace /> : <UserDashboard />}
          </ProtectedRoute>
        } />
        
        {/* Provider dashboard page */}
        <Route path="/provider-dashboard" element={
          <ProviderRoute>
            <ProviderDashboard />
          </ProviderRoute>
        } />

        {/* Dynamic home routing based on authentication role */}
        <Route path="/" element={
          user ? (
            user.role === 'provider' ? <Navigate to="/provider-dashboard" replace /> : <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Catch all fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
