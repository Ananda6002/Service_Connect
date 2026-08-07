import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import MapModal from '../components/MapModal';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Provider-specific states
  const [skills, setSkills] = useState([]);
  const [customSkills, setCustomSkills] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const availableSkills = ['Electrician', 'Plumber', 'Technician', 'Carpenter', 'Painter', 'AC Repair'];
  const availableCities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Coimbatore', 'Madurai', 'Kochi', 'Chandigarh', 'Guwahati', 'Bhubaneswar', 'Dehradun', 'Amritsar', 'Mysore', 'Ranchi', 'Jodhpur'];

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'provider') {
        navigate('/provider-dashboard');
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

    const extraFields = {};
    if (role === 'provider') {
      const parsedCustomSkills = customSkills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const allSkills = [...skills, ...parsedCustomSkills];

      if (allSkills.length === 0) {
        setErrorMsg('Please select or specify at least one skill.');
        return;
      }
      if (!location || !phone) {
        setErrorMsg('Please enter both location and contact phone number.');
        return;
      }
      extraFields.skills = allSkills;
      extraFields.location = location;
      extraFields.phone = phone;
      extraFields.bio = bio;
      extraFields.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : 0;
      extraFields.latitude = latitude;
      extraFields.longitude = longitude;
    }

    setLoadingSubmit(true);
    const result = await register(name, email, password, role, extraFields);
    setLoadingSubmit(false);

    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="col-md-6 col-lg-5">
          <div className="glass-card p-5">
            <div className="text-center mb-4">
              <i className="bi bi-person-plus text-info fs-1"></i>
              <h2 className="mt-3 brand-font">Create Account</h2>
              <p className="text-secondary small">Register for the ServiceConnect Portal</p>
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

              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">Register As</label>
                <select
                  className="form-select form-control-custom"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">Standard User (Find & Book Services)</option>
                  <option value="provider">Service Provider (Offer Services)</option>
                </select>
              </div>

              {role === 'provider' && (
                <div className="border border-secondary border-opacity-25 rounded-3 p-3 mb-4 bg-dark bg-opacity-20">
                  <h5 className="text-info fs-6 mb-3"><i className="bi bi-tools me-1"></i> Provider Profile Details</h5>
                  
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-medium d-block">Skills (Select all that apply)</label>
                    <div className="row g-2">
                      {availableSkills.map(skill => (
                        <div className="col-6" key={skill}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`skill-${skill}`}
                              checked={skills.includes(skill)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSkills([...skills, skill]);
                                } else {
                                  setSkills(skills.filter(s => s !== skill));
                                }
                              }}
                            />
                            <label className="form-check-label text-light small" htmlFor={`skill-${skill}`}>
                              {skill}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-medium">Other Skills (separated by commas)</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      placeholder="e.g. Gardening, Car Wash, House Cleaning"
                      value={customSkills}
                      onChange={(e) => setCustomSkills(e.target.value)}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label text-secondary small fw-medium mb-0">Location (City)</label>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-cyan small fw-semibold text-decoration-none"
                          onClick={() => setShowMapModal(true)}
                          title="Pin precise location on map"
                        >
                          <i className="bi bi-geo-alt-fill"></i> Choose on Map
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-control form-control-custom text-light"
                        placeholder="Type or select a city"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          // Reset custom coordinates if they select a different city to let default kick in, unless they pin again
                          setLatitude(null);
                          setLongitude(null);
                        }}
                        list="cities-datalist-register"
                        required={role === 'provider'}
                      />
                      <datalist id="cities-datalist-register">
                        {availableCities.map(city => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                      {latitude && longitude && (
                        <div className="mt-1 small text-info font-monospace" style={{ fontSize: '0.7rem' }}>
                          <i className="bi bi-check-circle-fill text-emerald me-1"></i>
                          Pinned: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-medium">Hourly Rate (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-custom"
                        placeholder="e.g. 50"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        required={role === 'provider'}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-medium">Phone Number</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      placeholder="e.g. (555) 019-2834"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={role === 'provider'}
                    />
                  </div>

                  <div className="mb-0">
                    <label className="form-label text-secondary small fw-medium">Bio / Experience Summary</label>
                    <textarea
                      className="form-control form-control-custom"
                      rows="3"
                      placeholder="Tell potential clients about your experience, services..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              )}

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

            <MapModal
              show={showMapModal}
              onClose={() => setShowMapModal(false)}
              initialCity={location}
              initialLat={latitude}
              initialLng={longitude}
              onConfirm={({ latitude, longitude }) => {
                setLatitude(latitude);
                setLongitude(longitude);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
