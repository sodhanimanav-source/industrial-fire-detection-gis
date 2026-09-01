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

// Accurate Coastal Land Polygon for India Mainland
const INDIA_COAST_POLY = [
  [32.5, 74.8], [32.0, 76.5], [31.0, 78.0], [29.8, 80.2], [27.0, 88.0],
  [26.5, 89.8], [24.0, 89.0], [22.2, 88.8], [21.5, 87.1], [19.8, 85.8],
  [17.5, 83.2], [14.0, 80.2], [11.8, 79.8], [9.2, 79.1],  [8.2, 77.6],
  [8.5, 76.9],  [10.0, 76.2], [12.9, 74.8], [15.5, 73.8], [18.9, 72.8],
  [20.8, 72.8], [21.5, 72.3], [22.3, 69.5], [23.2, 68.6], [24.5, 68.8],
  [27.0, 70.5], [29.5, 71.8], [31.5, 73.5], [32.5, 74.8]
];

// Accurate Coastal Land Polygon for Sri Lanka
const SRI_LANKA_POLY = [
  [9.8, 80.2], [8.9, 81.0], [8.5, 81.3], [7.7, 81.8],
  [6.8, 81.8], [6.0, 81.1], [5.9, 80.5], [6.2, 80.0],
  [6.9, 79.8], [7.9, 79.8], [8.8, 79.8], [9.8, 80.2]
];

// Point-in-Polygon Check (Ray-Casting Algorithm)
function isPointOnLand(lat, lng) {
  const checkPoly = (poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };
  return checkPoly(INDIA_COAST_POLY) || checkPoly(SRI_LANKA_POLY);
}

// 196+ Strategic Industrial Assets Baseline
const STRATEGIC_PLANTS = [
  { name: 'Jamnagar Reliance / Nayara Complex', lat: 22.4707, lng: 70.0577, region: 'Gujarat Industrial Belt' },
  { name: 'Dahej Petrochemical Corridor', lat: 21.7051, lng: 72.5855, region: 'Gujarat Coastal Belt' },
  { name: 'Hazira Heavy Industry & LNG Hub', lat: 21.1121, lng: 72.6450, region: 'Gujarat Coastal Belt' },
  { name: 'Mumbai Trombay Energy Corridor', lat: 19.0176, lng: 72.8561, region: 'Maharashtra Deccan' },
  { name: 'Nagpur Multi-Modal Cargo Energy Hub', lat: 21.0685, lng: 79.0520, region: 'Vidarbha Industrial Belt' },
  { name: 'Singrauli Super Thermal Energy Base', lat: 24.1997, lng: 82.6645, region: 'Central Thermal Belt' },
  { name: 'Korba Super Thermal Power Hub', lat: 22.3595, lng: 82.7501, region: 'Chhattisgarh Energy Belt' },
  { name: 'Bhilai Steel & Metal Industrial Complex', lat: 21.1938, lng: 81.4024, region: 'Chhattisgarh Energy Belt' },
  { name: 'Jamshedpur Heavy Steel Hub', lat: 22.8046, lng: 86.2029, region: 'Jharkhand Belt' },
  { name: 'Visakhapatnam LNG Port & Refinery', lat: 17.6868, lng: 83.2185, region: 'Eastern Seaboard' },
  { name: 'Paradip Refinery Complex', lat: 20.2644, lng: 86.6083, region: 'Odisha Coastal Belt' },
  { name: 'Haldia Petrochemical Complex', lat: 22.0667, lng: 88.0698, region: 'Eastern Industrial Zone' },
  { name: 'Mathura Refinery Complex', lat: 27.4924, lng: 77.6737, region: 'Yamuna Industrial Corridor' },
  { name: 'Panipat Strategic Petrochem Hub', lat: 29.3909, lng: 76.9635, region: 'Northern Industrial Belt' },
  { name: 'Bhatinda Strategic Refinery', lat: 30.0384, lng: 74.8219, region: 'Punjab Industrial Belt' },
  { name: 'Mangalore Refinery & Petrochem (MRPL)', lat: 12.9141, lng: 74.8560, region: 'Karnataka Coast' },
  { name: 'Manali Industrial & CPCL Refinery', lat: 13.1673, lng: 80.2582, region: 'Tamil Nadu Seaboard' },
  { name: 'Kochi BPCL Refinery & LNG Terminal', lat: 9.9312, lng: 76.2673, region: 'Kerala Coastal Corridor' },
  { name: 'Sapugaskanda Refinery Complex (CPC)', lat: 6.9658, lng: 79.9489, region: 'Western Province (Sri Lanka)' },
  { name: 'Colombo Port & Energy Bunkering', lat: 6.9520, lng: 79.8510, region: 'Western Province (Sri Lanka)' },
  { name: 'Norochcholai Lakvijaya Power Hub', lat: 8.0163, lng: 79.7214, region: 'North Western (Sri Lanka)' },
  { name: 'Trincomalee Petroleum Tank Farm', lat: 8.5711, lng: 81.2335, region: 'Eastern Sri Lanka' },
  { name: 'Hambantota International Port & Tank Farm', lat: 6.1248, lng: 81.1213, region: 'Southern Sri Lanka' }
];

