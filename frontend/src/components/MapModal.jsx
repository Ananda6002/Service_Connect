import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Vite asset compilation issues for Leaflet default markers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapModal = ({ show, onClose, onConfirm, initialLat, initialLng, initialCity }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat: null, lng: null });
  const [selectedAddress, setSelectedAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Default coordinate center (fallback to Delhi if nothing selected)
  const defaultCenter = [28.6139, 77.2090];

  // City-to-coordinates dictionary for quick default centering
  const cityCoords = {
    'Delhi': [28.6139, 77.2090],
    'Mumbai': [19.0760, 72.8777],
    'Bangalore': [12.9716, 77.5946],
    'Hyderabad': [17.3850, 78.4867],
    'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639],
    'Pune': [18.5204, 73.8567],
    'Ahmedabad': [23.0225, 72.5714],
    'Jaipur': [26.9124, 75.7873],
    'Surat': [21.1702, 72.8311]
  };

  useEffect(() => {
    if (!show) return;

    // Determine initial center
    let center = defaultCenter;
    if (initialLat && initialLng) {
      center = [parseFloat(initialLat), parseFloat(initialLng)];
    } else if (initialCity && cityCoords[initialCity]) {
      center = cityCoords[initialCity];
    }

    // Set initial coordinates state
    setSelectedCoords({ lat: center[0], lng: center[1] });
    setSelectedAddress(initialCity || 'Delhi');

    // Timeout to ensure DOM has rendered container before mounting Leaflet
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Initialize Map
      const map = L.map(mapContainerRef.current).setView(center, 13);
      mapRef.current = map;

      // Add Tile Layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add draggable Marker
      const marker = L.marker(center, { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Handle marker drag end
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setSelectedCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      // Handle map click
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setSelectedCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      // Trigger standard reverse geocoding on initial mount if coords exist
      if (initialLat && initialLng) {
        reverseGeocode(initialLat, initialLng);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [show]);

  // Reverse geocoding helper (OSM Nominatim API)
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setSelectedAddress(data.display_name);
      } else {
        setSelectedAddress(`Pinned at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setSelectedAddress(`Pinned at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  // Address search helper (OSM Nominatim Search API)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setGeocoding(true);
      setErrorMsg('');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newCoords = [parseFloat(lat), parseFloat(lon)];

        setSelectedCoords({ lat: newCoords[0], lng: newCoords[1] });
        setSelectedAddress(display_name);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView(newCoords, 14);
          markerRef.current.setLatLng(newCoords);
        }
      } else {
        setErrorMsg('Location not found. Please try a different search.');
      }
    } catch (error) {
      console.error('Geocoding search error:', error);
      setErrorMsg('Failed to fetch location search.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: selectedCoords.lat,
      longitude: selectedCoords.lng,
      address: selectedAddress
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content glass-card border border-secondary border-opacity-25" style={{ background: 'rgba(25, 28, 36, 0.95)', overflow: 'hidden' }}>
          
          <div className="modal-header border-bottom border-secondary border-opacity-20 py-3 d-flex justify-content-between align-items-center">
            <h5 className="modal-title brand-font text-info d-flex align-items-center gap-2">
              <i className="bi bi-map-fill"></i> Pin Location on Map
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-3 d-flex gap-2">
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="Search address (e.g. 1600 Amphitheatre Pkwy, Mountain View)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-cyan px-4" disabled={geocoding}>
                {geocoding ? 'Searching...' : 'Search'}
              </button>
            </form>

            {errorMsg && (
              <div className="alert alert-warning border-0 bg-warning bg-opacity-10 text-warning py-2 small" role="alert">
                <i className="bi bi-exclamation-circle me-1"></i> {errorMsg}
              </div>
            )}

            {/* Map Container */}
            <div 
              ref={mapContainerRef} 
              className="rounded-3 border border-secondary border-opacity-20 shadow" 
              style={{ height: '350px', width: '100%', zIndex: 1 }}
            />

            {/* Selected Info display */}
            <div className="mt-3 bg-dark bg-opacity-30 border border-secondary border-opacity-10 rounded-3 p-3 text-secondary small">
              <div className="mb-2">
                <strong className="text-light">Current Position:</strong>{' '}
                <span className="text-info font-monospace">
                  {selectedCoords.lat ? selectedCoords.lat.toFixed(6) : 'N/A'},{' '}
                  {selectedCoords.lng ? selectedCoords.lng.toFixed(6) : 'N/A'}
                </span>
              </div>
              <div className="mb-0 text-wrap text-break text-light">
                <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                {selectedAddress || 'Click map or search to pick a location'}
              </div>
            </div>
          </div>

          <div className="modal-footer border-top border-secondary border-opacity-20 py-3">
            <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-info px-4 py-2 text-white" 
              onClick={handleConfirm}
              disabled={!selectedCoords.lat || !selectedCoords.lng}
            >
              Confirm Location
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MapModal;
