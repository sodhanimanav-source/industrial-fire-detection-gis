import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Strategic Industrial Plants
const STRATEGIC_PLANTS = [
  { name: 'Jamnagar Reliance / Nayara Complex', lat: 22.4707, lng: 70.0577, region: 'Gujarat Industrial Belt' },
  { name: 'Dahej Petrochemical Corridor', lat: 21.7051, lng: 72.5855, region: 'Gujarat Coastal Belt' },
  { name: 'Hazira Heavy Industry Hub', lat: 21.1121, lng: 72.6450, region: 'Western Zone' },
  { name: 'Mumbai Trombay Energy Corridor', lat: 19.0176, lng: 72.8561, region: 'Maharashtra Deccan' },
  { name: 'Singrauli Super Thermal Energy Base', lat: 24.1997, lng: 82.6645, region: 'Central Thermal Belt' },
  { name: 'Korba Super Thermal Power Hub', lat: 22.3595, lng: 82.7501, region: 'Chhattisgarh Energy Belt' },
  { name: 'Visakhapatnam LNG Port & Refinery', lat: 17.6868, lng: 83.2185, region: 'Eastern Seaboard' },
  { name: 'Paradip Refinery Complex', lat: 20.2644, lng: 86.6083, region: 'Odisha Coastal Belt' },
  { name: 'Haldia Petrochemical Complex', lat: 22.0667, lng: 88.0698, region: 'Eastern Industrial Zone' },
  { name: 'Mangalore Refinery & Petrochem (MRPL)', lat: 12.9141, lng: 74.8560, region: 'Karnataka Coast' },
  { name: 'Kochi Crude Refining & LNG Port', lat: 9.9312, lng: 76.2673, region: 'Kerala Corridor' },
  { name: 'Manali Petrochemical & Energy Hub', lat: 13.1673, lng: 80.2582, region: 'Tamil Nadu Coast' },
  { name: 'Barauni Petrochemical Center', lat: 25.4670, lng: 85.9678, region: 'Northern Plains' },
  { name: 'Panipat Strategic Petrochem Hub', lat: 29.3909, lng: 76.9635, region: 'Northern Industrial Belt' },
  { name: 'Mathura Refinery Complex', lat: 27.4924, lng: 77.6737, region: 'Yamuna Industrial Corridor' },
  { name: 'Sapugaskanda Refinery Complex (CPC)', lat: 6.9658, lng: 79.9489, region: 'Western Province (Sri Lanka)' },
  { name: 'Hambantota International Port & Tank Farm', lat: 6.1248, lng: 81.1213, region: 'Southern Sri Lanka' },
  { name: 'Trincomalee Petroleum Terminal', lat: 8.5711, lng: 81.2335, region: 'Eastern Sri Lanka' }
];

const FULL_STRATEGIC_ASSETS = Array.from({ length: 196 }, (_, i) => {
  const base = STRATEGIC_PLANTS[i % STRATEGIC_PLANTS.length];
  return {
    id: `plant-tier1-${i + 1}`,
    name: i < STRATEGIC_PLANTS.length ? base.name : `${base.name.split(' ')[0]} Strategic Unit ${i + 1}`,
    lat: base.lat + (((i * 17) % 40 - 20) * 0.02),
    lng: base.lng + (((i * 23) % 40 - 20) * 0.02),
    region: base.region,
    buffer_km: 15
  };
});

const getCoastalBounds = (lat) => {
  if (lat >= 5.8 && lat <= 9.8) return { minLng: 79.7, maxLng: 81.8, isSL: true };
  if (lat >= 8.2 && lat < 11.5) return { minLng: 76.4, maxLng: 79.8, isSL: false };
  if (lat >= 11.5 && lat < 15.0) return { minLng: 74.8, maxLng: 80.3, isSL: false };
  if (lat >= 15.0 && lat < 19.0) return { minLng: 73.5, maxLng: 82.8, isSL: false };
  if (lat >= 19.0 && lat < 23.5) return { minLng: 69.8, maxLng: 87.5, isSL: false };
  if (lat >= 23.5 && lat < 27.5) return { minLng: 70.8, maxLng: 88.2, isSL: false };
  if (lat >= 27.5 && lat <= 32.5) return { minLng: 74.2, maxLng: 81.5, isSL: false };
  return null;
};

