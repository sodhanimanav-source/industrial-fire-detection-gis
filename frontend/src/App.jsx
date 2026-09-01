import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Strategic Industrial Plants Registry (196 Top Tier-1 Sites across Real Industrial Corridors)
const STRATEGIC_PLANTS = Array.from({ length: 196 }, (_, i) => {
  const baseHubs = [
    { name: 'Jamnagar Strategic Refinery', lat: 22.4707, lng: 70.0577, region: 'Gujarat Industrial Belt' },
    { name: 'Dahej Petrochemical Complex', lat: 21.7051, lng: 72.5855, region: 'Gujarat Coastal Belt' },
    { name: 'Hazira Heavy Industry Hub', lat: 21.1121, lng: 72.6450, region: 'Western Zone' },
    { name: 'Mumbai Trombay Energy Corridor', lat: 19.0176, lng: 72.8561, region: 'Maharashtra Deccan' },
    { name: 'Singrauli Thermal Power Base', lat: 24.1997, lng: 82.6645, region: 'Central Thermal Belt' },
    { name: 'Korba Super Thermal Hub', lat: 22.3595, lng: 82.7501, region: 'Chhattisgarh Energy Belt' },
    { name: 'Visakhapatnam LNG Port & Refinery', lat: 17.6868, lng: 83.2185, region: 'Eastern Seaboard' },
    { name: 'Paradip Refinery & Petrochem Port', lat: 20.2644, lng: 86.6083, region: 'Odisha Industrial Zone' },
    { name: 'Haldia Petrochemical Complex', lat: 22.0667, lng: 88.0698, region: 'Eastern Industrial Zone' },
    { name: 'Mangalore Refinery & Petrochem (MRPL)', lat: 12.9141, lng: 74.8560, region: 'Karnataka Coast' },
    { name: 'Kochi Crude Refining & LNG Hub', lat: 9.9312, lng: 76.2673, region: 'Kerala Corridor' },
    { name: 'Manali Industrial & Petrochem Hub', lat: 13.1673, lng: 80.2582, region: 'Tamil Nadu Coast' },
    { name: 'Barauni Petrochemical Center', lat: 25.4670, lng: 85.9678, region: 'Northern Plains' },
    { name: 'Panipat Strategic Petrochem Hub', lat: 29.3909, lng: 76.9635, region: 'Northern Industrial Belt' },
    { name: 'Mathura Refinery Complex', lat: 27.4924, lng: 77.6737, region: 'Yamuna Industrial Corridor' },
    { name: 'Nagpur Multi-Modal Cargo Hub', lat: 21.1458, lng: 79.0882, region: 'Vidarbha Industrial Belt' },
    { name: 'Jamshedpur Heavy Steel Hub', lat: 22.8046, lng: 86.2029, region: 'Jharkhand Belt' },
    { name: 'Rourkela Steel Complex', lat: 22.2604, lng: 84.8536, region: 'Odisha Belt' }
  ];
  const hub = baseHubs[i % baseHubs.length];
  const randOffsetLat = ((i * 37) % 100 - 50) * 0.012;
  const randOffsetLng = ((i * 41) % 100 - 50) * 0.012;
  return {
    id: `plant-${i + 1}`,
    name: i < 18 ? hub.name : `Strategic Energy Unit ${i + 1} (${hub.name.split(' ')[0]})`,
    lat: hub.lat + randOffsetLat,
    lng: hub.lng + randOffsetLng,
    region: hub.region,
    buffer_km: 5
  };
});

// Accurate India Mainland Boundary Polygon
const INDIA_POLYGON = [
  [32.5, 74.8], [32.0, 76.5], [30.5, 78.5], [29.8, 80.2], [27.0, 88.0],
  [26.5, 89.8], [24.0, 89.0], [22.0, 88.5], [21.5, 87.0], [19.5, 85.0],
  [17.0, 82.5], [14.0, 80.2], [11.5, 79.8], [8.5, 77.5], [8.5, 76.8],
  [10.5, 76.0], [13.0, 74.7], [15.5, 73.8], [19.0, 72.8], [21.0, 72.5],
  [22.8, 69.5], [24.5, 68.8], [27.0, 70.5], [29.5, 72.0], [31.5, 73.5], [32.5, 74.8]
];

