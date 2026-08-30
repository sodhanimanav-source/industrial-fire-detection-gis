def classify_hotspot(is_near_facility: bool, is_historical: bool, land_cover: str) -> str:
    # 1. Industrial Anomaly / Explosion check
    if is_near_facility and not is_historical:
        return "Industrial Anomaly / Possible Accident"
    
    # 2. Routine Flaring / Persistent Process Heat
    elif is_near_facility and is_historical:
        return "Persistent Industrial Source"
    
    # 3. Agricultural / Crop Residue Burning
    elif land_cover == "cropland":
        return "Agricultural Burning"
    
    # 4. Forest / Wildfire
    elif land_cover in ["forest", "shrubland"]:
        return "Wildfire / Forest Fire"
    
    return "Unclassified Hotspot"