import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

const API_BASE = "https://industrial-fire-detection-gis.onrender.com/api";

const MAP_THEMES = {
  esriDark: {
    name: "Tactical Dark (Precision Cities)",
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attrib: "Esri, HERE, Garmin"
  },
  satellite: {
    name: "Satellite Imagery & City Labels",
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attrib: "Esri, Maxar"
  },
  osm: {
    name: "Standard Street (OSM)",
    base: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    labels: null,
    attrib: "© OpenStreetMap"
  }
};

const INITIAL_FALLBACK = Array.from({ length: 450 }).map((_, i) => {
  const hubs = [
    { lat: 22.47, lng: 70.06, name: "Jamnagar Petrochemical Zone", type: "Industrial / Operational" },
    { lat: 20.31, lng: 86.61, name: "Paradip Refinery Complex", type: "Industrial / Operational" },
    { lat: 24.20, lng: 82.66, name: "Singrauli Thermal Belt", type: "Industrial / Operational" },
    { lat: 18.53, lng: 73.13, name: "Nagothane Chemical Cluster", type: "Industrial / Operational" },
    { lat: 30.80, lng: 75.85, name: "Punjab Agri Forest Zone", type: "Wildfire / Vegetation" },
    { lat: 22.10, lng: 81.20, name: "Central Forest Zone", type: "Wildfire / Vegetation" },
    { lat: 14.80, lng: 75.20, name: "Western Ghats Corridor", type: "Wildfire / Vegetation" },
    { lat: 26.50, lng: 93.10, name: "Assam Reserves", type: "Wildfire / Vegetation" }
  ];
  const hub = hubs[i % hubs.length];
  const isInd = hub.type === "Industrial / Operational";
  const spread = isInd ? 0.45 : 2.5;
  const frp = Math.round(isInd ? Math.random() * 110 + 30 : Math.random() * 55 + 5);

  return {
    latitude: +(hub.lat + (Math.random() - 0.5) * spread).toFixed(4),
    longitude: +(hub.lng + (Math.random() - 0.5) * spread).toFixed(4),
    frp: frp,
    brightness: Math.round(Math.random() * 50 + 315),
    satellite: i % 2 === 0 ? "VIIRS_NOAA20_NRT" : "MODIS_NRT",
    classification: hub.type,
    nearest_facility: isInd ? hub.name : "None (Wildfire/Open Area)",
    distance_to_facility_km: isInd ? +(Math.random() * 5 + 0.2).toFixed(2) : +(Math.random() * 60 + 20).toFixed(2),
    is_anomaly: frp > 75,
    threat_level: frp > 85 ? "CRITICAL" : frp > 45 ? "HIGH" : "NORMAL",
    acq_date: new Date().toISOString().split("T")[0],
    acq_time: "12:00 UTC"
  };
});

