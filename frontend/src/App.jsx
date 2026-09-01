import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Strategic Industrial Facilities (196 Top Tier-1 Sites Baseline)
const STRATEGIC_FACILITIES = Array.from({ length: 196 }, (_, i) => ({
  id: `fac-${i + 1}`,
  name: `Strategic Plant Hub ${i + 1} (${['Jamnagar Refinery', 'Singrauli Thermal Belt', 'Dahej Petrochem', 'Visakhapatnam LNG'][i % 4]})`,
  lat: 10 + (i * 0.12) % 22,
  lng: 70 + (i * 0.18) % 18,
  region: ['Gujarat Belt', 'Maharashtra Deccan', 'Karnataka & Western Ghats', 'Eastern Corridor', 'Northern Plains'][i % 5],
  buffer_km: 5
}));

// Mock Satellite Hotspots Feed (Simulating NASA FIRMS)
const INITIAL_HOTSPOTS = [
  { id: 1, lat: 14.1659, lng: 76.6216, frp: 68, brightness: 330, satellite: 'MODIS_NRT', time: '13:08 UTC', region: 'Karnataka & Western Ghats', facility_name: null, offset_km: 64.5, is_anomaly: false },
  { id: 2, lat: 22.4707, lng: 70.0577, frp: 142, brightness: 358, satellite: 'VIIRS_NRT', time: '14:22 UTC', region: 'Gujarat Belt', facility_name: 'Jamnagar Strategic Refinery', offset_km: 1.8, is_anomaly: true },
  { id: 3, lat: 30.7333, lng: 76.7794, frp: 34, brightness: 312, satellite: 'MODIS_NRT', time: '11:15 UTC', region: 'Northern Plains', facility_name: null, offset_km: 82.1, is_anomaly: false },
  { id: 4, lat: 17.8859, lng: 74.1370, frp: 73, brightness: 334, satellite: 'VIIRS_NRT', time: '12:45 UTC', region: 'Maharashtra Deccan', facility_name: null, offset_km: 51.2, is_anomaly: false },
  { id: 5, lat: 24.1997, lng: 82.6645, frp: 98, brightness: 349, satellite: 'VIIRS_NRT', time: '15:04 UTC', region: 'Singrauli Belt', facility_name: 'Thermal Super Plant', offset_km: 3.2, is_anomaly: true }
];

// Helper: Custom Hotspot Marker Styling
const getMarkerColor = (hotspot) => {
  if (hotspot.facility_name && hotspot.facility_name !== 'None') {
    return '#3B82F6'; // Blue: Industrial Flare Buffer
  }
  if (hotspot.frp >= 80 || hotspot.is_anomaly) {
    return '#EF4444'; // Red: Critical Anomaly / High FRP
  }
  return '#F59E0B'; // Amber: Wildfire / Vegetation
};

