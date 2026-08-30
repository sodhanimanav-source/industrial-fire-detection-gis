import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "https://industrial-fire-detection-gis.onrender.com/api";

const MAP_THEMES = {
  esriDark: {
    name: "Tactical Dark (High Precision)",
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attrib: "Esri, HERE, Garmin, © OpenStreetMap contributors"
  },
  osm: {
    name: "Standard Clean Street",
    base: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    labels: null,
    attrib: "© OpenStreetMap contributors"
  },
  satellite: {
    name: "Esri Satellite Imagery",
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attrib: "Esri, Maxar, Earthstar Geographics"
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
  const [selectedSpot, setSelectedSpot] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/hotspots?days=${days}&source=${source}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json.hotspots || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
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
    return data.filter((d) => d.nearest_facility !== "None (Wildfire/Open Area)").length;
  }, [data]);

  const getColor = (item) => {
    if (item.threat_level === "CRITICAL" || item.frp > 80) return "#ef4444";
    if (item.classification === "Industrial / Operational") return "#06b6d4";
    if (item.threat_level === "HIGH") return "#f97316";
    return "#eab308";
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* HUD Top Bar */}
      <header className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 rounded-xl px-4 py-2 pointer-events-auto shadow-2xl">
          <button
            onClick={() => setHudVisible(!hudVisible)}
            className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-300 rounded"
          >
            {hudVisible ? "Hide HUD" : "Show HUD"}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-sm font-bold tracking-wider text-slate-100">
              INDUSTRIAL FIRE & ANOMALY GIS
            </h1>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono">
              LIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 pointer-events-auto shadow-2xl text-xs font-mono">
          <div>
            <span className="text-slate-400">STRATEGIC SITES:</span>{" "}
            <span className="text-cyan-400 font-bold">{strategicCount}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-slate-400">ACTIVE DETECTIONS:</span>{" "}
            <span className="text-rose-400 font-bold">{filteredData.length}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-medium">CONNECTED</span>
          </div>
        </div>
      </header>

      {/* Control Panel */}
      {hudVisible && (
        <aside className="absolute top-20 left-4 z-[1000] w-80 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Base Map Theme */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              GIS Base Tile Theme
            </label>
            <select
              value={activeTheme}
              onChange={(e) => setActiveTheme(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              {Object.entries(MAP_THEMES).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Optics Pulse */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Holographic Optics
            </label>
            <button
              onClick={() => setPulse(!pulse)}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                pulse
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "bg-slate-950 border-slate-700 text-slate-400"
              }`}
            >
              Hologram Pulse: {pulse ? "ON" : "OFF"}
            </button>
          </div>

          {/* Satellite Source */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Satellite Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Satellites (Merged)</option>
              <option value="VIIRS_NOAA20_NRT">VIIRS NOAA-20 (High-Res 375m)</option>
              <option value="VIIRS_SNPP_NRT">Suomi-NPP (375m)</option>
              <option value="MODIS_NRT">MODIS Terra/Aqua (1km)</option>
            </select>
          </div>

          {/* Time Window */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Orbit Time Window
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border ${
                    days === d
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {d === 1 ? "24 Hours" : `${d} Days`}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Anomaly Type Filters
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "ALL", label: "ALL" },
                { id: "CRITICAL", label: "CRITICAL" },
                { id: "INDUSTRIAL", label: "INDUSTRIAL" },
                { id: "WILDFIRE", label: "WILDFIRE" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg border ${
                    filterType === f.id
                      ? "bg-blue-600 border-blue-400 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1.5 text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Extreme Heat / Threat Spike</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Industrial Flaring / Asset Buffer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>High Intensity Anomaly</span>
            </div>
          </div>
        </aside>
      )}

      {/* Main Map */}
      <MapContainer
        center={[22.5, 78.9]}
        zoom={5}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url={MAP_THEMES[activeTheme].base}
          attribution={MAP_THEMES[activeTheme].attrib}
          maxZoom={19}
        />
        {MAP_THEMES[activeTheme].labels && (
          <TileLayer
            url={MAP_THEMES[activeTheme].labels}
            attribution=""
            maxZoom={19}
            pane="shadowPane"
          />
        )}

        {filteredData.map((item, idx) => {
          const color = getColor(item);
          return (
            <CircleMarker
              key={`${item.latitude}-${item.longitude}-${idx}`}
              center={[item.latitude, item.longitude]}
              radius={item.is_anomaly ? 8 : 5}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: pulse ? 0.8 : 0.6,
                weight: item.is_anomaly ? 2 : 1
              }}
              eventHandlers={{
                click: () => setSelectedSpot(item)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 text-slate-900 font-sans text-xs space-y-1">
                  <div className="font-bold text-slate-950 border-b pb-1">
                    {item.classification}
                  </div>
                  <div><strong>Nearest Asset:</strong> {item.nearest_facility}</div>
                  <div><strong>Distance:</strong> {item.distance_to_facility_km} km</div>
                  <div><strong>FRP (Intensity):</strong> {item.frp} MW</div>
                  <div><strong>Brightness:</strong> {item.brightness} K</div>
                  <div><strong>Sensor:</strong> {item.satellite}</div>
                  <div><strong>Timestamp:</strong> {item.acq_date} {item.acq_time}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
