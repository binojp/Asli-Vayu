from fastapi import FastAPI, HTTPException
import numpy as np
from pykrige.ok import OrdinaryKriging
import osmnx as ox
import networkx as nx
from typing import List, Dict, Any
import pandas as pd
from shapely.geometry import Point
from sklearn.linear_model import LinearRegression
import joblib
import os

app = FastAPI()

# Load Advanced Random Forest Model from GitHub
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "aqi_model.pkl")

# We use joblib as it is more efficient for big models
try:
    rf_model = joblib.load(MODEL_PATH)
except:
    # Fallback to pickle if joblib fails (though pkl usually works with joblib)
    import pickle
    with open(MODEL_PATH, "rb") as f:
        rf_model = pickle.load(f)

@app.post("/ml-predict")
def ml_predict(data: Dict[str, float]):
    try:
        # Features must match training order: PM2.5, PM10, NO2, SO2, CO, O3
        features = pd.DataFrame([[
            data.get("pm25", 0.0),
            data.get("pm10", 0.0),
            data.get("no2", 0.0),
            data.get("so2", 0.0),
            data.get("co", 0.0),
            data.get("o3", 0.0)
        ]], columns=["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"])
        
        prediction = rf_model.predict(features)
        return {"predicted_aqi": float(prediction[0])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_pollution_at_point(lat: float, lon: float, pollution_model: Any) -> float:
    if pollution_model is None:
        return 10.0
    try:
        val, _ = pollution_model.execute("points", np.array([float(lon)]), np.array([float(lat)]))
        return float(val[0])
    except Exception:
        return 10.0

@app.post("/kriging")
def kriging(data: Dict[str, Any]):
    try:
        lats = np.array([float(x) for x in data["lats"]])
        lons = np.array([float(x) for x in data["lons"]])
        values = np.array([float(x) for x in data["pm25"]])

        if len(lats) < 3:
            return {"grid": [], "error": "Insufficient data"}

        OK = OrdinaryKriging(lons, lats, values, variogram_model="gaussian", verbose=False)
        grid_lon = np.linspace(min(lons), max(lons), 50)
        grid_lat = np.linspace(min(lats), max(lats), 50)
        z, _ = OK.execute("grid", grid_lon, grid_lat)

        return {
            "grid": z.tolist(),
            "lat_range": grid_lat.tolist(),
            "lon_range": grid_lon.tolist(),
            "bounds": {"minLat": float(min(lats)), "maxLat": float(max(lats)), "minLon": float(min(lons)), "maxLon": float(max(lons))}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/green-route")
def compute_route(data: Dict[str, Any]):
    try:
        start_coords = (float(data["from"]["lat"]), float(data["from"]["lon"]))
        end_coords = (float(data["to"]["lat"]), float(data["to"]["lon"]))
        sensor_lats = np.array([float(x) for x in data["sensor_data"]["lats"]])
        sensor_lons = np.array([float(x) for x in data["sensor_data"]["lons"]])
        sensor_values = np.array([float(x) for x in data["sensor_data"]["pm25"]])

        pollution_model = None
        if len(sensor_lats) >= 3:
            pollution_model = OrdinaryKriging(sensor_lons, sensor_lats, sensor_values, variogram_model="gaussian", verbose=False)

        # Download graph around the start/end points
        dist_between = float(ox.distance.great_circle_vec(start_coords[0], start_coords[1], end_coords[0], end_coords[1]))
        center_lat = (start_coords[0] + end_coords[0]) / 2
        center_lon = (start_coords[1] + end_coords[1]) / 2
        
        G = ox.graph_from_point((center_lat, center_lon), dist=max(dist_between/2, 2000.0) + 1000.0, network_type="drive")
        
        # Add travel speeds and times
        G = ox.add_edge_speeds(G)
        G = ox.add_edge_travel_times(G)

        # Advanced Cost Function: Time + (AQI Weight)
        # weight = travel_time_seconds * (1 + (AQI / 50))
        # This makes the "cost" of a high AQI road significantly higher even if it's shorter/faster
        for u, v, k, d in G.edges(keys=True, data=True):
            node_u, node_v = G.nodes[u], G.nodes[v]
            mid_lat, mid_lon = (node_u['y'] + node_v['y']) / 2, (node_u['x'] + node_v['x']) / 2
            
            p_factor = get_pollution_at_point(float(mid_lat), float(mid_lon), pollution_model)
            
            # Base cost is travel time in seconds
            base_time = d.get('travel_time', d['length'] / 13.0) # Fallback to ~50 km/h
            
            # Integrated Factor: Time and AQI
            # A higher p_factor (AQI) increases the 'perceived' time cost
            d["green_weight"] = base_time * (1.0 + (float(p_factor) / 75.0))

        orig, dest = ox.distance.nearest_nodes(G, start_coords[1], start_coords[0]), ox.distance.nearest_nodes(G, end_coords[1], end_coords[0])
        
        # Calculate Shortest Green Path (Time + AQI)
        route = nx.shortest_path(G, orig, dest, weight="green_weight")
        
        # Standard Shortest Path for comparison (Optional)
        # std_route = nx.shortest_path(G, orig, dest, weight="travel_time")
        
        return ox.utils_graph.route_to_gdf(G, route).__geo_interface__
    except Exception as e:
        print(f"Routing Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/find-green-park")
def find_green_park(data: Dict[str, Any]):
    try:
        center = (float(data["lat"]), float(data["lon"]))
        sensor_lats = np.array([float(x) for x in data["sensor_data"]["lats"]])
        sensor_lons = np.array([float(x) for x in data["sensor_data"]["lons"]])
        sensor_values = np.array([float(x) for x in data["sensor_data"]["pm25"]])

        pollution_model = None
        if len(sensor_lats) >= 3:
            pollution_model = OrdinaryKriging(sensor_lons, sensor_lats, sensor_values, variogram_model="gaussian", verbose=False)

        gdf = ox.features_from_point(center, tags={"leisure": "park", "landuse": "grass"}, dist=5000)
        if gdf.empty: return {"error": "No parks found"}

        parks = []
        for _, row in gdf.iterrows():
            centroid = row.geometry.centroid
            p_lat, p_lon = float(centroid.y), float(centroid.x)
            p_aqi = get_pollution_at_point(p_lat, p_lon, pollution_model)
            parks.append({"name": str(row.get("name", "Unnamed Park")), "lat": p_lat, "lon": p_lon, "aqi": float(p_aqi), "address": str(row.get("addr:full", "Local Area"))})

        parks.sort(key=lambda x: x["aqi"])
        return {"parks": [p for p in parks[:5]]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forecast")
def get_forecast(data: Dict[str, Any]):
    try:
        historical = data["historical_data"]
        if len(historical) < 5: return {"error": "Insufficient data"}
        df = pd.DataFrame(historical)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['days'] = (df['timestamp'] - df['timestamp'].min()).dt.days
        X, y = df[['days']].values, df['pm25'].values
        model = LinearRegression().fit(X, y)
        last_day, last_date = float(df['days'].max()), df['timestamp'].max()
        future = np.array([[last_day + i] for i in range(1, 8)])
        preds = model.predict(future)
        forecast = [{"date": (last_date + pd.Timedelta(days=i+1)).strftime("%Y-%m-%d"), "pm25": float(max(0.0, float(p)))} for i, p in enumerate(preds)]
        return {"forecast": forecast}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
