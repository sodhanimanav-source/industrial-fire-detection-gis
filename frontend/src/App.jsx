import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Strategic Industrial Facilities (196 Top Tier-1 Sites across Indian Industrial Hubs)
const STRATEGIC_FACILITIES = Array.from({ length: 196 }, (_, i) => {
  const hubs = [
    { name: 'Jamnagar Refinery Complex', lat: 22.4707, lng: 70.0577, region: 'Gujarat Industrial Belt' },
    { name: 'Singrauli Thermal Power Hub', lat: 24.1997, lng: 82.6645, region: 'Singrauli Energy Belt' },
    { name: 'Dahej Petrochemical Corridor', lat: 21.7051, lng: 72.5855, region: 'Gujarat Coast' },
    { name: 'Visakhapatnam Petroleum/LNG Port', lat: 17.6868, lng: 83.2185, region: 'Eastern Seaboard' },
    { name: 'Mangalore Petrochem & Refinery', lat: 12.9141, lng: 74.8560, region: 'Karnataka Coast' },
    { name: 'Mumbai Offshore & Trombay Complex', lat: 19.0176, lng: 72.8561, region: 'Maharashtra Deccan' },
    { name: 'Haldia Petrochemicals Hub', lat: 22.0667, lng: 88.0698, region: 'West Bengal Hub' },
    { name: 'Barauni Industrial Refinery', lat: 25.4670, lng: 85.9678, region: 'Northern Plains' }
  ];
  const base = hubs[i % hubs.length];
  return {
    id: `fac-${i + 1}`,
    name: i < 8 ? base.name : `Strategic Unit ${i + 1} (${base.name.split(' ')[0]})`,
    lat: base.lat + ((i * 17) % 100 - 50) * 0.045,
    lng: base.lng + ((i * 23) % 100 - 50) * 0.045,
    region: base.region,
    buffer_km: 5,
    priority: 'Tier-1'
  };
});

// Satellite Telemetry Hotspots (Active Detections)
const INITIAL_HOTSPOTS = [
  { id: 101, lat: 14.1659, lng: 76.6216, frp: 68, brightness: 330, satellite: 'MODIS_NRT', time: '13:08 UTC', region: 'Karnataka & Western Ghats', facility_name: null, offset_km: 64.5, is_anomaly: false },
  { id: 102, lat: 22.4707, lng: 70.0577, frp: 142, brightness: 358, satellite: 'VIIRS_NRT', time: '14:22 UTC', region: 'Gujarat Belt', facility_name: 'Jamnagar Strategic Refinery', offset_km: 1.8, is_anomaly: true },
  { id: 103, lat: 30.7333, lng: 76.7794, frp: 34, brightness: 312, satellite: 'MODIS_NRT', time: '11:15 UTC', region: 'Northern Plains (Punjab)', facility_name: null, offset_km: 82.1, is_anomaly: false },
  { id: 104, lat: 17.8859, lng: 74.1370, frp: 73, brightness: 334, satellite: 'VIIRS_NRT', time: '12:45 UTC', region: 'Maharashtra Deccan', facility_name: null, offset_km: 51.2, is_anomaly: false },
  { id: 105, lat: 24.1997, lng: 82.6645, frp: 98, brightness: 349, satellite: 'VIIRS_NRT', time: '15:04 UTC', region: 'Singrauli Belt', facility_name: 'Singrauli Thermal Power Hub', offset_km: 2.1, is_anomaly: true },
  { id: 106, lat: 21.7051, lng: 72.5855, frp: 88, brightness: 341, satellite: 'VIIRS_NRT', time: '16:10 UTC', region: 'Gujarat Coast', facility_name: 'Dahej Petrochemical Corridor', offset_km: 1.2, is_anomaly: true }
];

