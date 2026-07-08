import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import AdminDashboard from './pages/AdminDashboard';

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

// Admin protected route wrapper
const AdminRoute = ({ children }) => {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-info" role="status"></div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return user && user.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
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

        {/* User panel pages */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <Navigate to="/admin" replace /> : <UserDashboard />}
          </ProtectedRoute>
        } />
        
        <Route path="/submit-complaint" element={
          <ProtectedRoute>
            <SubmitComplaint />
          </ProtectedRoute>
        } />

        {/* Admin panel pages */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />

        {/* Dynamic home routing based on authentication role */}
        <Route path="/" element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
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
