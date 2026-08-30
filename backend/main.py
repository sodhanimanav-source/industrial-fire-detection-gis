import os
import json
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from ingestion.firms_fetcher import fetch_firms_hotspots
from models.classifier import classify_hotspots

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FACILITIES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "facilities.json")

def load_facilities():
    if os.path.exists(FACILITIES_PATH):
        try:
            with open(FACILITIES_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

@app.get("/api/facilities")
def get_facilities():
    facs = load_facilities()
    return {"status": "success", "count": len(facs), "facilities": facs}

@app.get("/api/hotspots")
def get_hotspots(days: int = Query(5), sensor: str = Query("ALL")):
    try:
        df = fetch_firms_hotspots(day_range=days, sensor_choice=sensor)
        results = classify_hotspots(df)
        return {"status": "success", "count": len(results), "hotspots": results}
    except Exception as e:
        print(f"[ERROR]: {e}")
        return {"status": "error", "count": 0, "hotspots": []}

@app.get("/api/health")
def health():
    return {"status": "online"}