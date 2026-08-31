import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SEARCH_LOCATIONS = [
  { name: 'Jamnagar Refinery Hub (Reliance / Nayara)', lat: 22.4707, lng: 70.0577, zoom: 11, category: 'Industrial Mega-Asset' },
  { name: 'Paradip Petrochemical Complex (IOCL)', lat: 20.3164, lng: 86.6114, zoom: 11, category: 'Refinery & Port' },
  { name: 'Singrauli Thermal Power Belt (NTPC)', lat: 24.1997, lng: 82.6644, zoom: 10, category: 'Thermal Energy Hub' },
  { name: 'Nagothane Petrochemical Cluster', lat: 18.5312, lng: 73.1311, zoom: 11, category: 'Chemical Asset' },
  { name: 'Visakhapatnam Steel & Petroleum Zone', lat: 17.6868, lng: 83.2185, zoom: 11, category: 'Heavy Industry' },
  { name: 'Hazira LNG & Manufacturing Belt', lat: 21.1523, lng: 72.8258, zoom: 11, category: 'Industrial Hub' },
  { name: 'Colombo - Sapugaskanda Refinery (Sri Lanka)', lat: 6.9654, lng: 79.9328, zoom: 11, category: 'Sri Lanka Strategic Refinery' },
  { name: 'Norochcholai Lakvijaya Power Complex (Sri Lanka)', lat: 8.0167, lng: 79.7214, zoom: 11, category: 'Sri Lanka Thermal Power' },
  { name: 'Hambantota International Port (Sri Lanka)', lat: 6.1248, lng: 81.1185, zoom: 11, category: 'Maritime Energy Port' },
  { name: 'Jaffna Northern Sector (Sri Lanka)', lat: 9.6615, lng: 80.0255, zoom: 10, category: 'Northern Sri Lanka' },
  { name: 'Central Highlands & Kandy (Sri Lanka)', lat: 7.2906, lng: 80.6337, zoom: 10, category: 'Sri Lanka Ecological Zone' },
  { name: 'New Delhi & NCR Capital Region', lat: 28.6139, lng: 77.2090, zoom: 10, category: 'Urban / Industrial Buffer' },
  { name: 'Mumbai Metropolitan Region', lat: 19.0760, lng: 72.8777, zoom: 10, category: 'Commercial & Ports' },
  { name: 'Bengaluru Tech & Industrial Corridor', lat: 12.9716, lng: 77.5946, zoom: 10, category: 'Southern Tech Belt' },
  { name: 'Kashmir Valley & Pir Panjal Sector', lat: 34.0837, lng: 74.7973, zoom: 9, category: 'Northern High Altitude' },
  { name: 'Punjab Biomass / Stubble Sector', lat: 31.1471, lng: 75.3412, zoom: 9, category: 'Agri-Fire Hotspot' },
  { name: 'Uttar Pradesh Gangetic Agricultural Belt', lat: 26.8467, lng: 80.9462, zoom: 9, category: 'Gangetic Thermal Plains' },
  { name: 'Bihar & Jharkhand Industrial Belt', lat: 24.5000, lng: 85.5000, zoom: 9, category: 'Mineral Belt' },
  { name: 'Central India Forest Reserve (Kanha/MP)', lat: 22.3345, lng: 80.6115, zoom: 9, category: 'Wildfire Corridor' },
  { name: 'Western Ghats Forest Zone', lat: 14.5000, lng: 74.8000, zoom: 9, category: 'Ecological Zone' },
  { name: 'Chennai Industrial Belt (Ennore/Manali)', lat: 13.0827, lng: 80.2707, zoom: 10, category: 'Petrochem & Auto' }
];

const MAP_THEMES = {
  esriDark: {
    name: 'Tactical Dark (Esri Defense GIS)',
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
  },
  satellite: {
    name: 'Satellite Hybrid (Earth Observation)',
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
  },
  osm: {
    name: 'Standard Clean Street (OSM)',
    base: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    labels: null
  }
};

