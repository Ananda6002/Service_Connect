import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import API from '../services/api';

// Create a custom SVG marker to avoid Vite bundler missing default leaflet marker icon assets
const customMarkerIcon = new L.DivIcon({
  html: `<div style="background-color: #06b6d4; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px rgba(6, 182, 212, 0.7); transform: translate(-5px, -5px);"></div>`,
  className: 'custom-leaflet-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Component to handle map click events
const MapClickHandler = ({ setPosition, fetchAddress }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      fetchAddress(lat, lng);
    }
  });
  return null;
};

const SubmitComplaint = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Location states (Defaults to a central coordinate, eg. New Delhi or NY)
  const [position, setPosition] = useState([28.6139, 77.2090]); // Delhi defaults
  const [address, setAddress] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ type: '', msg: '' });

  const mapRef = useRef();
  const navigate = useNavigate();

  // Load user geolocation on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      setLocLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          fetchAddress(latitude, longitude);
          setLocLoading(false);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          setLocLoading(false);
          // Standard default address check
          fetchAddress(position[0], position[1]);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      fetchAddress(position[0], position[1]);
    }
  };

  // Reverse Geocoding using free OpenStreetMap Nominatim API
  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
      }
    } catch (error) {
      setAddress(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
    }
  };

  // Handle Image Drop / Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAlertInfo({ type: 'danger', msg: 'Only image files are allowed.' });
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Complaint details
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertInfo({ type: '', msg: '' });

    if (!title || !description) {
      setAlertInfo({ type: 'danger', msg: 'Please provide both title and description.' });
      return;
    }

    setIsSubmitting(true);

    // Form data packaging for file uploads
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('priority', priority);
    formData.append('latitude', position[0]);
    formData.append('longitude', position[1]);
    formData.append('address', address);
    if (image) {
      formData.append('image', image);
    }

    try {
      const res = await API.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setAlertInfo({ type: 'success', msg: 'Complaint filed successfully! Redirecting...' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      setAlertInfo({
        type: 'danger',
        msg: error.response?.data?.message || 'Failed to submit complaint. Try again.'
      });
      setIsSubmitting(false);
    }
  };

  // Move map target to new position when coordinates update
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(position, mapRef.current.getZoom());
    }
  }, [position]);

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-outline-custom p-2" onClick={() => navigate('/dashboard')}>
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <div>
          <h2 className="mb-1 brand-font text-info">File a Complaint</h2>
          <p className="text-secondary small mb-0">Provide details, attach an image, and pin the issue location</p>
        </div>
      </div>

      {alertInfo.msg && (
        <div className={`alert alert-${alertInfo.type} border-0 bg-${alertInfo.type} bg-opacity-10 text-${alertInfo.type} rounded-3 p-3 mb-4`}>
          <i className="bi bi-info-circle-fill me-2"></i> {alertInfo.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left panel: Info Form */}
          <div className="col-lg-7">
            <div className="glass-card p-4 h-100">
              <h4 className="mb-4 text-secondary fs-5">Complaint Information</h4>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-medium">Complaint Title</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="Summarize the issue briefly..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-medium">Detailed Description</label>
                <textarea
                  className="form-control form-control-custom"
                  rows="6"
                  placeholder="Describe the complaint in detail, such as conditions, history, or hazard level..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-medium d-block">Priority Level</label>
                <div className="btn-group w-100" role="group">
                  {['Low', 'Medium', 'High'].map((p) => {
                    const isActive = priority === p;
                    let btnClass = 'btn btn-outline-custom';
                    if (isActive) {
                      if (p === 'Low') btnClass = 'btn btn-info';
                      if (p === 'Medium') btnClass = 'btn btn-warning';
                      if (p === 'High') btnClass = 'btn btn-danger';
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`${btnClass} py-3`}
                        onClick={() => setPriority(p)}
                      >
                        {p === 'Low' && <i className="bi bi-info-circle me-1"></i>}
                        {p === 'Medium' && <i className="bi bi-exclamation-circle me-1"></i>}
                        {p === 'High' && <i className="bi bi-lightning-charge me-1"></i>}
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Upload Block */}
              <div className="mb-2">
                <label className="form-label text-secondary small fw-medium">Attach Supporting Photo (Optional)</label>
                <div className="border border-secondary border-dashed rounded-3 p-4 text-center position-relative" style={{ borderStyle: 'dashed', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <input
                    type="file"
                    className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ cursor: 'pointer' }}
                  />
                  
                  {imagePreview ? (
                    <div className="position-relative d-inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="img-fluid rounded-3"
                        style={{ maxHeight: '180px', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <i className="bi bi-camera text-info fs-1"></i>
                      <p className="mt-2 mb-1 text-light small fw-medium">Click or Drag photo here to upload</p>
                      <span className="text-secondary small">Supports PNG, JPG, WEBP, GIF up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Map and Coordinates */}
          <div className="col-lg-5">
            <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="text-secondary fs-5 mb-0">Location Details</h4>
                  <button
                    type="button"
                    className="btn btn-outline-custom btn-sm py-2 px-3"
                    onClick={getUserLocation}
                    disabled={locLoading}
                  >
                    {locLoading ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    ) : (
                      <i className="bi bi-geo-alt me-1"></i>
                    )}
                    My Location
                  </button>
                </div>

                <div className="mb-3">
                  <div className="map-container mb-3" style={{ height: '280px' }}>
                    <MapContainer
                      center={position}
                      zoom={14}
                      style={{ height: '100%', width: '100%' }}
                      ref={mapRef}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={position} icon={customMarkerIcon} />
                      <MapClickHandler setPosition={setPosition} fetchAddress={fetchAddress} />
                    </MapContainer>
                  </div>
                  <span className="text-secondary small d-block mb-3">
                    <i className="bi bi-info-circle me-1"></i> Tap the map above to select the exact complaint coordinates
                  </span>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="text-secondary small fw-medium mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-custom py-2"
                      value={position[0]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setPosition([val, position[1]]);
                      }}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="text-secondary small fw-medium mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-custom py-2"
                      value={position[1]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setPosition([position[0], val]);
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-secondary small fw-medium mb-1">Resolved Address</label>
                  <textarea
                    className="form-control form-control-custom py-2"
                    rows="2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Selected address details..."
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-cyan w-100 py-3 mt-3 d-flex justify-content-center align-items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Filing Complaint...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-check"></i> Submit Complaint
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmitComplaint;
