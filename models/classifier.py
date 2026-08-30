import math
import os
import json
import joblib
import numpy as np

FACILITIES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "facilities.json")
RF_MODEL_PATH = os.path.join(os.path.dirname(__file__), "fire_classifier_rf.pkl")
ISO_MODEL_PATH = os.path.join(os.path.dirname(__file__), "anomaly_detector_iso.pkl")

# Load pre-trained models if present
rf_model = joblib.load(RF_MODEL_PATH) if os.path.exists(RF_MODEL_PATH) else None
iso_model = joblib.load(ISO_MODEL_PATH) if os.path.exists(ISO_MODEL_PATH) else None

def load_facilities():
    if os.path.exists(FACILITIES_PATH):
        try:
            with open(FACILITIES_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0  # KM
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def safe_float(val, default=0.0):
    try:
        if val is None or str(val).strip() == "" or str(val).lower() == "nan":
            return default
        num = float(val)
        return num if not math.isnan(num) else default
    except Exception:
        return default

def classify_hotspots(df):
    if df is None or df.empty:
        return []

    facilities = load_facilities()
    classified_data = []

    for _, row in df.iterrows():
        try:
            lat = safe_float(row.get("latitude", row.get("lat")))
            lng = safe_float(row.get("longitude", row.get("lon", row.get("lng"))))
            if lat == 0.0 or lng == 0.0:
                continue

            frp = safe_float(row.get("frp"), default=5.0)
            
            # Brightness extraction
            brightness = safe_float(row.get("bright_ti4"))
            if brightness <= 0.0:
                brightness = safe_float(row.get("bright_ti5", row.get("brightness", 310.0)))
            if brightness <= 0.0:
                brightness = 310.0

            acq_date = str(row.get("acq_date", "N/A"))
            acq_time = str(row.get("acq_time", "0000"))
            hour = int(acq_time[:2]) if len(acq_time) >= 2 and acq_time[:2].isdigit() else 12

            # Spatial Enrichment: Find closest facility
            matched_fac = None
            min_dist = float("inf")

            for fac in facilities:
                fac_lat = safe_float(fac.get("lat"))
                fac_lng = safe_float(fac.get("lng"))
                if fac_lat == 0.0 or fac_lng == 0.0:
                    continue

                dist = haversine_distance(lat, lng, fac_lat, fac_lng)
                if dist < min_dist:
                    min_dist = dist
                    matched_fac = fac

            # AI Feature Vector: [FRP, Brightness, Distance_to_Plant, Hour]
            feature_vector = np.array([[frp, brightness, min_dist, hour]])

            # Step 1: Isolation Forest Outlier Score
            is_outlier = False
            if iso_model:
                is_outlier = (iso_model.predict(feature_vector)[0] == -1)

            # Step 2: Random Forest Classification & Confidence Score
            if rf_model:
                predicted_class = rf_model.predict(feature_vector)[0]
                confidence = float(np.max(rf_model.predict_proba(feature_vector))) * 100
            else:
                # Rule fallback
                predicted_class = "INDUSTRIAL_ANOMALY" if min_dist <= 4.5 and frp > 60.0 else "WILDFIRE"
                confidence = 85.0

            # Step 3: Human-Readable Formatting
            if predicted_class == "INDUSTRIAL_ANOMALY" or (min_dist <= 4.5 and is_outlier):
                label = f"Industrial Flare Spike / Thermal Anomaly @ {matched_fac['name'] if matched_fac else 'Facility'}"
                severity = "CRITICAL"
                fac_name = matched_fac["name"] if matched_fac else "Industrial Site"
                fac_type = matched_fac.get("type", "Industrial") if matched_fac else "Plant"
            elif predicted_class == "ROUTINE_INDUSTRIAL" and min_dist <= 5.0:
                label = f"Routine Industrial Flare Operation @ {matched_fac['name']}"
                severity = "LOW"
                fac_name = matched_fac["name"]
                fac_type = matched_fac.get("type", "Industrial")
            elif predicted_class == "WILDFIRE":
                label = "Intense Wildfire / Forest Fire" if frp > 50.0 else "Wildfire / Vegetation Fire"
                severity = "CRITICAL" if frp > 75.0 else "MEDIUM"
                fac_name = None
                fac_type = "Open Terrain / Forest"
                min_dist = None
            else:
                label = "Low Intensity Crop / Surface Burning"
                severity = "LOW"
                fac_name = None
                fac_type = "Agricultural Land"
                min_dist = None

            classified_data.append({
                "lat": lat,
                "lng": lng,
                "frp": round(frp, 2),
                "brightness": round(brightness, 1),
                "label": label,
                "severity": severity,
                "facility_name": fac_name,
                "facility_type": fac_type,
                "distance_km": round(min_dist, 2) if min_dist else None,
                "confidence_score": f"{round(confidence, 1)}%",
                "date": acq_date,
                "time": acq_time
            })
        except Exception:
            continue

    return classified_data