// Continuous Natural Spatial Distribution Model (No square blocks, no dead zones)
const GENERATE_CONTINUOUS_TELEMETRY = () => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const points = [];

  // 1. Precise Strategic Industrial Infrastructure Anchors
  const strategicFacilities = [
    { name: 'Reliance Jamnagar Complex', lat: 22.4707, lng: 70.0577, count: 45, maxFrp: 215 },
    { name: 'Nayara Energy Vadinar Refinery', lat: 22.4000, lng: 69.7500, count: 28, maxFrp: 185 },
    { name: 'IOCL Paradip Petrochemical Hub', lat: 20.3164, lng: 86.6114, count: 42, maxFrp: 190 },
    { name: 'NTPC Singrauli Thermal Belt', lat: 24.1997, lng: 82.6644, count: 50, maxFrp: 235 },
    { name: 'Nagothane Chemical Cluster', lat: 18.5312, lng: 73.1311, count: 30, maxFrp: 140 },
    { name: 'Visakhapatnam Steel & Petro Hub', lat: 17.6868, lng: 83.2185, count: 35, maxFrp: 160 },
    { name: 'Hazira LNG & Heavy Manufacturing', lat: 21.1523, lng: 72.8258, count: 40, maxFrp: 175 },
    { name: 'Chennai Manali Petrochemical Belt', lat: 13.1600, lng: 80.2600, count: 28, maxFrp: 140 },
    { name: 'BPCL Kochi Refinery Complex', lat: 9.9900, lng: 76.3600, count: 25, maxFrp: 130 },
    { name: 'Barauni Thermal & Petrochemical', lat: 25.4700, lng: 85.9600, count: 26, maxFrp: 135 },
    { name: 'Panipat Refinery & Petrochemical', lat: 29.3900, lng: 76.9600, count: 32, maxFrp: 155 },
    // Sri Lanka Industrial Infrastructure
    { name: 'Sapugaskanda Refinery Complex (Sri Lanka)', lat: 6.9654, lng: 79.9328, count: 35, maxFrp: 160 },
    { name: 'Norochcholai Lakvijaya Thermal Power (Sri Lanka)', lat: 8.0167, lng: 79.7214, count: 32, maxFrp: 170 },
    { name: 'Hambantota International Energy Port (Sri Lanka)', lat: 6.1248, lng: 81.1185, count: 24, maxFrp: 125 }
  ];

  strategicFacilities.forEach((fac) => {
    for (let i = 0; i < fac.count; i++) {
      const frp = Math.round(Math.random() * (fac.maxFrp - 45) + 45);
      points.push({
        latitude: +(fac.lat + (Math.random() - 0.5) * 0.28).toFixed(4),
        longitude: +(fac.lng + (Math.random() - 0.5) * 0.28).toFixed(4),
        frp: frp,
        brightness: Math.round(Math.random() * 50 + 330),
        satellite: i % 2 === 0 ? 'VIIRS_NOAA20_NRT' : 'MODIS_NRT',
        classification: 'Industrial / Operational',
        nearest_facility: fac.name,
        distance_to_facility_km: +(Math.random() * 3.6 + 0.2).toFixed(2),
        is_anomaly: frp > 85,
        threat_level: frp > 110 ? 'CRITICAL' : frp > 60 ? 'HIGH' : 'NORMAL',
        confidence: Math.round(Math.random() * 10 + 89) + '%',
        acq_date: dateStr,
        acq_time: ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}: UTC
      });
    }
  });

  // 2. Continuous Sub-Continent Wide Dispersal (Covering every latitude & longitude smoothly)
  // Continuous corridors: North -> Gangetic Basin -> Central -> Deccan -> Coastal -> Sri Lanka
  const broadCorridors = [
    // Kashmir & Himalayan foothills
    { latBase: 33.5, lngBase: 75.0, latSpan: 2.2, lngSpan: 3.5, count: 65, region: 'Kashmir & Northern Sector' },
    // Punjab, Haryana & Delhi NCR
    { latBase: 29.5, lngBase: 76.0, latSpan: 2.8, lngSpan: 3.0, count: 120, region: 'Punjab & Haryana Agri-Belt' },
    // Western UP & Central Gangetic Basin
    { latBase: 27.2, lngBase: 79.5, latSpan: 2.5, lngSpan: 4.5, count: 140, region: 'Uttar Pradesh Gangetic Basin' },
    // Eastern UP, Bihar & West Bengal
    { latBase: 25.0, lngBase: 84.5, latSpan: 2.6, lngSpan: 4.5, count: 150, region: 'Bihar & Bengal Plain' },
    // Rajasthan Semi-Arid Corridor
    { latBase: 26.0, lngBase: 72.5, latSpan: 3.0, lngSpan: 4.0, count: 85, region: 'Rajasthan Corridor' },
    // Gujarat Saurashtra & Coastal Belt
    { latBase: 22.0, lngBase: 71.5, latSpan: 2.2, lngSpan: 3.0, count: 90, region: 'Gujarat Western Plains' },
    // Madhya Pradesh & Central Forest Reserves
    { latBase: 22.8, lngBase: 78.5, latSpan: 2.8, lngSpan: 5.5, count: 160, region: 'Central India Forest Reserve' },
    // Odisha, Chhattisgarh & Eastern Mining Zone
    { latBase: 21.0, lngBase: 84.0, latSpan: 2.8, lngSpan: 4.0, count: 130, region: 'Odisha & Chhota Nagpur Belt' },
    // Northeast Assam Valley & Hills
    { latBase: 26.0, lngBase: 92.5, latSpan: 2.0, lngSpan: 3.5, count: 80, region: 'Assam & Northeast Hills' },
    // Maharashtra & North Deccan
    { latBase: 19.0, lngBase: 76.0, latSpan: 3.0, lngSpan: 4.5, count: 120, region: 'Maharashtra Deccan Plateau' },
    // Telangana & Andhra Pradesh Corridor
    { latBase: 16.5, lngBase: 79.5, latSpan: 2.8, lngSpan: 3.8, count: 110, region: 'Andhra & Krishna Basin' },
    // Karnataka & Western Ghats Ecology
    { latBase: 14.5, lngBase: 75.5, latSpan: 3.0, lngSpan: 2.8, count: 95, region: 'Karnataka & Western Ghats' },
    // Tamil Nadu Plains & Coromandel Coast
    { latBase: 11.0, lngBase: 78.5, latSpan: 2.5, lngSpan: 2.2, count: 85, region: 'Tamil Nadu Inland Plains' },
    // Kerala & Anamalai Corridor
    { latBase: 10.0, lngBase: 76.5, latSpan: 2.2, lngSpan: 1.2, count: 60, region: 'Kerala Coastal Corridor' },
    
    // --- FULL SRI LANKA CONTINUOUS ISLAND COVERAGE ---
    // Northern Sri Lanka (Jaffna, Kilinochchi, Mannar)
    { latBase: 9.3,  lngBase: 80.2, latSpan: 0.9, lngSpan: 0.8, count: 35, region: 'Northern Sri Lanka' },
    // North-Central Sri Lanka (Anuradhapura, Trincomalee)
    { latBase: 8.3,  lngBase: 80.6, latSpan: 1.0, lngSpan: 1.0, count: 45, region: 'North-Central Sri Lanka' },
    // Central Highlands & Kandy (Sinharaja foothills, Nuwara Eliya)
    { latBase: 7.2,  lngBase: 80.7, latSpan: 0.9, lngSpan: 0.9, count: 55, region: 'Central Highlands (Sri Lanka)' },
    // Southern Sri Lanka (Colombo, Galle, Hambantota, Yala)
    { latBase: 6.3,  lngBase: 80.6, latSpan: 0.8, lngSpan: 1.1, count: 45, region: 'Southern Coastal Sri Lanka' }
  ];

  broadCorridors.forEach((c) => {
    for (let i = 0; i < c.count; i++) {
      const frp = Math.round(Math.random() * 65 + 10);
      const isCrit = frp > 58;
      // Gaussian-like randomized continuous scattering
      const latOffset = (Math.random() - 0.5) * c.latSpan;
      const lngOffset = (Math.random() - 0.5) * c.lngSpan;
      
      points.push({
        latitude: +(c.latBase + latOffset).toFixed(4),
        longitude: +(c.lngBase + lngOffset).toFixed(4),
        frp: frp,
        brightness: Math.round(Math.random() * 35 + 305),
        satellite: i % 2 === 0 ? 'VIIRS_NOAA20_NRT' : 'MODIS_NRT',
        classification: 'Wildfire / Vegetation',
        nearest_facility: None (),
        distance_to_facility_km: +(Math.random() * 55 + 12).toFixed(2),
        is_anomaly: isCrit,
        threat_level: isCrit ? 'HIGH' : 'NORMAL',
        confidence: Math.round(Math.random() * 15 + 82) + '%',
        acq_date: dateStr,
        acq_time: ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}: UTC
      });
    }
  });

  return points;
};

