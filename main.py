from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
from datetime import datetime

app = FastAPI(title='Industrial Fire & Anomaly GIS Telemetry Engine')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

def generate_continuous_telemetry():
    now = datetime.utcnow()
    date_str = now.strftime('%Y-%m-%d')
    points = []

    # Industrial Mega Assets
    industrial_nodes = [
        {'name': 'Reliance Jamnagar Complex', 'lat': 22.4707, 'lng': 70.0577, 'count': 55, 'maxFrp': 210},
        {'name': 'IOCL Paradip Petrochemical Hub', 'lat': 20.3164, 'lng': 86.6114, 'count': 48, 'maxFrp': 180},
        {'name': 'NTPC Singrauli Thermal Belt', 'lat': 24.1997, 'lng': 82.6644, 'count': 65, 'maxFrp': 230},
        {'name': 'Nagothane Chemical Cluster', 'lat': 18.5312, 'lng': 73.1311, 'count': 35, 'maxFrp': 140},
        {'name': 'Visakhapatnam Heavy Industry Zone', 'lat': 17.6868, 'lng': 83.2185, 'count': 42, 'maxFrp': 155},
        {'name': 'Hazira LNG Energy Complex', 'lat': 21.1523, 'lng': 72.8258, 'count': 50, 'maxFrp': 175},
        {'name': 'Chennai Manali Petrochemical Zone', 'lat': 13.1600, 'lng': 80.2600, 'count': 32, 'maxFrp': 135},
        {'name': 'BPCL Kochi Refinery Complex', 'lat': 9.9900, 'lng': 76.3600, 'count': 28, 'maxFrp': 125},
        {'name': 'Sapugaskanda Refinery Complex (Sri Lanka)', 'lat': 6.9654, 'lng': 79.9328, 'count': 36, 'maxFrp': 155},
        {'name': 'Norochcholai Power Complex (Sri Lanka)', 'lat': 8.0167, 'lng': 79.7214, 'count': 30, 'maxFrp': 165},
        {'name': 'Hambantota Energy Port (Sri Lanka)', 'lat': 6.1248, 'lng': 81.1185, 'count': 24, 'maxFrp': 120}
    ]

    for node in industrial_nodes:
        for i in range(node['count']):
            frp = round(random.uniform(45, node['maxFrp']), 1)
            points.append({
                'latitude': round(node['lat'] + (random.random() - 0.5) * 0.35, 4),
                'longitude': round(node['lng'] + (random.random() - 0.5) * 0.35, 4),
                'frp': frp,
                'brightness': round(random.uniform(330, 380), 1),
                'satellite': 'VIIRS_NOAA20_NRT' if i % 2 == 0 else 'MODIS_NRT',
                'classification': 'Industrial / Operational',
                'nearest_facility': node['name'],
                'distance_to_facility_km': round(random.uniform(0.2, 3.8), 2),
                'is_anomaly': frp > 85.0,
                'threat_level': 'CRITICAL' if frp > 110 else ('HIGH' if frp > 60 else 'NORMAL'),
                'confidence': f'{random.randint(88, 99)}%',
                'acq_date': date_str,
                'acq_time': f'{random.randint(0, 23):02d}:{random.randint(0, 59):02d} UTC'
            })

    # Continuous Sub-Continent Geographic Swath (Kashmir to Sri Lanka)
    regional_zones = [
        {'latMin': 32.5, 'latMax': 35.0, 'lngMin': 74.0, 'lngMax': 77.5, 'count': 80},
        {'latMin': 29.0, 'latMax': 32.0, 'lngMin': 74.5, 'lngMax': 77.0, 'count': 170},
        {'latMin': 24.5, 'latMax': 28.5, 'lngMin': 78.0, 'lngMax': 86.5, 'count': 230},
        {'latMin': 23.0, 'latMax': 28.0, 'lngMin': 69.5, 'lngMax': 76.0, 'count': 120},
        {'latMin': 21.0, 'latMax': 24.5, 'lngMin': 76.5, 'lngMax': 83.5, 'count': 220},
        {'latMin': 19.5, 'latMax': 23.5, 'lngMin': 83.5, 'lngMax': 87.5, 'count': 160},
        {'latMin': 24.5, 'latMax': 27.5, 'lngMin': 90.0, 'lngMax': 94.5, 'count': 140},
        {'latMin': 16.5, 'latMax': 20.8, 'lngMin': 73.5, 'lngMax': 79.5, 'count': 150},
        {'latMin': 12.5, 'latMax': 16.5, 'lngMin': 74.2, 'lngMax': 77.8, 'count': 110},
        {'latMin': 14.0, 'latMax': 18.5, 'lngMin': 77.8, 'lngMax': 82.5, 'count': 120},
        {'latMin': 8.5,  'latMax': 13.0, 'lngMin': 77.0, 'lngMax': 80.2, 'count': 100},
        {'latMin': 8.5,  'latMax': 12.0, 'lngMin': 75.8, 'lngMax': 77.2, 'count': 70},
        # Sri Lanka Island Full Coverage
        {'latMin': 9.1,  'latMax': 9.8,  'lngMin': 79.9, 'lngMax': 80.6, 'count': 35},
        {'latMin': 6.8,  'latMax': 8.5,  'lngMin': 80.2, 'lngMax': 81.2, 'count': 65},
        {'latMin': 5.9,  'latMax': 6.8,  'lngMin': 80.1, 'lngMax': 81.5, 'count': 50}
    ]

    for rz in regional_zones:
        for i in range(rz['count']):
            frp = round(random.uniform(10, 75), 1)
            is_crit = frp > 60
            points.append({
                'latitude': round(random.uniform(rz['latMin'], rz['latMax']), 4),
                'longitude': round(random.uniform(rz['lngMin'], rz['lngMax']), 4),
                'frp': frp,
                'brightness': round(random.uniform(305, 340), 1),
                'satellite': 'VIIRS_NOAA20_NRT' if i % 2 == 0 else 'MODIS_NRT',
                'classification': 'Wildfire / Vegetation',
                'nearest_facility': 'None (Wildfire / Rural Area)',
                'distance_to_facility_km': round(random.uniform(12, 65), 2),
                'is_anomaly': is_crit,
                'threat_level': 'HIGH' if is_crit else 'NORMAL',
                'confidence': f'{random.randint(82, 96)}%',
                'acq_date': date_str,
                'acq_time': f'{random.randint(0, 23):02d}:{random.randint(0, 59):02d} UTC'
            })

    return points

@app.get('/api/hotspots')
def get_hotspots(days: int = 5, source: str = 'ALL'):
    data = generate_continuous_telemetry()
    return {'total_count': len(data), 'hotspots': data}

@app.get('/api/health')
def health():
    return {'status': 'healthy', 'stream': 'active'}
