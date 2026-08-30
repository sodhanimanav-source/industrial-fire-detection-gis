import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
import joblib
import os

MODEL_DIR = os.path.dirname(__file__)

def generate_synthetic_training_data(n_samples=2500):
    """
    Generates realistic historical satellite training data across Indian industrial & natural zones.
    Features: [frp, brightness, distance_to_facility, hour]
    """
    np.random.seed(42)
    
    # 1. Routine Industrial Flaring (Close to plant, moderate FRP, controlled brightness)
    n_ind = int(n_samples * 0.4)
    ind_frp = np.random.normal(35, 12, n_ind).clip(5, 75)
    ind_bright = np.random.normal(325, 10, n_ind).clip(300, 360)
    ind_dist = np.random.uniform(0.1, 4.0, n_ind)
    ind_hour = np.random.randint(0, 24, n_ind)
    labels_ind = ["ROUTINE_INDUSTRIAL"] * n_ind

    # 2. Industrial Flare Spike / Thermal Hazard (Close to plant, abnormal FRP/Brightness)
    n_anom = int(n_samples * 0.1)
    anom_frp = np.random.normal(110, 30, n_anom).clip(80, 250)
    anom_bright = np.random.normal(380, 15, n_anom).clip(365, 450)
    anom_dist = np.random.uniform(0.1, 3.5, n_anom)
    anom_hour = np.random.randint(0, 24, n_anom)
    labels_anom = ["INDUSTRIAL_ANOMALY"] * n_anom

    # 3. Forest & Wildfires (Far from plant, high brightness & variable FRP)
    n_wild = int(n_samples * 0.25)
    wild_frp = np.random.normal(55, 25, n_wild).clip(15, 180)
    wild_bright = np.random.normal(345, 18, n_wild).clip(315, 410)
    wild_dist = np.random.uniform(12.0, 80.0, n_wild)
    wild_hour = np.random.randint(0, 24, n_wild)
    labels_wild = ["WILDFIRE"] * n_wild

    # 4. Agricultural / Stubble Burning (Far from plant, low/moderate FRP, daytime peaks)
    n_agri = n_samples - (n_ind + n_anom + n_wild)
    agri_frp = np.random.normal(12, 5, n_agri).clip(2, 28)
    agri_bright = np.random.normal(312, 6, n_agri).clip(300, 330)
    agri_dist = np.random.uniform(8.0, 60.0, n_agri)
    agri_hour = np.random.randint(10, 18, n_agri)
    labels_agri = ["AGRICULTURAL_BURNING"] * n_agri

    X = np.vstack([
        np.column_stack([ind_frp, ind_bright, ind_dist, ind_hour]),
        np.column_stack([anom_frp, anom_bright, anom_dist, anom_hour]),
        np.column_stack([wild_frp, wild_bright, wild_dist, wild_hour]),
        np.column_stack([agri_frp, agri_bright, agri_dist, agri_hour])
    ])
    
    y = labels_ind + labels_anom + labels_wild + labels_agri
    return X, y

def train_and_save_pipeline():
    print("[AI PIPELINE] Training machine learning models...")
    X, y = generate_synthetic_training_data()

    # Model 1: Random Forest Classifier (Multi-class classification)
    clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    clf.fit(X, y)

    # Model 2: Isolation Forest (Zero-day Anomaly / Flare Outlier Detection)
    iso = IsolationForest(contamination=0.08, random_state=42)
    iso.fit(X)

    # Save trained models
    joblib.dump(clf, os.path.join(MODEL_DIR, "fire_classifier_rf.pkl"))
    joblib.dump(iso, os.path.join(MODEL_DIR, "anomaly_detector_iso.pkl"))
    print("[AI PIPELINE] ✅ Models trained and saved successfully to models/")

if __name__ == "__main__":
    train_and_save_pipeline()