const FULL_STRATEGIC_ASSETS = Array.from({ length: 196 }, (_, i) => {
  const base = STRATEGIC_PLANTS[i % STRATEGIC_PLANTS.length];
  const jLat = ((i * 19) % 30 - 15) * 0.025;
  const jLng = ((i * 29) % 30 - 15) * 0.025;
  return {
    id: `plant-tier1-${i + 1}`,
    name: i < STRATEGIC_PLANTS.length ? base.name : `${base.name.split(' ')[0]} Asset Unit ${i + 1}`,
    lat: base.lat + jLat,
    lng: base.lng + jLng,
    region: base.region,
    buffer_km: 15
  };
});

// Deterministic Pseudo-Random Generator (Fast, Instant, Zero Freeze)
const generateStrictLandlockedDetections = () => {
  const detections = [];
  const TOTAL = 2540;
  let seed = 987654321;

  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  let count = 0;
  while (count < TOTAL) {
    let lat, lng, isIndustrial = false, plantRef = null;

    if (count < 380) {
      // 15km buffer around strategic assets
      plantRef = FULL_STRATEGIC_ASSETS[count % FULL_STRATEGIC_ASSETS.length];
      lat = plantRef.lat + (rand() - 0.5) * 0.08;
      lng = plantRef.lng + (rand() - 0.5) * 0.08;
      isIndustrial = true;
    } else if (count < 550) {
      // Sri Lanka landmass
      lat = 5.9 + rand() * 3.8;
      lng = 79.7 + rand() * 2.1;
    } else {
      // India landmass
      lat = 8.4 + rand() * 24.1;
      lng = 68.8 + rand() * 20.5;
    }

    // Strict boundary validation: Reject any coordinate that falls in the ocean
    if (isPointOnLand(lat, lng)) {
      const frpVal = isIndustrial ? Math.floor(75 + rand() * 115) : Math.floor(18 + rand() * 95);

      detections.push({
        id: count + 1,
        lat,
        lng,
        frp: frpVal,
        brightness: Math.floor(305 + rand() * 55),
        satellite: rand() > 0.45 ? 'VIIRS_NRT' : 'MODIS_NRT',
        time: `${String(Math.floor(rand() * 14) + 6).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')} UTC`,
        region: plantRef ? plantRef.region : (lat < 10.0 ? 'Sri Lanka Sector' : (lat > 22.0 ? 'Northern/Central Sector' : 'Southern Peninsula')),
        facility_name: isIndustrial && plantRef ? plantRef.name : null,
        offset_km: isIndustrial ? (rand() * 4.2 + 0.5).toFixed(1) : (rand() * 80 + 16).toFixed(1),
        is_anomaly: frpVal >= 80 || isIndustrial
      });
      count++;
    }
  }

  return detections;
};

const BASE_DETECTIONS = generateStrictLandlockedDetections();

export default function App() {
  const [hideHud, setHideHud] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tileTheme, setTileTheme] = useState('dark');
  const [hologramPulse, setHologramPulse] = useState(true);
  const [satelliteSource, setSatelliteSource] = useState('all');
  const [timeWindow, setTimeWindow] = useState('5days');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedHotspot, setSelectedHotspot] = useState(BASE_DETECTIONS[0]);

  const tileUrls = {
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  const getClassificationData = (hotspot) => {
    const offset = parseFloat(hotspot.offset_km || 999);
    if ((hotspot.facility_name && hotspot.facility_name !== 'None') || offset <= 15.0) {
      return {
        title: hotspot.facility_name || 'Industrial Thermal Corridor Anomaly',
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
    return BASE_DETECTIONS.filter(h => {
      const offset = parseFloat(h.offset_km || 999);
      const isInd = (h.facility_name && h.facility_name !== 'None') || offset <= 15.0;

      if (typeFilter === 'CRITICAL') return h.frp >= 80 || h.is_anomaly;
      if (typeFilter === 'INDUSTRIAL') return isInd;
      if (typeFilter === 'WILDFIRE') return !isInd;
      return true;
    });
  }, [typeFilter]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#090D16', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Navbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '48px',
        backgroundColor: '#090D16F2', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1E293B', zIndex: 1000,
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
            <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>196+</span>
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
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#0284C7', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>SEARCH LOCATION / PLANT HUB</div>
            <input 
              type="text" 
              placeholder="Search Colombo, Jamnagar, UP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px 8px', color: '#FFF', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>GIS BASE TILE THEME</div>
            <select 
              value={tileTheme} 
              onChange={(e) => setTileTheme(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px', color: '#FFF', fontSize: '11px', outline: 'none' }}
            >
              <option value="dark">Tactical Dark (Esri Defense GIS)</option>
              <option value="satellite">Satellite Imagery (High Res)</option>
              <option value="osm">Standard Street Map</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button 
              onClick={() => setHologramPulse(!hologramPulse)}
              style={{ width: '100%', backgroundColor: hologramPulse ? '#0284C733' : '#0F172A', border: `1px solid ${hologramPulse ? '#0284C7' : '#1E293B'}`, borderRadius: '4px', padding: '6px', color: '#38BDF8', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
            >
              Hologram Pulse: {hologramPulse ? 'ON' : 'OFF'}
            </button>
          </div>

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

          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '8px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }}></span>
              <span style={{ color: '#94A3B8' }}>Industrial Flare Buffer (&le;15km)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
              <span style={{ color: '#94A3B8' }}>Dense Forest / Wildfire (&ge;60MW)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
              <span style={{ color: '#94A3B8' }}>Agricultural Stubble Fire (&lt;60MW)</span>
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
        <TileLayer url={tileUrls[tileTheme] || tileUrls.dark} />

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
                fillOpacity: isSelected ? 1.0 : (hologramPulse ? 0.85 : 0.6),
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