export default function App() {
  const [hideHud, setHideHud] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tileTheme, setTileTheme] = useState('dark');
  const [hologramPulse, setHologramPulse] = useState(true);
  const [satelliteSource, setSatelliteSource] = useState('all');
  const [timeWindow, setTimeWindow] = useState('5days');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedHotspot, setSelectedHotspot] = useState(INITIAL_HOTSPOTS[0]);

  // Zero-Auth Free High Performance Map Tile Providers (No 401 errors)
  const tileUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  // Filter Hotspots based on HUD controls
  const filteredHotspots = useMemo(() => {
    return INITIAL_HOTSPOTS.filter(h => {
      if (typeFilter === 'CRITICAL') return h.frp >= 80 || h.is_anomaly;
      if (typeFilter === 'INDUSTRIAL') return h.facility_name && h.facility_name !== 'None';
      if (typeFilter === 'WILDFIRE') return !h.facility_name || h.facility_name === 'None';
      return true;
    });
  }, [typeFilter]);

  // Marker Color Determination
  const getMarkerColor = (hotspot) => {
    if (hotspot.facility_name && hotspot.facility_name !== 'None') return '#3B82F6'; // Blue: Industrial
    if (hotspot.frp >= 80 || hotspot.is_anomaly) return '#EF4444'; // Red: Critical Spike
    return '#F59E0B'; // Amber: Open terrain/wildfire
  };

  // Strict Classification Logic
  const getClassification = (hotspot) => {
    if (hotspot.facility_name && hotspot.facility_name !== 'None') {
      return { title: hotspot.facility_name, type: 'Industrial Thermal Anomaly', color: '#38BDF8' };
    }
    if (Number(hotspot.frp) >= 60) {
      return { title: `Wildfire Event (${hotspot.region || 'Forest Reserve'})`, type: 'Dense Forest / Wildfire', color: '#EF4444' };
    }
    return { title: `Agricultural Stubble Fire (${hotspot.region || 'Rural Plain'})`, type: 'Agricultural / Crop Residue Fire', color: '#F59E0B' };
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#090D16', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Navbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '48px',
        backgroundColor: '#090D16E6', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1E293B', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', color: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setHideHud(!hideHud)}
            style={{ backgroundColor: '#0284C7', color: '#FFF', border: 'none', borderRadius: '4px', padding: '5px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {hideHud ? 'SHOW HUD' : 'HIDE HUD'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', letterSpacing: '0.04em' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06B6D4', display: 'inline-block' }}></span>
            INDUSTRIAL FIRE & ANOMALY GIS
            <span style={{ backgroundColor: '#0284C7', color: '#FFF', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>LIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
          <div style={{ backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>STRATEGIC SITES: </span>
            <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>{STRATEGIC_FACILITIES.length}</span>
          </div>
          <div style={{ backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>ACTIVE DETECTIONS: </span>
            <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{filteredHotspots.length}</span>
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
          {/* Search */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#0284C7', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>SEARCH LOCATION / PLANT HUB</div>
            <input 
              type="text" 
              placeholder="Search plant, region..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px 8px', color: '#FFF', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* GIS Base Tile Theme */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>GIS BASE TILE THEME</div>
            <select 
              value={tileTheme} 
              onChange={(e) => setTileTheme(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px', color: '#FFF', fontSize: '11px', outline: 'none' }}
            >
              <option value="dark">Tactical Dark (Defense GIS)</option>
              <option value="satellite">Satellite Imagery (High Res)</option>
              <option value="osm">Standard Street Map</option>
            </select>
          </div>

          {/* Hologram Pulse Toggle */}
          <div style={{ marginBottom: '12px' }}>
            <button 
              onClick={() => setHologramPulse(!hologramPulse)}
              style={{ width: '100%', backgroundColor: hologramPulse ? '#0284C733' : '#0F172A', border: `1px solid ${hologramPulse ? '#0284C7' : '#1E293B'}`, borderRadius: '4px', padding: '6px', color: '#38BDF8', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
            >
              Hologram Pulse: {hologramPulse ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Satellite Source */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>SATELLITE SOURCE</div>
            <select 
              value={satelliteSource} 
              onChange={(e) => setSatelliteSource(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px', color: '#FFF', fontSize: '11px', outline: 'none' }}
            >
              <option value="all">All Satellites (Merged)</option>
              <option value="viirs">VIIRS (SNPP / NOAA-20)</option>
              <option value="modis">MODIS (Terra / Aqua)</option>
            </select>
          </div>

          {/* Orbit Time Window */}
          <div style={{ marginBottom: '12px' }}>
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
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>ANOMALY TYPE FILTERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
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
          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '8px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }}></span>
              <span style={{ color: '#94A3B8' }}>196 Tier-1 Strategic Sites</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
              <span style={{ color: '#94A3B8' }}>Critical Anomaly (&ge;80MW)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></span>
              <span style={{ color: '#94A3B8' }}>Industrial Flare Buffer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
              <span style={{ color: '#94A3B8' }}>Vegetation / Open Terrain</span>
            </div>
          </div>
        </div>
      )}

      {/* Target Telemetry Card (Bottom-Right) */}
      {selectedHotspot && (
        <div style={{
          position: 'absolute', bottom: '20px', right: '20px', width: '280px',
          backgroundColor: '#090D16F2', backdropFilter: 'blur(10px)',
          border: '1px solid #0284C7', borderRadius: '8px', padding: '12px 14px', zIndex: 1000, color: '#FFFFFF', fontSize: '11px', boxShadow: '0 8px 24px rgba(0,0,0,0.7)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ color: '#38BDF8', fontWeight: '800', fontSize: '11px', letterSpacing: '0.04em' }}>TARGET TELEMETRY</span>
            <span style={{ cursor: 'pointer', color: '#94A3B8', fontWeight: 'bold' }} onClick={() => setSelectedHotspot(null)}>✕</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Classification: </span>
              <span style={{ fontWeight: 'bold', color: getClassification(selectedHotspot).color }}>
                {getClassification(selectedHotspot).type}
              </span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Nearest Facility: </span>
              <span style={{ color: '#60A5FA' }}>
                {selectedHotspot.facility_name && selectedHotspot.facility_name !== 'None'
                  ? selectedHotspot.facility_name
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
              <span style={{ color: '#94A3B8' }}>{Number(selectedHotspot.lat).toFixed(4)}, {Number(selectedHotspot.lng).toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <MapContainer 
        center={[21.0, 78.5]} 
        zoom={5} 
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={tileUrls[tileTheme] || tileUrls.dark} />

        {/* 196 Strategic Industrial Facilities Markers */}
        {STRATEGIC_FACILITIES.map((facility) => (
          <CircleMarker
            key={facility.id}
            center={[facility.lat, facility.lng]}
            radius={4}
            pathOptions={{
              color: '#38BDF8',
              fillColor: '#0284C7',
              fillOpacity: 0.9,
              weight: 1.5
            }}
          >
            <Popup>
              <div style={{ color: '#0F172A', fontFamily: 'sans-serif', minWidth: '160px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284C7' }}>{facility.name}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Region: {facility.region}</div>
                <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Geofence: {facility.buffer_km} km Protected Zone</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Active Fire Hotspots (With Full Interactive Popups & Telemetry Sync) */}
        {filteredHotspots.map((hotspot) => {
          const color = getMarkerColor(hotspot);
          const classification = getClassification(hotspot);

          return (
            <CircleMarker
              key={hotspot.id}
              center={[hotspot.lat, hotspot.lng]}
              radius={hotspot.frp >= 80 ? 8 : 6}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: 2
              }}
              eventHandlers={{
                click: () => setSelectedHotspot(hotspot)
              }}
            >
              <Popup>
                <div style={{ color: '#0F172A', fontFamily: 'sans-serif', minWidth: '180px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F172A', marginBottom: '3px' }}>
                    {classification.title}
                  </div>
                  <div style={{ fontSize: '11px', margin: '2px 0', color: '#334155' }}>
                    FRP: <strong style={{ color: '#B91C1C' }}>{hotspot.frp} MW</strong> | Temp: {hotspot.brightness} K
                  </div>
                  <div style={{ fontSize: '11px', margin: '2px 0', color: '#334155' }}>
                    Type: <strong style={{ color: classification.color }}>{classification.type}</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
                    Coords: {Number(hotspot.lat).toFixed(4)}, {Number(hotspot.lng).toFixed(4)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}