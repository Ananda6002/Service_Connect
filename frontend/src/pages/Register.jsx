import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !password) {
      setErrorMsg('Please fill in all standard fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoadingSubmit(true);
    const result = await register(name, email, password, role);
    setLoadingSubmit(false);

    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="col-md-5">
          <div className="glass-card p-5">
            <div className="text-center mb-4">
              <i className="bi bi-person-plus text-info fs-1"></i>
              <h2 className="mt-3 brand-font">Create Account</h2>
              <p className="text-secondary small">Register for the Complaint Management Portal</p>
            </div>

            {errorMsg && (
              <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger rounded-3 p-3 mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">Full Name</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">Email Address</label>
                <input
                  type="email"
                  className="form-control form-control-custom"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">Password (Min. 6 chars)</label>
                <input
                  type="password"
                  className="form-control form-control-custom"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-medium">Register As</label>
                <select
                  className="form-select form-control-custom"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">Standard User (Report & Track)</option>
                  <option value="admin">Administrator (Assign & Resolve)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-cyan w-100 py-3 mb-4 d-flex justify-content-center align-items-center gap-2"
                disabled={loadingSubmit}
              >
                {loadingSubmit ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-check"></i> Register
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="text-secondary small">Already have an account? </span>
                <Link to="/login" className="text-info text-decoration-none small fw-semibold">
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