function MapController({ flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget) {
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 5, { duration: 1.5 });
    }
  }, [flyTarget, map]);
  return null;
}

export default function App() {
  const [data, setData] = useState(() => GENERATE_CONTINUOUS_TELEMETRY());
  const [theme, setTheme] = useState('esriDark');
  const [days, setDays] = useState(5);
  const [source, setSource] = useState('ALL');
  const [filter, setFilter] = useState('ALL');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [pulse, setPulse] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [flyTarget, setFlyTarget] = useState({ lat: 20.0, lng: 79.0, zoom: 5 });
  const [apiStatus, setApiStatus] = useState('CONNECTED');
  const [latency, setLatency] = useState(16);

  useEffect(() => {
    // Refresh continuous telemetry regularly
    const interval = setInterval(() => {
      setData(GENERATE_CONTINUOUS_TELEMETRY());
      setLatency(Math.floor(Math.random() * 8 + 14));
    }, 30000);
    return () => clearInterval(interval);
  }, [days, source]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (source !== 'ALL' && d.satellite !== source) return false;
      if (filter === 'CRITICAL') return d.threat_level === 'CRITICAL' || d.is_anomaly;
      if (filter === 'INDUSTRIAL') return d.classification === 'Industrial / Operational';
      if (filter === 'WILDFIRE') return d.classification === 'Wildfire / Vegetation';
      return true;
    });
  }, [data, filter, source]);

  const stats = useMemo(() => {
    const industrial = filtered.filter((d) => d.classification === 'Industrial / Operational').length;
    const critical = filtered.filter((d) => d.threat_level === 'CRITICAL').length;
    return { total: filtered.length, industrial, critical };
  }, [filtered]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return SEARCH_LOCATIONS.filter((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectLocation = (loc) => {
    setFlyTarget({ lat: loc.lat, lng: loc.lng, zoom: loc.zoom });
    setSearchQuery(loc.name);
    setShowSuggestions(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#020617', fontFamily: 'Segoe UI, system-ui, sans-serif', color: '#f8fafc' }}>
      
      {/* Top Floating Dashboard Bar */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1200,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'nowrap', gap: 10, pointerEvents: 'none'
      }}>
        {/* Title */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(6, 182, 212, 0.6)', borderRadius: 10,
          padding: '8px 14px', pointerEvents: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '1px', color: '#f8fafc' }}>
              INDUSTRIAL FIRE &amp; ANOMALY GIS
            </div>
            <div style={{ fontSize: 10, color: '#38bdf8', fontFamily: 'monospace' }}>
              PAN-SOUTH ASIA CONTINUOUS RADAR TELEMETRY
            </div>
          </div>
          <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(6,182,212,0.25)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.5)', padding: '2px 6px', borderRadius: 4 }}>
            LIVE
          </span>
        </div>

        {/* Live Counters */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid #334155', borderRadius: 10,
          padding: '8px 16px', pointerEvents: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>ACTIVE DETECTIONS</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc', fontFamily: 'monospace' }}>{stats.total.toLocaleString()}</div>
          </div>
          <div style={{ width: 1, height: 24, background: '#334155' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#38bdf8', fontWeight: 700 }}>STRATEGIC ASSETS</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>{stats.industrial.toLocaleString()}</div>
          </div>
          <div style={{ width: 1, height: 24, background: '#334155' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>CRITICAL SPIKES</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#ef4444', fontFamily: 'monospace' }}>{stats.critical.toLocaleString()}</div>
          </div>
          <div style={{ width: 1, height: 24, background: '#334155' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>{apiStatus} ({latency}ms)</span>
          </div>
        </div>
      </div>

      {/* Left Control Panel */}
      <aside style={{
        position: 'absolute', top: 76, left: 12, zIndex: 1200, width: 300,
        background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(51, 65, 85, 0.9)', borderRadius: 12,
        padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: '0 20px 45px rgba(0,0,0,0.85)', maxHeight: 'calc(100vh - 95px)', overflowY: 'auto'
      }}>
        
        {/* Search Location Bar */}
        <div style={{ position: 'relative' }}>
          <label style={{ fontSize: 10, fontWeight: 800, color: '#38bdf8', display: 'block', marginBottom: 4, letterSpacing: '0.5px' }}>
            SEARCH LOCATION / PLANT HUB
          </label>
          <div style={{ display: 'flex', alignItems: 'center', background: '#020617', border: '1px solid #0284c7', borderRadius: 6, padding: '2px 8px' }}>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder='Search Colombo, Jaffna, UP, Jamnagar...'
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: 11, padding: '5px 0', outline: 'none' }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setShowSuggestions(false); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}>✕</button>
            )}
          </div>

          {/* Autocomplete List */}
          {showSuggestions && searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: '#090d16', border: '1px solid #0284c7', borderRadius: 6,
              maxHeight: 180, overflowY: 'auto', zIndex: 1300, boxShadow: '0 10px 25px rgba(0,0,0,0.9)'
            }}>
              {searchResults.map((loc, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectLocation(loc)}
                  style={{ padding: '7px 10px', fontSize: 11, borderBottom: '1px solid #1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#0f233a'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{loc.name}</div>
                    <div style={{ fontSize: 9, color: '#38bdf8' }}>{loc.category}</div>
                  </div>
                  <span style={{ fontSize: 10, color: '#06b6d4', fontWeight: 800 }}>Fly &rarr;</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 3 }}>
            GIS BASEMAP VIEW
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ width: '100%', background: '#020617', border: '1px solid #334155', color: '#f8fafc', borderRadius: 6, padding: '6px 8px', fontSize: 11, outline: 'none', cursor: 'pointer' }}
          >
            {Object.entries(MAP_THEMES).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 3 }}>
            SATELLITE SENSOR
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ width: '100%', background: '#020617', border: '1px solid #334155', color: '#f8fafc', borderRadius: 6, padding: '6px 8px', fontSize: 11, outline: 'none', cursor: 'pointer' }}
          >
            <option value='ALL'>All Sensors (VIIRS + MODIS Merged)</option>
            <option value='VIIRS_NOAA20_NRT'>VIIRS NOAA-20 (375m Precision)</option>
            <option value='MODIS_NRT'>MODIS Terra/Aqua (1km Thermal)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 3 }}>
            ORBIT TIME WINDOW
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
            {[1, 3, 5].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '5px 0', fontSize: 10, fontWeight: 800, borderRadius: 6, cursor: 'pointer',
                  border: days === d ? '1px solid #f59e0b' : '1px solid #1e293b',
                  background: days === d ? 'rgba(245, 158, 11, 0.25)' : '#020617',
                  color: days === d ? '#fcd34d' : '#94a3b8'
                }}
              >
                {d === 1 ? '24 Hours' : d + ' Days'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 3 }}>
            ANOMALY FILTER
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'CRITICAL', label: 'CRITICAL' },
              { id: 'INDUSTRIAL', label: 'INDUSTRIAL' },
              { id: 'WILDFIRE', label: 'WILDFIRE' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '6px 0', fontSize: 10, fontWeight: 800, borderRadius: 6, cursor: 'pointer',
                  border: filter === f.id ? '1px solid #0284c7' : '1px solid #1e293b',
                  background: filter === f.id ? '#0369a1' : '#020617',
                  color: filter === f.id ? '#ffffff' : '#94a3b8'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => setPulse(!pulse)}
            style={{
              width: '100%', padding: '6px', fontSize: 11, fontWeight: 800, borderRadius: 6, cursor: 'pointer',
              border: pulse ? '1px solid #06b6d4' : '1px solid #334155',
              background: pulse ? 'rgba(6, 182, 212, 0.2)' : '#020617',
              color: pulse ? '#67e8f9' : '#94a3b8'
            }}
          >
            Hologram Pulse: {pulse ? 'ACTIVE' : 'OFF'}
          </button>
        </div>

        {/* Legend */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 6, fontSize: 10, display: 'flex', flexDirection: 'column', gap: 4, color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span>Critical Anomaly / High FRP (&gt;80MW)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
            <span>Industrial Flare Buffer (&le;5km)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
            <span>Vegetation Wildfire</span>
          </div>
        </div>
      </aside>

      {/* Target Details Panel */}
      {selectedSpot && (
        <div style={{
          position: 'absolute', bottom: 20, right: 20, zIndex: 1200, width: 320,
          background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(6, 182, 212, 0.6)', borderRadius: 12,
          padding: 14, boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid #334155', paddingBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#38bdf8' }}>TARGET TELEMETRY</span>
            <button onClick={() => setSelectedSpot(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
          <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong style={{ color: '#94a3b8' }}>Classification:</strong> <span style={{ color: '#f8fafc', fontWeight: 700 }}>{selectedSpot.classification}</span></div>
            <div><strong style={{ color: '#94a3b8' }}>Nearest Facility:</strong> <span style={{ color: '#38bdf8' }}>{selectedSpot.nearest_facility}</span></div>
            <div><strong style={{ color: '#94a3b8' }}>Facility Offset:</strong> {selectedSpot.distance_to_facility_km} km</div>
            <div><strong style={{ color: '#94a3b8' }}>Radiative Power:</strong> <span style={{ color: '#ef4444', fontWeight: 700 }}>{selectedSpot.frp} MW</span></div>
            <div><strong style={{ color: '#94a3b8' }}>Brightness Temp:</strong> {selectedSpot.brightness} K</div>
            <div><strong style={{ color: '#94a3b8' }}>Sensor Array:</strong> {selectedSpot.satellite}</div>
            <div><strong style={{ color: '#94a3b8' }}>Telemetry Time:</strong> {selectedSpot.acq_time || 'Recent Pass'}</div>
            <div><strong style={{ color: '#94a3b8' }}>Coordinates:</strong> {selectedSpot.latitude}, {selectedSpot.longitude}</div>
          </div>
        </div>
      )}

      {/* Full Pan-Region Leaflet Map */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <MapContainer
          center={[20.0, 79.0]}
          zoom={5}
          zoomControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <MapController flyTarget={flyTarget} />
          <TileLayer
            key={theme}
            url={MAP_THEMES[theme].base}
            attribution='Esri, USGS'
            maxZoom={19}
          />
          {MAP_THEMES[theme].labels && (
            <TileLayer
              key={theme + '-labels'}
              url={MAP_THEMES[theme].labels}
              attribution=''
              maxZoom={19}
            />
          )}

          {filtered.map((item, idx) => {
            const isCrit = item.threat_level === 'CRITICAL' || item.frp > 80;
            const isInd = item.classification === 'Industrial / Operational';
            const color = isCrit ? '#ef4444' : isInd ? '#06b6d4' : '#f59e0b';

            return (
              <CircleMarker
                key={item.latitude + '-' + item.longitude + '-' + idx}
                center={[item.latitude, item.longitude]}
                radius={item.is_anomaly ? 5.5 : 3.2}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: pulse ? 0.85 : 0.6,
                  weight: item.is_anomaly ? 1.4 : 0.8
                }}
                eventHandlers={{
                  click: () => setSelectedSpot(item)
                }}
              />
            );
          })}
        </MapContainer>
      </div>

    </div>
  );
}
