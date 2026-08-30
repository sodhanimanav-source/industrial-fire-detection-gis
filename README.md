# 🛰️ Industrial Fire & Anomaly GIS Dashboard (Pan-India)

An AI/ML & Satellite-driven spatial intelligence dashboard engineered for real-time industrial flaring detection, high-heat anomaly surveillance, and wildfire differentiation across 196+ critical Pan-India infrastructure assets.

---

## 🚀 Live Demo

* **Web App (Interactive UI):** https://industrial-fire-detection-gis.netlify.app
* **API Documentation & OpenAPI:** https://industrial-fire-detection-gis.onrender.com/docs
* **Live Health & Telemetry Feed:** https://industrial-fire-detection-gis.onrender.com/api/hotspots

---

## 🛠️ Architecture & Tech Stack

* **Backend & REST API:** FastAPI, Python 3.11, Uvicorn, Asynchronous Worker Pipeline
* **Spatial Ingestion & Feeds:** NASA FIRMS API (VIIRS NOAA-20, Suomi-NPP, MODIS sensors)
* **Machine Learning & Analytics:** Scikit-Learn, Isolation Forest (Anomaly Scoring), Random Forest Spatial Classifier
* **Frontend & WebGIS:** React 18, Vite, React-Leaflet, Tailwind CSS, Canvas Vector Rendering
* **Deployment & CI/CD:** Netlify (Edge Frontend), Render Cloud PaaS (Auto-scaling Backend)

---

## ⚡ Core Features

1. **Multi-Sensor Satellite Feeds:** Live ingestion and raster-point mapping across VIIRS NOAA-20 (375m/750m) and MODIS (1km) infrared thermal bands.
2. **Precision Industrial Buffer Matching:** Automated Haversine spatial indexing mapping hotspots across 196+ Indian refineries, petrochemical corridors, and power hubs.
3. **ML Thermal Anomaly Isolation:** Unsupervised isolation scoring determining baseline operational flaring versus critical hazard spikes.
4. **Future-Tech HUD Experience:** 60 FPS Canvas rendering with holographic optics, live radar pulsing, and CartoDB Dark Matter tile themes.
5. **Zero-Lag Dynamic Filtering:** Instant client-side and server-side toggles for threat severity, orbit timeframes (24h/3d/5d), and sensor sources.