const generateContinuousNationwideHotspots = () => {
  const detections = [];
  const TOTAL = 2540;
  let id = 1;
  let seed = 48271;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 420; i++) {
    const plant = FULL_STRATEGIC_ASSETS[i % FULL_STRATEGIC_ASSETS.length];
    const lat = plant.lat + (nextRand() - 0.5) * 0.08;
    const lng = plant.lng + (nextRand() - 0.5) * 0.08;
    const frpVal = Math.floor(75 + nextRand() * 115);

    detections.push({
      id: id++,
      lat,
      lng,
      frp: frpVal,
      brightness: Math.floor(310 + nextRand() * 50),
      satellite: nextRand() > 0.45 ? 'VIIRS_NRT' : 'MODIS_NRT',
      time: `${String(Math.floor(nextRand() * 14) + 6).padStart(2, '0')}:${String(Math.floor(nextRand() * 60)).padStart(2, '0')} UTC`,
      region: plant.region,
      facility_name: plant.name,
      offset_km: (nextRand() * 4.2 + 0.5).toFixed(1),
      is_anomaly: true
    });
  }

  for (let i = 420; i < TOTAL; i++) {
    let lat = 5.9 + nextRand() * 26.3;
    let bounds = getCoastalBounds(lat);
    if (!bounds) {
      lat = 20.0 + nextRand() * 8.0;
      bounds = getCoastalBounds(lat);
    }
    const lng = bounds.minLng + nextRand() * (bounds.maxLng - bounds.minLng);
    const frpVal = Math.floor(18 + nextRand() * 95);

    detections.push({
      id: id++,
      lat,
      lng,
      frp: frpVal,
      brightness: Math.floor(305 + nextRand() * 55),
      satellite: nextRand() > 0.45 ? 'VIIRS_NRT' : 'MODIS_NRT',
      time: `${String(Math.floor(nextRand() * 14) + 6).padStart(2, '0')}:${String(Math.floor(nextRand() * 60)).padStart(2, '0')} UTC`,
      region: bounds.isSL ? 'Sri Lanka Sector' : (lat > 22.0 ? 'Northern/Central Sector' : 'Southern Peninsular Sector'),
      facility_name: null,
      offset_km: (nextRand() * 80 + 16).toFixed(1),
      is_anomaly: frpVal >= 80
    });
  }
  return detections;
};

const ALL_SAFE_DETECTIONS = generateContinuousNationwideHotspots();

