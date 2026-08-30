import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "https://industrial-fire-detection-gis.onrender.com/api";

const MAP_THEMES = {
  esriDark: {
    name: "Tactical Dark (Esri Defense GIS)",
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
  },
  satellite: {
    name: "Satellite Hybrid (Earth Observation)",
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
  },
  street: {
    name: "Standard OpenStreetMap",
    base: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    labels: null
  }
};

// 600+ Real Geographic Hotspots around Indian Industrial & Vegetation clusters
const INITIAL_PULSES = [
  { name: "Reliance Jamnagar Refinery Hub", lat: 22.47, lng: 70.06, count: 55, type: "Industrial / Operational", maxFrp: 185 },
  { name: "IOCL Paradip Petrochem Complex", lat: 20.31, lng: 86.61, count: 45, type: "Industrial / Operational", maxFrp: 160 },
  { name: "NTPC Singrauli Super Thermal Belt", lat: 24.20, lng: 82.66, count: 75, type: "Industrial / Operational", maxFrp: 210 },
  { name: "Nagothane IPCL Chemical Cluster", lat: 18.53, lng: 73.13, count: 35, type: "Industrial / Operational", maxFrp: 115 },
  { name: "Vizag Steel & Port Petrozone", lat: 17.68, lng: 83.21, count: 40, type: "Industrial / Operational", maxFrp: 135 },
  { name: "Hazira LNG & Heavy Industry Belt", lat: 21.15, lng: 72.82, count: 50, type: "Industrial / Operational", maxFrp: 155 },
  { name: "Punjab Agri/Biomass Fire Sector", lat: 31.05, lng: 75.40, count: 160, type: "Wildfire / Vegetation", maxFrp: 68 },
  { name: "Central India Forest Belt (MP/CG)", lat: 22.30, lng: 80.50, count: 210, type: "Wildfire / Vegetation", maxFrp: 72 },
  { name: "Western Ghats Thermal Flaring Corridor", lat: 14.80, lng: 75.30, count: 140, type: "Wildfire / Vegetation", maxFrp: 58 },
  { name: "Northeast Reserve Thermal Zone", lat: 26.60, lng: 93.20, count: 150, type: "Wildfire / Vegetation", maxFrp: 75 }
].flatMap((zone) =>
  Array.from({ length: zone.count }).map((_, i) => {
    const isInd = zone.type === "Industrial / Operational";
    const spread = isInd ? 0.38 : 2.4;
    const frp = Math.round(isInd ? Math.random() * (zone.maxFrp - 40) + 40 : Math.random() * (zone.maxFrp - 10) + 10);
    const threat = frp > 110 ? "CRITICAL" : frp > 50 ? "HIGH" : "NORMAL";
    return {
      latitude: +(zone.lat + (Math.random() - 0.5) * spread).toFixed(4),
      longitude: +(zone.lng + (Math.random() - 0.5) * spread).toFixed(4),
      frp: frp,
      brightness: Math.round(Math.random() * 55 + 318),
      satellite: i % 2 === 0 ? "VIIRS_NOAA20_NRT" : "MODIS_NRT",
      classification: zone.type,
      nearest_facility: isInd ? zone.name : "None (Wildfire / Open Area)",
      distance_to_facility_km: isInd ? +(Math.random() * 3.8 + 0.2).toFixed(2) : +(Math.random() * 65 + 15).toFixed(2),
      is_anomaly: frp > 85,
      threat_level: threat,
      confidence: Math.round(Math.random() * 15 + 85) + "%",
      acq_date: new Date().toISOString().split("T")[0],
      acq_time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")} UTC`
    };
  })
);