export default function App() {
  const [data, setData] = useState(INITIAL_FALLBACK);
  const [activeTheme, setActiveTheme] = useState("esriDark");
  const [pulse, setPulse] = useState(true);
  const [days, setDays] = useState(5);
  const [source, setSource] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [hudVisible, setHudVisible] = useState(true);
  const [statusText, setStatusText] = useState("CONNECTED");

  useEffect(() => {
    setStatusText("SYNCING...");
    fetch(`${API_BASE}/hotspots?days=${days}&source=${source}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.hotspots && json.hotspots.length > 0) {
          setData(json.hotspots);
        }
        setStatusText("CONNECTED");
      })
      .catch((err) => {
        console.warn("Backend offline/sleeping, running local telemetry", err);
        setStatusText("LOCAL FEED");
      });
  }, [days, source]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (source !== "ALL" && item.satellite !== source) return false;
      if (filterType === "CRITICAL") return item.threat_level === "CRITICAL" || item.is_anomaly;
      if (filterType === "INDUSTRIAL") return item.classification === "Industrial / Operational";
      if (filterType === "WILDFIRE") return item.classification === "Wildfire / Vegetation";
      return true;
    });
  }, [data, filterType, source]);

  const strategicCount = useMemo(() => {
    return data.filter((d) => d.nearest_facility && d.nearest_facility !== "None (Wildfire/Open Area)").length;
  }, [data]);

  const getColor = (item) => {
    if (item.threat_level === "CRITICAL" || item.frp > 80) return "#ef4444";
    if (item.classification === "Industrial / Operational") return "#06b6d4";
    if (item.threat_level === "HIGH") return "#f97316";
    return "#eab308";
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", backgroundColor: "#020617", fontFamily: "Segoe UI, sans-serif", color: "#f8fafc" }}>
      
      {/* Top Floating Dashboard Bar */}
      <header style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 1100, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, pointerEvents: "none" }}>
        
        {/* Left Brand Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(10px)", border: "1px solid rgba(6, 182, 212, 0.4)", borderRadius: 10, padding: "6px 12px", pointerEvents: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.7)" }}>
          <button
            onClick={() => setHudVisible(!hudVisible)}
            style={{ fontSize: 10, fontWeight: 800, padding: "4px 8px", background: "rgba(8, 51, 68, 0.8)", border: "1px solid rgba(6, 182, 212, 0.6)", color: "#67e8f9", borderRadius: 4, cursor: "pointer" }}
          >
            {hudVisible ? "HIDE HUD" : "SHOW HUD"}
          </button>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22d3ee", display: "inline-block", boxShadow: "0 0 8px #22d3ee" }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, color: "#f8fafc" }}>
            INDUSTRIAL FIRE & ANOMALY GIS
          </span>
          <span style={{ fontSize: 9, background: "rgba(6, 182, 212, 0.2)", color: "#22d3ee", border: "1px solid rgba(6, 182, 212, 0.4)", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
            LIVE
          </span>
        </div>

        {/* Right Status Counters */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(10px)", border: "1px solid #334155", borderRadius: 10, padding: "6px 14px", pointerEvents: "auto", fontSize: 11, fontFamily: "monospace", boxShadow: "0 8px 24px rgba(0,0,0,0.7)" }}>
          <div>
            <span style={{ color: "#94a3b8" }}>STRATEGIC:</span>{" "}
            <span style={{ color: "#22d3ee", fontWeight: 800 }}>{strategicCount}</span>
          </div>
          <span style={{ color: "#475569" }}>|</span>
          <div>
            <span style={{ color: "#94a3b8" }}>ACTIVE:</span>{" "}
            <span style={{ color: "#fb7185", fontWeight: 800 }}>{filteredData.length}</span>
          </div>
          <span style={{ color: "#475569" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusText === "CONNECTED" ? "#34d399" : "#fbbf24", display: "inline-block" }} />
            <span style={{ color: statusText === "CONNECTED" ? "#34d399" : "#fbbf24", fontWeight: 700 }}>{statusText}</span>
          </div>
        </div>
      </header>

      {/* Left Control Panel HUD */}
      {hudVisible && (
        <aside style={{ position: "absolute", top: 68, left: 12, zIndex: 1100, width: 280, background: "rgba(15, 23, 42, 0.93)", backdropFilter: "blur(14px)", border: "1px solid rgba(51, 65, 85, 0.85)", borderRadius: 12, padding: 14, boxShadow: "0 20px 45px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", gap: 12, maxHeight: "calc(100vh - 85px)", overflowY: "auto" }}>
          
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
              GIS BASE THEME
            </label>
            <select
              value={activeTheme}
              onChange={(e) => setActiveTheme(e.target.value)}
              style={{ width: "100%", background: "#020617", border: "1px solid #475569", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#f1f5f9", outline: "none", cursor: "pointer" }}
            >
              {Object.entries(MAP_THEMES).map(([key, t]) => (
                <option key={key} value={key}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
              HOLOGRAPHIC OPTICS
            </label>
            <button
              onClick={() => setPulse(!pulse)}
              style={{ width: "100%", padding: "6px 10px", fontSize: 11, fontWeight: 700, borderRadius: 6, border: pulse ? "1px solid #06b6d4" : "1px solid #334155", background: pulse ? "rgba(6, 182, 212, 0.2)" : "#020617", color: pulse ? "#67e8f9" : "#94a3b8", cursor: "pointer" }}
            >
              Hologram Pulse: {pulse ? "ON" : "OFF"}
            </button>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
              SATELLITE SENSOR
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{ width: "100%", background: "#020617", border: "1px solid #475569", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#f1f5f9", outline: "none", cursor: "pointer" }}
            >
              <option value="ALL">All Satellites (Merged)</option>
              <option value="VIIRS_NOAA20_NRT">VIIRS NOAA-20 (375m High-Res)</option>
              <option value="MODIS_NRT">MODIS Terra/Aqua (1km Thermal)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
              ORBIT TIME WINDOW
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {[1, 3, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  style={{ padding: "6px 0", fontSize: 11, fontWeight: 700, borderRadius: 6, border: days === d ? "1px solid #f59e0b" : "1px solid #1e293b", background: days === d ? "rgba(245, 158, 11, 0.25)" : "#020617", color: days === d ? "#fcd34d" : "#94a3b8", cursor: "pointer" }}
                >
                  {d === 1 ? "24 Hours" : `${d} Days`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
              ANOMALY TYPE FILTERS
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { id: "ALL", label: "ALL" },
                { id: "CRITICAL", label: "CRITICAL" },
                { id: "INDUSTRIAL", label: "INDUSTRIAL" },
                { id: "WILDFIRE", label: "WILDFIRE" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  style={{ padding: "6px 0", fontSize: 10, fontWeight: 800, borderRadius: 6, border: filterType === f.id ? "1px solid #3b82f6" : "1px solid #1e293b", background: filterType === f.id ? "#2563eb" : "#020617", color: filterType === f.id ? "#ffffff" : "#94a3b8", cursor: "pointer" }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: 6, borderTop: "1px solid #1e293b", fontSize: 10, display: "flex", flexDirection: "column", gap: 5, color: "#94a3b8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
              <span>Extreme Threat Spike (FRP &gt; 80MW)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4" }} />
              <span>Industrial Flare Zone</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316" }} />
              <span>High Intensity Vegetation Fire</span>
            </div>
          </div>
        </aside>
      )}

      {/* Main Map */}
      <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, zIndex: 1 }}>
        <MapContainer
          center={[22.0, 79.0]}
          zoom={5}
          zoomControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            key={activeTheme}
            url={MAP_THEMES[activeTheme].base}
            attribution={MAP_THEMES[activeTheme].attrib}
            maxZoom={19}
          />
          {MAP_THEMES[activeTheme].labels && (
            <TileLayer
              key={`${activeTheme}-labels`}
              url={MAP_THEMES[activeTheme].labels}
              attribution=""
              maxZoom={19}
            />
          )}

          {filteredData.map((item, idx) => {
            const color = getColor(item);
            return (
              <CircleMarker
                key={`${item.latitude}-${item.longitude}-${idx}`}
                center={[item.latitude, item.longitude]}
                radius={item.is_anomaly ? 7 : 4}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: pulse ? 0.9 : 0.65,
                  weight: item.is_anomaly ? 2 : 1
                }}
              >
                <Popup>
                  <div style={{ color: "#0f172a", fontSize: 12, lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 800, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 4 }}>
                      {item.classification}
                    </div>
                    <div><strong>Facility:</strong> {item.nearest_facility}</div>
                    <div><strong>Distance:</strong> {item.distance_to_facility_km} km</div>
                    <div><strong>FRP:</strong> {item.frp} MW</div>
                    <div><strong>Brightness:</strong> {item.brightness} K</div>
                    <div><strong>Sensor:</strong> {item.satellite}</div>
                    <div><strong>Acquired:</strong> {item.acq_date} {item.acq_time}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

    </div>
  );
}
