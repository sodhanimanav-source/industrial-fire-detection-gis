import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

const API_BASE = "https://industrial-fire-detection-gis.onrender.com/api";

const MAP_THEMES = {
  esriDark: {
    name: "Tactical Dark (Esri Precision)",
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
    name: "Standard Clean Street (OSM)",
    base: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    labels: null,
    attrib: "© OpenStreetMap contributors"
  }
};

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState("esriDark");
  const [pulse, setPulse] = useState(true);
  const [days, setDays] = useState(5);
  const [source, setSource] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [hudVisible, setHudVisible] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/hotspots?days=${days}&source=${source}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json.hotspots || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [days, source]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filterType === "CRITICAL") return item.threat_level === "CRITICAL" || item.is_anomaly;
      if (filterType === "INDUSTRIAL") return item.classification === "Industrial / Operational";
      if (filterType === "WILDFIRE") return item.classification === "Wildfire / Vegetation";
      return true;
    });
  }, [data, filterType]);

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
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#020617", fontFamily: "Segoe UI, -apple-system, Roboto, sans-serif", color: "#f8fafc" }}>
      
      {/* Top Header Bar */}
      <header style={{ position: "absolute", top: 14, left: 14, right: 14, zIndex: 1100, display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(15, 23, 42, 0.88)", backdropFilter: "blur(10px)", border: "1px solid rgba(6, 182, 212, 0.4)", borderRadius: 10, padding: "8px 14px", pointerEvents: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.7)" }}>
          <button
            onClick={() => setHudVisible(!hudVisible)}
            style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", background: "rgba(8, 51, 68, 0.8)", border: "1px solid rgba(6, 182, 212, 0.6)", color: "#67e8f9", borderRadius: 6, cursor: "pointer" }}
          >
            {hudVisible ? "HIDE HUD" : "SHOW HUD"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22d3ee", display: "inline-block", boxShadow: "0 0 10px #22d3ee" }} />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, color: "#f8fafc" }}>
              INDUSTRIAL FIRE & ANOMALY GIS
            </span>
            <span style={{ fontSize: 10, background: "rgba(6, 182, 212, 0.2)", color: "#22d3ee", border: "1px solid rgba(6, 182, 212, 0.4)", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>
              LIVE
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(15, 23, 42, 0.88)", backdropFilter: "blur(10px)", border: "1px solid #334155", borderRadius: 10, padding: "8px 16px", pointerEvents: "auto", fontSize: 12, fontFamily: "monospace", boxShadow: "0 10px 30px rgba(0,0,0,0.7)" }}>
          <div>
            <span style={{ color: "#94a3b8" }}>STRATEGIC SITES:</span>{" "}
            <span style={{ color: "#22d3ee", fontWeight: 700 }}>{strategicCount}</span>
          </div>
          <span style={{ color: "#475569" }}>|</span>
          <div>
            <span style={{ color: "#94a3b8" }}>ACTIVE DETECTIONS:</span>{" "}
            <span style={{ color: "#fb7185", fontWeight: 700 }}>{filteredData.length}</span>
          </div>
          <span style={{ color: "#475569" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
            <span style={{ color: "#34d399", fontWeight: 600 }}>CONNECTED</span>
          </div>
        </div>
      </header>

      {/* Control Sidebar HUD */}
      {hudVisible && (
        <aside style={{ position: "absolute", top: 75, left: 14, zIndex: 1100, width: 290, background: "rgba(15, 23, 42, 0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(51, 65, 85, 0.8)", borderRadius: 14, padding: 16, boxShadow: "0 20px 45px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", gap: 14, maxHeight: "82vh", overflowY: "auto" }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
              GIS BASE TILE THEME
            </label>
            <select
              value={activeTheme}
              onChange={(e) => setActiveTheme(e.target.value)}
              style={{ width: "100%", background: "#020617", border: "1px solid #475569", borderRadius: 6, padding: "7px 10px", fontSize: 12, color: "#f1f5f9", outline: "none", cursor: "pointer" }}
            >
              {Object.entries(MAP_THEMES).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
              HOLOGRAPHIC OPTICS
            </label>
            <button
              onClick={() => setPulse(!pulse)}
              style={{ width: "100%", padding: "7px 10px", fontSize: 11, fontWeight: 700, borderRadius: 6, border: pulse ? "1px solid #06b6d4" : "1px solid #334155", background: pulse ? "rgba(6, 182, 212, 0.2)" : "#020617", color: pulse ? "#67e8f9" : "#94a3b8", cursor: "pointer" }}
            >
              Hologram Pulse: {pulse ? "ON" : "OFF"}
            </button>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
              SATELLITE SOURCE
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{ width: "100%", background: "#020617", border: "1px solid #475569", borderRadius: 6, padding: "7px 10px", fontSize: 12, color: "#f1f5f9", outline: "none", cursor: "pointer" }}
            >
              <option value="ALL">All Satellites (Merged)</option>
              <option value="VIIRS_NOAA20_NRT">VIIRS NOAA-20 (High-Res 375m)</option>
              <option value="VIIRS_SNPP_NRT">Suomi-NPP (375m)</option>
              <option value="MODIS_NRT">MODIS Terra/Aqua (1km)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
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
            <label style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
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
                  style={{ padding: "7px 0", fontSize: 10, fontWeight: 800, borderRadius: 6, border: filterType === f.id ? "1px solid #3b82f6" : "1px solid #1e293b", background: filterType === f.id ? "#2563eb" : "#020617", color: filterType === f.id ? "#ffffff" : "#94a3b8", cursor: "pointer" }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: 8, borderTop: "1px solid #1e293b", fontSize: 11, display: "flex", flexDirection: "column", gap: 6, color: "#94a3b8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <span>Extreme Heat / Spike</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#06b6d4" }} />
              <span>Industrial Flaring</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316" }} />
              <span>High Intensity Anomaly</span>
            </div>
          </div>
        </aside>
      )}

      {/* Main Full-Screen Map Container */}
      <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, zIndex: 1 }}>
        <MapContainer
          center={[22.5, 78.9]}
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
                  fillOpacity: pulse ? 0.85 : 0.6,
                  weight: item.is_anomaly ? 2 : 1
                }}
              >
                <Popup>
                  <div style={{ color: "#0f172a", fontSize: 12, lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 800, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 4 }}>
                      {item.classification}
                    </div>
                    <div><strong>Nearest Asset:</strong> {item.nearest_facility}</div>
                    <div><strong>Distance:</strong> {item.distance_to_facility_km} km</div>
                    <div><strong>FRP (Intensity):</strong> {item.frp} MW</div>
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