export default function App() {
  const [hideHud, setHideHud] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tileTheme, setTileTheme] = useState('cartoDark');
  const [hologramPulse, setHologramPulse] = useState(true);
  const [satelliteSource, setSatelliteSource] = useState('all');
  const [timeWindow, setTimeWindow] = useState('5days');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedHotspot, setSelectedHotspot] = useState(ALL_SAFE_DETECTIONS[0]);

  // High-Tech Tile Sources (Free, Zero Key Required)
  const tileUrls = {
    cartoDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    googleHybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  const getClassificationData = (hotspot) => {
    const offset = parseFloat(hotspot.offset_km || 999);
    if ((hotspot.facility_name && hotspot.facility_name !== 'None') || offset <= 15.0) {
      return {
        title: hotspot.facility_name || 'Industrial Thermal Corridor Flare',
        type: 'Industrial Thermal Flare / Anomaly',
        color: '#38BDF8'
      };
    }
    if (Number(hotspot.frp) >= 60) {
      return {
        title: `Wildfire Event (${hotspot.region || 'Forest Reserve'})`,
        type: 'Dense Forest / Wildfire',
        color: '#EF4444'
      };
    }
    return {
      title: `Agricultural Stubble Fire (${hotspot.region || 'Rural Plain'})`,
      type: 'Agricultural / Crop Residue Fire',
      color: '#F59E0B'
    };
  };

  const filteredHotspots = useMemo(() => {
    return ALL_SAFE_DETECTIONS.filter(h => {
      const offset = parseFloat(h.offset_km || 999);
      const isInd = (h.facility_name && h.facility_name !== 'None') || offset <= 15.0;
      if (typeFilter === 'CRITICAL') return h.frp >= 80 || h.is_anomaly;
      if (typeFilter === 'INDUSTRIAL') return isInd;
      if (typeFilter === 'WILDFIRE') return !isInd;
      return true;
    });
  }, [typeFilter]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#06090F', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Navbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '48px',
        backgroundColor: '#06090FF2', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1E293B', zIndex: 1000,
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
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00F2FE', display: 'inline-block', boxShadow: '0 0 10px #00F2FE' }}></span>
            CYBER GIS INDUSTRIAL SURVEILLANCE
            <span style={{ backgroundColor: '#0284C7', color: '#FFF', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>LIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
          <div style={{ backgroundColor: '#0B1120', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>STRATEGIC SITES: </span>
            <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>196</span>
          </div>
          <div style={{ backgroundColor: '#0B1120', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>ACTIVE DETECTIONS: </span>
            <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{filteredHotspots.length}</span>
          </div>
          <div style={{ backgroundColor: '#0B1120', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>STATUS: </span>
            <span style={{ color: '#22C55E', fontWeight: 'bold' }}>CONNECTED (14ms LAG)</span>
          </div>
        </div>
      </div>

      {/* Left HUD Panel */}
      {!hideHud && (
        <div style={{
          position: 'absolute', top: '60px', left: '16px', width: '220px',
          backgroundColor: '#06090FE6', backdropFilter: 'blur(10px)',
          border: '1px solid #1E293B', borderRadius: '8px', padding: '14px', zIndex: 1000, color: '#FFFFFF', fontSize: '11px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#0284C7', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>SEARCH LOCATION / PLANT HUB</div>
            <input 
              type="text" 
              placeholder="Search Jamnagar, Dahej..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px 8px', color: '#FFF', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>GIS BASE THEME</div>
            <select 
              value={tileTheme} 
              onChange={(e) => setTileTheme(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px', color: '#FFF', fontSize: '11px', outline: 'none' }}
            >
              <option value="cartoDark">⚡ Cyber Dark Matter (High-Tech)</option>
              <option value="googleHybrid">🗺️ Google Hybrid (Satellite + Roads)</option>
              <option value="satellite">🛰️ High-Res Satellite</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button 
              onClick={() => setHologramPulse(!hologramPulse)}
              style={{ width: '100%', backgroundColor: hologramPulse ? '#0284C733' : '#0B1120', border: `1px solid ${hologramPulse ? '#0284C7' : '#1E293B'}`, borderRadius: '4px', padding: '6px', color: '#38BDF8', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
            >
              Hologram Pulse: {hologramPulse ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>SATELLITE SOURCE</div>
            <select 
              value={satelliteSource} 
              onChange={(e) => setSatelliteSource(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px', color: '#FFF', fontSize: '11px', outline: 'none' }}
            >
              <option value="all">All Satellites (Merged)</option>
              <option value="viirs">VIIRS (SNPP / NOAA-20)</option>
              <option value="modis">MODIS (Terra / Aqua)</option>
            </select>
          </div>

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
                      backgroundColor: active ? '#78350F' : '#0B1120',
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

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>ANOMALY FILTERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {['ALL', 'CRITICAL', 'INDUSTRIAL', 'WILDFIRE'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  style={{
                    backgroundColor: typeFilter === type ? '#0284C7' : '#0B1120',
                    border: `1px solid ${typeFilter === type ? '#38BDF8' : '#1E293B'}`,
                    color: '#FFF', borderRadius: '4px', padding: '5px 0', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '8px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8', boxShadow: '0 0 6px #38BDF8' }}></span>
              <span style={{ color: '#94A3B8' }}>Industrial Flare Buffer (&le;15km)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', boxShadow: '0 0 6px #EF4444' }}></span>
              <span style={{ color: '#94A3B8' }}>Dense Forest / Wildfire (&ge;60MW)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B', boxShadow: '0 0 6px #F59E0B' }}></span>
              <span style={{ color: '#94A3B8' }}>Agricultural Stubble Fire (&lt;60MW)</span>
            </div>
          </div>
        </div>
      )}

      {/* Target Telemetry Card */}
      {selectedHotspot && (
        <div style={{
          position: 'absolute', bottom: '20px', right: '20px', width: '280px',
          backgroundColor: '#06090FF2', backdropFilter: 'blur(10px)',
          border: '1px solid #0284C7', borderRadius: '8px', padding: '12px 14px', zIndex: 1000, color: '#FFFFFF', fontSize: '11px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ color: '#38BDF8', fontWeight: '800', fontSize: '11px', letterSpacing: '0.04em' }}>TARGET TELEMETRY</span>
            <span style={{ cursor: 'pointer', color: '#94A3B8', fontWeight: 'bold' }} onClick={() => setSelectedHotspot(null)}>✕</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Classification: </span>
              <span style={{ fontWeight: 'bold', color: getClassificationData(selectedHotspot).color }}>
                {getClassificationData(selectedHotspot).type}
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
              <span style={{ fontWeight: 'bold' }}>{selectedHotspot.offset_km} km</span>
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

      {/* Main Tactical Map View */}
      <MapContainer 
        center={[18.5, 79.5]} 
        zoom={5} 
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer 
          url={tileUrls[tileTheme] || tileUrls.cartoDark} 
          subdomains={['a', 'b', 'c', 'd']}
        />

        {filteredHotspots.map((hotspot) => {
          const info = getClassificationData(hotspot);
          const isSelected = selectedHotspot?.id === hotspot.id;

          return (
            <CircleMarker
              key={hotspot.id}
              center={[hotspot.lat, hotspot.lng]}
              radius={isSelected ? 7 : (info.type.includes('Industrial') ? 4.5 : 3.2)}
              pathOptions={{
                color: isSelected ? '#FFFFFF' : info.color,
                fillColor: info.color,
                fillOpacity: isSelected ? 1.0 : (hologramPulse ? 0.9 : 0.6),
                weight: isSelected ? 2 : 1
              }}
              eventHandlers={{
                click: () => setSelectedHotspot(hotspot)
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <span style={{ fontWeight: 'bold' }}>{info.title}</span><br/>
                FRP: {hotspot.frp} MW | {info.type}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}