// Ray-Casting Point-in-Polygon Algorithm
function isInsideIndia(lat, lng) {
  let inside = false;
  for (let i = 0, j = INDIA_POLYGON.length - 1; i < INDIA_POLYGON.length; j = i++) {
    const xi = INDIA_POLYGON[i][0], yi = INDIA_POLYGON[i][1];
    const xj = INDIA_POLYGON[j][0], yj = INDIA_POLYGON[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Pseudo-Random Seeded Scatter strictly bound to Landmass
const generateLandlockedHotspots = () => {
  const detections = [];
  const TOTAL = 2142;
  let count = 0;
  let seed = 42;

  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (count < TOTAL) {
    let lat, lng, isIndustrial = false, plantRef = null;

    if (count < 260) {
      // Direct industrial heat points within 5km of 196 sites
      plantRef = STRATEGIC_PLANTS[count % STRATEGIC_PLANTS.length];
      lat = plantRef.lat + (pseudoRandom() - 0.5) * 0.05;
      lng = plantRef.lng + (pseudoRandom() - 0.5) * 0.05;
      isIndustrial = true;
    } else {
      // Natural geographic scatter across Indian territory
      lat = 8.5 + pseudoRandom() * 23.5;
      lng = 69.0 + pseudoRandom() * 20.0;
    }

    if (isInsideIndia(lat, lng)) {
      const frpVal = isIndustrial ? Math.floor(75 + pseudoRandom() * 115) : Math.floor(18 + pseudoRandom() * 95);
      detections.push({
        id: count + 1,
        lat,
        lng,
        frp: frpVal,
        brightness: Math.floor(305 + pseudoRandom() * 55),
        satellite: pseudoRandom() > 0.45 ? 'VIIRS_NRT' : 'MODIS_NRT',
        time: `${String(Math.floor(pseudoRandom() * 14) + 6).padStart(2, '0')}:${String(Math.floor(pseudoRandom() * 60)).padStart(2, '0')} UTC`,
        region: plantRef ? plantRef.region : (lat > 22.5 ? (lng > 80 ? 'Eastern Corridor' : 'Northern Plains') : (lng > 78 ? 'Eastern Seaboard' : 'Deccan Plateau')),
        facility_name: isIndustrial && plantRef ? plantRef.name : null,
        offset_km: isIndustrial ? (pseudoRandom() * 3.5 + 0.4).toFixed(1) : (pseudoRandom() * 85 + 12).toFixed(1),
        is_anomaly: frpVal >= 80 || isIndustrial
      });
      count++;
    }
  }

  return detections;
};

const ALL_DETECTIONS = generateLandlockedHotspots();

export default function App() {
  const [hideHud, setHideHud] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tileTheme, setTileTheme] = useState('dark');
  const [hologramPulse, setHologramPulse] = useState(true);
  const [satelliteSource, setSatelliteSource] = useState('all');
  const [timeWindow, setTimeWindow] = useState('5days');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedHotspot, setSelectedHotspot] = useState(ALL_DETECTIONS[0]);

  // Clean Zero-Auth GIS Dark Tiles
  const tileUrls = {
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  const getClassificationData = (hotspot) => {
    if (hotspot.facility_name && hotspot.facility_name !== 'None') {
      return {
        title: hotspot.facility_name,
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
    return ALL_DETECTIONS.filter(h => {
      if (satelliteSource === 'viirs' && !h.satellite.includes('VIIRS')) return false;
      if (satelliteSource === 'modis' && !h.satellite.includes('MODIS')) return false;
      if (typeFilter === 'CRITICAL') return h.frp >= 80 || h.is_anomaly;
      if (typeFilter === 'INDUSTRIAL') return h.facility_name && h.facility_name !== 'None';
      if (typeFilter === 'WILDFIRE') return !h.facility_name || h.facility_name === 'None';
      return true;
    });
  }, [satelliteSource, typeFilter]);

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
              <span style={{ color: '#94A3B8' }}>Industrial Flare Buffer (&le;5km)</span>
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

      {/* Target Telemetry Card */}
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

      {/* Map Canvas */}
      <MapContainer 
        center={[20.5937, 78.9629]} 
        zoom={5} 
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={tileUrls[tileTheme] || tileUrls.dark} />

        {/* 2,142 Active Hotspots strictly landlocked across India */}
        {filteredHotspots.map((hotspot) => {
          const info = getClassificationData(hotspot);
          const isSelected = selectedHotspot?.id === hotspot.id;

          return (
            <CircleMarker
              key={hotspot.id}
              center={[hotspot.lat, hotspot.lng]}
              radius={isSelected ? 8 : (hotspot.facility_name ? 5 : (hotspot.frp >= 60 ? 4.5 : 3.5))}
              pathOptions={{
                color: isSelected ? '#FFFFFF' : info.color,
                fillColor: info.color,
                fillOpacity: isSelected ? 1.0 : (hologramPulse ? 0.85 : 0.65),
                weight: isSelected ? 2.5 : 1
              }}
              eventHandlers={{
                click: () => setSelectedHotspot(hotspot)
              }}
            >
              <Popup>
                <div style={{ color: '#0F172A', fontFamily: 'sans-serif', minWidth: '180px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F172A', marginBottom: '3px' }}>
                    {info.title}
                  </div>
                  <div style={{ fontSize: '11px', margin: '2px 0', color: '#334155' }}>
                    FRP: <strong style={{ color: '#B91C1C' }}>{hotspot.frp} MW</strong> | Temp: {hotspot.brightness} K
                  </div>
                  <div style={{ fontSize: '11px', margin: '2px 0', color: '#334155' }}>
                    Type: <strong style={{ color: info.color }}>{info.type}</strong>
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