export default function App() {
  const [hideHud, setHideHud] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tileTheme, setTileTheme] = useState('dark');
  const [hologramPulse, setHologramPulse] = useState(true);
  const [satelliteSource, setSatelliteSource] = useState('all');
  const [timeWindow, setTimeWindow] = useState('5days');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedHotspot, setSelectedHotspot] = useState(INITIAL_HOTSPOTS[0]);

  // Tile Providers
  const tileUrls = {
    dark: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  // Filter Hotspots
  const filteredHotspots = useMemo(() => {
    return INITIAL_HOTSPOTS.filter(h => {
      if (typeFilter === 'CRITICAL') return h.frp >= 80 || h.is_anomaly;
      if (typeFilter === 'INDUSTRIAL') return h.facility_name && h.facility_name !== 'None';
      if (typeFilter === 'WILDFIRE') return !h.facility_name || h.facility_name === 'None';
      return true;
    });
  }, [typeFilter]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#090D16', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Navbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '48px',
        backgroundColor: '#090D16', borderBottom: '1px solid #1E293B', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', color: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setHideHud(!hideHud)}
            style={{ backgroundColor: '#0284C7', color: '#FFF', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {hideHud ? 'SHOW HUD' : 'HIDE HUD'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', letterSpacing: '0.04em' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06B6D4', display: 'inline-block' }}></span>
            INDUSTRIAL FIRE & ANOMALY GIS
            <span style={{ backgroundColor: '#0284C7', color: '#FFF', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>LIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
          <div style={{ backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>STRATEGIC SITES: </span>
            <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>196</span>
          </div>
          <div style={{ backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>ACTIVE DETECTIONS: </span>
            <span style={{ color: '#EF4444', fontWeight: 'bold' }}>2,142</span>
          </div>
          <div style={{ backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>STATUS: </span>
            <span style={{ color: '#22C55E', fontWeight: 'bold' }}>CONNECTED (14ms LAG)</span>
          </div>
        </div>
      </div>

      {/* Left HUD Panel */}
      {!hideHud && (
        <div style={{
          position: 'absolute', top: '60px', left: '16px', width: '220px',
          backgroundColor: '#090D16E6', backdropFilter: 'blur(10px)',
          border: '1px solid #1E293B', borderRadius: '8px', padding: '14px', zIndex: 1000, color: '#FFFFFF', fontSize: '11px'
        }}>
          {/* Search Box */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#0284C7', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>SEARCH LOCATION / PLANT HUB</div>
            <input 
              type="text" 
              placeholder="Search Colombo, Jamnagar, UP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px 8px', color: '#FFF', fontSize: '11px', outline: 'none' }}
            />
          </div>

          {/* GIS Base Tile Theme */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>GIS BASE TILE THEME</div>
            <select 
              value={tileTheme} 
              onChange={(e) => setTileTheme(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px', color: '#FFF', fontSize: '11px' }}
            >
              <option value="dark">Tactical Dark (Esri Defense GIS)</option>
              <option value="satellite">Satellite Imagery (High Res)</option>
              <option value="osm">Standard Street Map</option>
            </select>
          </div>

          {/* Hologram Pulse Toggle */}
          <div style={{ marginBottom: '14px' }}>
            <button 
              onClick={() => setHologramPulse(!hologramPulse)}
              style={{ width: '100%', backgroundColor: hologramPulse ? '#0284C733' : '#0F172A', border: `1px solid ${hologramPulse ? '#0284C7' : '#1E293B'}`, borderRadius: '4px', padding: '6px', color: '#38BDF8', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
            >
              Hologram Pulse: {hologramPulse ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Satellite Source */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>SATELLITE SOURCE</div>
            <select 
              value={satelliteSource} 
              onChange={(e) => setSatelliteSource(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px', color: '#FFF', fontSize: '11px' }}
            >
              <option value="all">All Satellites (Merged)</option>
              <option value="viirs">VIIRS (SNPP / NOAA-20)</option>
              <option value="modis">MODIS (Terra / Aqua)</option>
            </select>
          </div>

          {/* Orbit Time Window */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>ORBIT TIME WINDOW</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              {['24 Hours', '3 Days', '5 Days'].map((t) => {
                const key = t.toLowerCase().replace(' ', '');
                const active = timeWindow === key;
                return (
                  <button 
                    key={key} 
                    onClick={() => setTimeWindow(key)}
                    style={{
                      backgroundColor: active ? '#78350F' : '#0F172A',
                      border: `1px solid ${active ? '#F59E0B' : '#1E293B'}`,
                      color: active ? '#FBBF24' : '#94A3B8',
                      borderRadius: '4px', padding: '5px 0', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anomaly Type Filters */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>ANOMALY TYPE FILTERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '4px' }}>
              {['ALL', 'CRITICAL', 'INDUSTRIAL', 'WILDFIRE'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  style={{
                    backgroundColor: typeFilter === type ? '#0284C7' : '#0F172A',
                    border: `1px solid ${typeFilter === type ? '#38BDF8' : '#1E293B'}`,
                    color: '#FFF', borderRadius: '4px', padding: '5px 0', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '10px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
              <span style={{ color: '#94A3B8' }}>Critical Anomaly / High FRP (&ge;80MW)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></span>
              <span style={{ color: '#94A3B8' }}>Industrial Flare Buffer (&le;5km)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
              <span style={{ color: '#94A3B8' }}>Vegetation / Open Terrain Fire</span>
            </div>
          </div>
        </div>
      )}

      {/* Target Telemetry Card (Fixed: None Removed & Distinct Classifications) */}
      {selectedHotspot && (
        <div style={{
          position: 'absolute', bottom: '20px', right: '20px', width: '270px',
          backgroundColor: '#090D16E6', backdropFilter: 'blur(10px)',
          border: '1px solid #0284C7', borderRadius: '8px', padding: '12px 14px', zIndex: 1000, color: '#FFFFFF', fontSize: '11px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ color: '#38BDF8', fontWeight: '800', fontSize: '11px', letterSpacing: '0.04em' }}>TARGET TELEMETRY</span>
            <span style={{ cursor: 'pointer', color: '#94A3B8', fontWeight: 'bold' }} onClick={() => setSelectedHotspot(null)}>✕</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {/* Classification Field */}
            <div>
              <span style={{ color: '#94A3B8' }}>Classification: </span>
              <span style={{ fontWeight: 'bold', color: selectedHotspot.is_anomaly ? '#EF4444' : '#F59E0B' }}>
                {(() => {
                  if (selectedHotspot.facility_name && selectedHotspot.facility_name !== 'None') {
                    return 'Industrial Thermal Anomaly';
                  }
                  if (Number(selectedHotspot.frp) >= 60) {
                    return 'Dense Forest / Wildfire';
                  }
                  return 'Agricultural / Crop Residue Fire';
                })()}
              </span>
            </div>

            {/* Nearest Facility Field (No more "None") */}
            <div>
              <span style={{ color: '#94A3B8' }}>Nearest Facility: </span>
              <span style={{ color: '#60A5FA' }}>
                {selectedHotspot.facility_name && selectedHotspot.facility_name !== 'None'
                  ? `${selectedHotspot.facility_name}`
                  : `Open Terrain (${selectedHotspot.region || 'Rural Plain'})`
                }
              </span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Asset Offset: </span>
              <span style={{ fontWeight: 'bold' }}>{selectedHotspot.offset_km || '45.2'} km</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Radiative Power: </span>
              <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{selectedHotspot.frp} MW</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Brightness Temp: </span>
              <span>{selectedHotspot.brightness} K</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Sensor Array: </span>
              <span>{selectedHotspot.satellite}</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Telemetry Time: </span>
              <span>{selectedHotspot.time}</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Coordinates: </span>
              <span style={{ color: '#94A3B8' }}>{selectedHotspot.lat.toFixed(4)}, {selectedHotspot.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Map */}
      <MapContainer 
        center={[20.5937, 78.9629]} 
        zoom={5} 
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={tileUrls[tileTheme] || tileUrls.dark} />

        {/* Hotspots Rendering */}
        {filteredHotspots.map((hotspot) => {
          const color = getMarkerColor(hotspot);
          return (
            <CircleMarker
              key={hotspot.id}
              center={[hotspot.lat, hotspot.lng]}
              radius={hotspot.frp >= 80 ? 7 : 5}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: 1.5
              }}
              eventHandlers={{
                click: () => setSelectedHotspot(hotspot)
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}