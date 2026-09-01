import React, { useState, useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// 1. CONFIGURATION & MOCK REGISTRY DATA
// ==========================================
const INITIAL_CENTER = [22.7, 78.9];
const INITIAL_ZOOM = 5;
const BUFFER_RADIUS_KM = 5;

// Mock Indian Facilities Registry (196 Strategic + Extended National Units)
const MOCK_FACILITIES = Array.from({ length: 300 }, (_, i) => ({
  id: i,
  name: i < 196 
    ? `Tier-1 Strategic Asset ${i + 1} (${['Oil Refinery', 'Thermal Power Hub', 'Petrochemical Complex', 'LNG Terminal'][i % 4]})`
    : `CPCB Industrial Unit ${i + 1}`,
  lat: 22.7 + (Math.random() - 0.5) * 14,
  lng: 78.9 + (Math.random() - 0.5) * 18,
  priority: i < 196 ? 'Tier-1' : 'Standard',
  region: ['Gujarat Industrial Corridor', 'Maharashtra Deccan', 'Northern Plains', 'Eastern Thermal Belt'][i % 4],
  buffer_km: 5
}));

// Mock Satellite Hotspots with Varied FRP for Classification Demo
const MOCK_HOTSPOTS = [
  { id: 101, lat: 21.15, lng: 79.09, frp: 185.4, brightness: 345.1, satellite: 'VIIRS', region: 'Central Industrial Corridor', facility_name: 'Western Energy Refinery' },
  { id: 102, lat: 17.8859, lng: 74.137, frp: 73.0, brightness: 334.2, satellite: 'MODIS', region: 'Maharashtra Deccan', facility_name: null }, // Dense Forest (>= 60 MW)
  { id: 103, lat: 30.3165, lng: 75.987, frp: 38.5, brightness: 312.4, satellite: 'VIIRS', region: 'Northern Plains (Punjab)', facility_name: null }, // Agricultural (< 60 MW)
  { id: 104, lat: 23.6102, lng: 85.2799, frp: 92.0, brightness: 338.0, satellite: 'VIIRS', region: 'Eastern Thermal Belt', facility_name: null }  // Dense Forest (>= 60 MW)
];

// ==========================================
// 2. HELPER FUNCTIONS & CUSTOM MARKERS
// ==========================================
const getDistanceKm = (c1, c2) => {
  const R = 6371;
  const dLat = (c2[0] - c1[0]) * (Math.PI / 180);
  const dLon = (c2[1] - c1[1]) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(c1[0] * (Math.PI / 180)) * Math.cos(c2[0] * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Facility Marker Icon
const facilityIcon = L.divIcon({
  className: 'custom-facility-icon',
  html: '<div style="background-color: #1E3A8A; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.6);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Dynamic Hotspot Marker Icon
const getHotspotIcon = (color) => L.divIcon({
  className: 'custom-hotspot-icon',
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 0 12px ${color};"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// ==========================================
// 3. GEOFENCING CORRELATION WORKER
// ==========================================
const GeofencingAnalysisWorker = ({ facilities, hotspots }) => {
  const map = useMap();

  useEffect(() => {
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    hotspots.forEach((hotspot) => {
      const hCoords = [hotspot.lat, hotspot.lng];
      let nearestAsset = null;
      let minDist = 9999;

      facilities.forEach((facility) => {
        const dist = getDistanceKm(hCoords, [facility.lat, facility.lng]);
        if (dist <= facility.buffer_km && dist < minDist) {
          minDist = dist;
          nearestAsset = facility;
        }
      });

      if (nearestAsset) {
        const isAnomaly = hotspot.frp > 80.0;
        L.polyline([hCoords, [nearestAsset.lat, nearestAsset.lng]], {
          color: isAnomaly ? '#DC2626' : '#F59E0B',
          weight: isAnomaly ? 2.5 : 1.5,
          dashArray: isAnomaly ? '8, 8' : '3, 4',
          opacity: 0.85
        }).addTo(map);

        if (isAnomaly) {
          L.circle(hCoords, { radius: 1500, color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.15, weight: 1.5 }).addTo(map);
        }
      }
    });
  }, [map, facilities, hotspots]);

  return null;
};

// ==========================================
// 4. MAIN DASHBOARD COMPONENT
// ==========================================
const App = () => {
  const [facilities] = useState(MOCK_FACILITIES);
  const [hotspots] = useState(MOCK_HOTSPOTS);
  const [coverageScope, setCoverageScope] = useState('tier1');

  // Dynamic Scope Switcher Logic
  const activeRegistry = useMemo(() => {
    if (!facilities) return [];
    if (coverageScope === 'tier1') {
      return facilities.filter((f) => f.priority === 'Tier-1');
    }
    return facilities;
  }, [coverageScope, facilities]);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Header Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(51, 65, 85, 0.8)',
        padding: '12px 20px',
        borderRadius: '12px',
        color: '#FFFFFF',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
      }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
          National Industrial Fire Defense Prototype
        </div>
        <div style={{ fontSize: '19px', fontWeight: '800', color: '#FFFFFF' }}>
          AEROSAT-GIS <span style={{ color: '#60A5FA', fontSize: '12px' }}>Satellite Telemetry Console</span>
        </div>
      </div>

      {/* Coverage Scope Toggle */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(51, 65, 85, 0.9)',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        color: '#FFFFFF'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
          Asset Coverage Scope
        </div>

        <div style={{ display: 'flex', gap: '6px', background: '#020617', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setCoverageScope('tier1')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: coverageScope === 'tier1' ? '#F59E0B' : 'transparent',
              color: coverageScope === 'tier1' ? '#0F172A' : '#94A3B8',
              transition: 'all 0.2s ease'
            }}
          >
            🛡️ Strategic 196
          </button>

          <button
            onClick={() => setCoverageScope('all')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: coverageScope === 'all' ? '#2563EB' : 'transparent',
              color: coverageScope === 'all' ? '#FFFFFF' : '#94A3B8',
              transition: 'all 0.2s ease'
            }}
          >
            🌐 All National (196+)
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', borderTop: '1px solid #334155', paddingTop: '8px' }}>
          <span style={{ color: '#94A3B8' }}>Tracked Units:</span>
          <span style={{ fontWeight: '800', color: coverageScope === 'tier1' ? '#FBBF24' : '#60A5FA' }}>
            {coverageScope === 'tier1' ? '196 Tier-1 Units' : `${activeRegistry.length} National Units`}
          </span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer center={INITIAL_CENTER} zoom={INITIAL_ZOOM} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />

        <GeofencingAnalysisWorker facilities={activeRegistry} hotspots={hotspots} />

        {/* Industrial Facilities Layer */}
        {activeRegistry.map((facility) => (
          <Marker key={facility.id} position={[facility.lat, facility.lng]} icon={facilityIcon}>
            <Popup>
              <div style={{ color: '#0F172A' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E3A8A' }}>{facility.name}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                  Region: {facility.region} | Priority: <strong>{facility.priority}</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                  Buffer Protection: {facility.buffer_km}km
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Satellite Fire Hotspots Layer with Strict Classifier */}
        {hotspots.map((hotspot) => {
          const isIndustrial = hotspot.facility_name && hotspot.facility_name !== 'None' && hotspot.facility_name !== null;
          
          let displayTitle = '';
          let displayType = '';
          let badgeColor = '#DC2626';

          if (isIndustrial) {
            displayTitle = `${hotspot.facility_name} (${hotspot.region || 'Industrial Zone'})`;
            displayType = 'Industrial Thermal Flare / Anomaly';
            badgeColor = '#DC2626';
          } else if (Number(hotspot.frp) >= 60) {
            displayTitle = `Wildfire Event (${hotspot.region || 'Forest Reserve'})`;
            displayType = 'Dense Forest / Wildfire';
            badgeColor = '#EA580C';
          } else {
            displayTitle = `Agricultural Stubble Fire (${hotspot.region || 'Rural Plain'})`;
            displayType = 'Crop Residue / Rural Burning';
            badgeColor = '#D97706';
          }

          return (
            <Marker 
              key={hotspot.id || `${hotspot.lat}-${hotspot.lng}`} 
              position={[hotspot.lat, hotspot.lng]} 
              icon={getHotspotIcon(badgeColor)}
            >
              <Popup>
                <div style={{ color: '#0F172A', minWidth: '180px', fontFamily: 'sans-serif' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#0F172A' }}>
                    {displayTitle}
                  </div>
                  <div style={{ fontSize: '12px', margin: '2px 0', color: '#334155' }}>
                    FRP: <strong style={{ color: '#B91C1C' }}>{hotspot.frp} MW</strong>
                  </div>
                  <div style={{ fontSize: '12px', margin: '2px 0', color: '#334155' }}>
                    Type: <span style={{ fontWeight: 'bold', color: badgeColor }}>{displayType}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    Coordinates: {Number(hotspot.lat).toFixed(4)}, {Number(hotspot.lng).toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default App;