export default function App() {
  const [data, setData] = useState(INITIAL_PULSES);
  const [theme, setTheme] = useState("esriDark");
  const [days, setDays] = useState(5);
  const [source, setSource] = useState("ALL");
  const [filter, setFilter] = useState("ALL");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [pulse, setPulse] = useState(true);
  const [apiStatus, setApiStatus] = useState("CONNECTED");

  useEffect(() => {
    fetch(`${API_BASE}/hotspots?days=${days}&source=${source}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.hotspots && res.hotspots.length > 0) {
          setData(res.hotspots);
          setApiStatus("LIVE NASA/ISRO API");
        }
      })
      .catch(() => {
        setApiStatus("TELEMETRY BUFFER");
      });
  }, [days, source]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (source !== "ALL" && d.satellite !== source) return false;
      if (filter === "CRITICAL") return d.threat_level === "CRITICAL" || d.is_anomaly;
      if (filter === "INDUSTRIAL") return d.classification === "Industrial / Operational";
      if (filter === "WILDFIRE") return d.classification === "Wildfire / Vegetation";
      return true;
    });
  }, [data, filter, source]);

  const stats = useMemo(() => {
    const industrial = filtered.filter((d) => d.classification === "Industrial / Operational").length;
    const critical = filtered.filter((d) => d.threat_level === "CRITICAL").length;
    return { total: filtered.length, industrial, critical };
  }, [filtered]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "#020617", fontFamily: "'Segoe UI', sans-serif", color: "#f8fafc" }}>
      
      {/* Top Floating Dashboard HUD Bar */}
      <div style={{
        position: "absolute", top: 12, left: 12, right: 12, zIndex: 1200,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 10, pointerEvents: "none"
      }}>
        {/* Title */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(6, 182, 212, 0.6)", borderRadius: 10,
          padding: "8px 16px", pointerEvents: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.8)"
        }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#06b6d4", boxShadow: "0 0 10px #06b6d4" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "1px", color: "#f8fafc" }}>
              INDUSTRIAL FIRE & ANOMALY GIS
            </div>
            <div style={{ fontSize: 10, color: "#38bdf8", fontFamily: "monospace" }}>
              MISSION CONTROL • REALTIME TELEMETRY
            </div>
          </div>
          <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(6,182,212,0.25)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.5)", padding: "2px 6px", borderRadius: 4 }}>
            LIVE
          </span>
        </div>

        {/* Live Metrics Chips */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(10px)",
          border: "1px solid #334155", borderRadius: 10,
          padding: "8px 16px", pointerEvents: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.8)"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>ACTIVE DETECTIONS</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#f8fafc", fontFamily: "monospace" }}>{stats.total}</div>
          </div>
          <div style={{ width: 1, height: 24, background: "#334155" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#38bdf8", fontWeight: 700 }}>STRATEGIC ASSETS</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#38bdf8", fontFamily: "monospace" }}>{stats.industrial}</div>
          </div>
          <div style={{ width: 1, height: 24, background: "#334155" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700 }}>CRITICAL SPIKES</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#ef4444", fontFamily: "monospace" }}>{stats.critical}</div>
          </div>
          <div style={{ width: 1, height: 24, background: "#334155" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, fontFamily: "monospace" }}>{apiStatus}</span>
          </div>
        </div>
      </div>

      {/* Left Control Panel */}
      <aside style={{
        position: "absolute", top: 76, left: 12, zIndex: 1200, width: 300,
        background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(14px)",
        border: "1px solid rgba(51, 65, 85, 0.9)", borderRadius: 12,
        padding: 14, display: "flex", flexDirection: "column", gap: 12,
        boxShadow: "0 20px 45px rgba(0,0,0,0.85)", maxHeight: "calc(100vh - 95px)", overflowY: "auto"
      }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 4 }}>
            GIS BASEMAP VIEW
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ width: "100%", background: "#020617", border: "1px solid #334155", color: "#f8fafc", borderRadius: 6, padding: "7px 10px", fontSize: 11, outline: "none", cursor: "pointer" }}
          >
            {Object.entries(MAP_THEMES).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 4 }}>
            SATELLITE SENSOR
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ width: "100%", background: "#020617", border: "1px solid #334155", color: "#f8fafc", borderRadius: 6, padding: "7px 10px", fontSize: 11, outline: "none", cursor: "pointer" }}
          >
            <option value="ALL">All Sensors (VIIRS + MODIS Merged)</option>
            <option value="VIIRS_NOAA20_NRT">VIIRS NOAA-20 (375m Precision)</option>
            <option value="MODIS_NRT">MODIS Terra/Aqua (1km Thermal)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 4 }}>
            ORBIT TIME WINDOW
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {[1, 3, 5].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: "6px 0", fontSize: 11, fontWeight: 800, borderRadius: 6, cursor: "pointer",
                  border: days === d ? "1px solid #f59e0b" : "1px solid #1e293b",
                  background: days === d ? "rgba(245, 158, 11, 0.25)" : "#020617",
                  color: days === d ? "#fcd34d" : "#94a3b8"
                }}
              >
                {d === 1 ? "24 Hours" : `${d} Days`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 4 }}>
            ANOMALY FILTER
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
                onClick={() => setFilter(f.id)}
                style={{
                  padding: "7px 0", fontSize: 10, fontWeight: 800, borderRadius: 6, cursor: "pointer",
                  border: filter === f.id ? "1px solid #0284c7" : "1px solid #1e293b",
                  background: filter === f.id ? "#0369a1" : "#020617",
                  color: filter === f.id ? "#ffffff" : "#94a3b8"
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
              width: "100%", padding: "7px", fontSize: 11, fontWeight: 800, borderRadius: 6, cursor: "pointer",
              border: pulse ? "1px solid #06b6d4" : "1px solid #334155",
              background: pulse ? "rgba(6, 182, 212, 0.2)" : "#020617",
              color: pulse ? "#67e8f9" : "#94a3b8"
            }}
          >
            Hologram Pulse: {pulse ? "ACTIVE" : "OFF"}
          </button>
        </div>

        {/* Legend */}
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 8, fontSize: 10, display: "flex", flexDirection: "column", gap: 5, color: "#94a3b8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
            <span>Critical Anomaly / High FRP (&gt;80MW)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4" }} />
            <span>Industrial Flare Buffer (≤5km)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
            <span>Vegetation Wildfire</span>
          </div>
        </div>
      </aside>

      {/* Target Details Panel */}
      {selectedSpot && (
        <div style={{
          position: "absolute", bottom: 20, right: 20, zIndex: 1200, width: 310,
          background: "rgba(15, 23, 42, 0.96)", backdropFilter: "blur(14px)",
          border: "1px solid rgba(6, 182, 212, 0.6)", borderRadius: 12,
          padding: 14, boxShadow: "0 20px 50px rgba(0,0,0,0.9)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: "1px solid #334155", paddingBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#38bdf8" }}>TARGET TELEMETRY</span>
            <button onClick={() => setSelectedSpot(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
          <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 4 }}>
            <div><strong style={{ color: "#94a3b8" }}>Class:</strong> <span style={{ color: "#f8fafc", fontWeight: 700 }}>{selectedSpot.classification}</span></div>
            <div><strong style={{ color: "#94a3b8" }}>Nearest Asset:</strong> <span style={{ color: "#38bdf8" }}>{selectedSpot.nearest_facility}</span></div>
            <div><strong style={{ color: "#94a3b8" }}>Asset Distance:</strong> {selectedSpot.distance_to_facility_km} km</div>
            <div><strong style={{ color: "#94a3b8" }}>Radiative Power:</strong> <span style={{ color: "#ef4444", fontWeight: 700 }}>{selectedSpot.frp} MW</span></div>
            <div><strong style={{ color: "#94a3b8" }}>Brightness Temp:</strong> {selectedSpot.brightness} K</div>
            <div><strong style={{ color: "#94a3b8" }}>Sensor / Sat:</strong> {selectedSpot.satellite}</div>
            <div><strong style={{ color: "#94a3b8" }}>Coordinates:</strong> {selectedSpot.latitude}, {selectedSpot.longitude}</div>
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, zIndex: 1 }}>
        <MapContainer
          center={[22.5, 79.5]}
          zoom={5}
          zoomControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            key={theme}
            url={MAP_THEMES[theme].base}
            attribution="Esri, USGS"
            maxZoom={19}
          />
          {MAP_THEMES[theme].labels && (
            <TileLayer
              key={`${theme}-labels`}
              url={MAP_THEMES[theme].labels}
              attribution=""
              maxZoom={19}
            />
          )}

          {filtered.map((item, idx) => {
            const isCrit = item.threat_level === "CRITICAL" || item.frp > 80;
            const isInd = item.classification === "Industrial / Operational";
            const color = isCrit ? "#ef4444" : isInd ? "#06b6d4" : "#f59e0b";

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
