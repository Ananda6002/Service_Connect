import React, { useEffect, useRef } from 'react';
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

const DashboardMap = ({ providers, centerLat, centerLng, onBookProvider, onViewReviews }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Set default center (Delhi)
  const defaultCenter = [28.6139, 77.2090];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not already initialized
    const center = centerLat && centerLng ? [parseFloat(centerLat), parseFloat(centerLng)] : defaultCenter;

    const map = L.map(mapContainerRef.current).setView(center, 12);
    mapRef.current = map;

    // Add Tile Layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      // Option to match dark mode UI of ServiceConnect:
      // className: 'map-dark-tiles' (optional, but standard OSM tile looks great and is clear)
    }).addTo(map);

    // Create a layer group for markers so we can easily refresh them
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersLayerRef.current = null;
    };
  }, []);

  // Update map center and markers when providers or search center change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    // Clear old markers
    markersLayer.clearLayers();

    // Determine current search center
    const center = centerLat && centerLng ? [parseFloat(centerLat), parseFloat(centerLng)] : null;

    // Add marker for Client search center if active
    if (center) {
      // Custom green marker icon for Client/User location
      const clientIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      L.marker(center, { icon: clientIcon })
        .addTo(markersLayer)
        .bindPopup(`
          <div style="font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #111;">
            <strong style="color: #2e7d32;"><i className="bi bi-person-fill"></i> Your Search Location</strong>
            <p style="margin: 4px 0 0 0; font-size: 0.75rem; color: #555;">Providers sorted relative to this coordinate</p>
          </div>
        `);

      map.setView(center, 12);
    }

    // Add markers for all providers that have coordinates
    const bounds = [];
    if (center) bounds.push(center);

    providers.forEach(provider => {
      if (provider.latitude && provider.longitude) {
        const providerCoords = [provider.latitude, provider.longitude];
        bounds.push(providerCoords);

        // Custom gold/yellow/blue marker for providers
        // Let's use red marker for Plumber, blue for Electrician, gold for general etc or standard Leaflet marker.
        const providerMarker = L.marker(providerCoords).addTo(markersLayer);

        // Define HTML string for popup
        const reviewsCount = provider.numReviews || 0;
        const ratingStr = provider.averageRating ? `★ ${provider.averageRating.toFixed(1)}` : '★ New';
        const skillsStr = provider.skills && provider.skills.length > 0 ? provider.skills[0] : 'General Service';

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = "'Inter', sans-serif";
        popupContent.style.fontSize = '0.8rem';
        popupContent.style.color = '#111';
        popupContent.style.minWidth = '180px';

        popupContent.innerHTML = `
          <div style="margin-bottom: 6px;">
            <strong style="font-size: 0.85rem; color: #0dcaf0;">${provider.name}</strong>
            <span style="float: right; font-weight: bold; color: #ffc107;">${ratingStr}</span>
          </div>
          <div style="font-size: 0.75rem; color: #555; margin-bottom: 4px;">
            <strong>Category:</strong> ${skillsStr}
          </div>
          <div style="font-size: 0.75rem; color: #555; margin-bottom: 10px;">
            <strong>Rate:</strong> ₹${provider.hourlyRate}/hr
            ${provider.distance !== undefined && provider.distance !== null ? `<br><strong>Distance:</strong> ${provider.distance} km away` : ''}
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-start; margin-top: 6px;">
            <button id="btn-popup-book-${provider._id}" style="border: 0; background: #00f0ff; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.7rem; cursor: pointer;">
              Book Now
            </button>
            <button id="btn-popup-reviews-${provider._id}" style="border: 1px solid #ccc; background: #fff; color: #333; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">
              Reviews
            </button>
          </div>
        `;

        // Listen for clicks inside the popup (since Leaflet popups render dynamically in the DOM)
        providerMarker.bindPopup(popupContent);

        providerMarker.on('popupopen', () => {
          const bookBtn = document.getElementById(`btn-popup-book-${provider._id}`);
          const reviewsBtn = document.getElementById(`btn-popup-reviews-${provider._id}`);

          if (bookBtn) {
            bookBtn.onclick = () => {
              onBookProvider(provider);
              providerMarker.closePopup();
            };
          }
          if (reviewsBtn) {
            reviewsBtn.onclick = () => {
              onViewReviews(provider);
              providerMarker.closePopup();
            };
          }
        });
      }
    });

    // Fit map bounds to show all markers if there are multiple
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

  }, [providers, centerLat, centerLng]);

  return (
    <div className="card glass-card border border-secondary border-opacity-25 p-3 mb-4 shadow animate-fade-in">
      <h5 className="brand-font text-info mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-map"></i> Service Provider Map Directory
      </h5>
      <div 
        ref={mapContainerRef} 
        className="rounded-3 border border-secondary border-opacity-20 shadow"
        style={{ height: '350px', width: '100%', zIndex: 1 }}
      />
      <div className="d-flex justify-content-between align-items-center mt-2 small text-secondary">
        <span><span className="badge rounded-circle p-1 bg-success me-1" style={{ width: '8px', height: '8px', display: 'inline-block' }} /> Green pin = Pinned Search Origin</span>
        <span><span className="badge rounded-circle p-1 bg-primary me-1" style={{ width: '8px', height: '8px', display: 'inline-block' }} /> Blue pin = Available Provider</span>
      </div>
    </div>
  );
};

export default DashboardMap;
