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

# Load Advanced Random Forest Model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "aqi_model.pkl")

rf_model = None
try:
    if os.path.exists(MODEL_PATH):
        rf_model = joblib.load(MODEL_PATH)
        print("✅ Random Forest Model loaded successfully")
    else:
        print(f"⚠️ Model file not found at {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading RF model: {e}")
    try:
        import pickle
        with open(MODEL_PATH, "rb") as f:
            rf_model = pickle.load(f)
            print("✅ Model loaded via pickle fallback")
    except:
        print("❌ All model loading attempts failed.")

@app.get("/")
def home():
    return {"status": "Asli Vayu Spatial Engine Running", "model_loaded": rf_model is not None}

@app.post("/ml-predict")
def ml_predict(data: Dict[str, float]):
    try:
        if rf_model is None:
            # Smart fallback if model failed to load
            pm25 = data.get("pm25", 0.0)
            return {"predicted_aqi": float(pm25 * 1.1 + 5), "note": "fallback prediction"}

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
        print(f"Prediction error: {e}")
        # Return a reasonable fallback instead of 500 so UI doesn't break
        return {"predicted_aqi": float(data.get("pm25", 0.0)), "error": str(e)}

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

def _build_green_graph(G, pollution_model):
    """Add green_weight to all edges using pollution model (Kriging)."""
    if pollution_model:
        edges = list(G.edges(keys=True, data=True))
        m_lats = []
        m_lons = []
        for u, v, k, d in edges:
            node_u, node_v = G.nodes[u], G.nodes[v]
            m_lats.append((node_u["y"] + node_v["y"]) / 2)
            m_lons.append((node_u["x"] + node_v["x"]) / 2)
        p_vals, _ = pollution_model.execute("points", np.array(m_lons), np.array(m_lats))
        for i, (u, v, k, d) in enumerate(edges):
            base_time = d.get("travel_time", d["length"] / 11.0)
            d["green_weight"] = float(base_time) * (1.0 + (float(p_vals[i]) / 50.0))
    else:
        for u, v, k, d in G.edges(keys=True, data=True):
            d["green_weight"] = d.get("travel_time", d["length"] / 11.0)


def _path_edge_keys(G, path, weight="green_weight"):
    """Return list of (u, v, key) for the edges actually used in path (MultiDiGraph)."""
    edges = []
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        best_k, best_w = None, float("inf")
        for k in G[u][v]:
            w = G[u][v][k].get(weight, float("inf"))
            if w < best_w:
                best_w, best_k = w, k
        if best_k is not None:
            edges.append((u, v, best_k))
    return edges


def _route_stats(G, path, pollution_model):
    """Compute distance (km), duration (min), and average AQI (PM2.5) for a path."""
    total_length = 0.0
    total_time = 0.0
    pm25_sum = 0.0
    count = 0
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        best_k, best_w = None, float("inf")
        for k in G[u][v]:
            w = G[u][v][k].get("green_weight", float("inf"))
            if w < best_w:
                best_w, best_k = w, k
        if best_k is None:
            continue
        d = G[u][v][best_k]
        length = d.get("length", 0) or 0
        total_length += length
        total_time += d.get("travel_time", length / 11.0) or (length / 11.0)
        if pollution_model:
            node_u, node_v = G.nodes[u], G.nodes[v]
            mid_lat = (node_u["y"] + node_v["y"]) / 2
            mid_lon = (node_u["x"] + node_v["x"]) / 2
            try:
                val, _ = pollution_model.execute("points", np.array([mid_lon]), np.array([mid_lat]))
                pm25_sum += float(val[0])
            except Exception:
                pm25_sum += 10.0
            count += 1
    avg_aqi = (pm25_sum / count) if count else 0.0
    return {
        "distance_km": round(total_length / 1000.0, 2),
        "duration_min": round(total_time / 60.0, 1),
        "avg_aqi": round(avg_aqi, 1),
    }


@app.post("/green-route")
def compute_route(data: Dict[str, Any]):
    """Single green route (legacy)."""
    result = compute_routes_internal(data, k=1)
    if not result["routes"]:
        raise HTTPException(status_code=500, detail="No route found")
    return result["routes"][0]["geojson"]


@app.post("/green-routes")
def compute_green_routes(data: Dict[str, Any]):
    """Return up to 3 AQI-optimized route options (best first) with stats."""
    return compute_routes_internal(data, k=3)


def compute_routes_internal(data: Dict[str, Any], k: int = 3):
    """Core logic: build graph, pollution model, then compute k alternative routes by green_weight."""
    print(f"🚀 Processing Routing Request: {data['from']} -> {data['to']} (k={k})")
    try:
        start_coords = (float(data["from"]["lat"]), float(data["from"]["lon"]))
        end_coords = (float(data["to"]["lat"]), float(data["to"]["lon"]))

        sensor_lats = np.array([float(x) for x in data["sensor_data"].get("lats", [])])
        sensor_lons = np.array([float(x) for x in data["sensor_data"].get("lons", [])])
        sensor_values = np.array([float(x) for x in data["sensor_data"].get("pm25", [])])

        pollution_model = None
        if len(sensor_lats) >= 3:
            pollution_model = OrdinaryKriging(
                sensor_lons, sensor_lats, sensor_values, variogram_model="gaussian", verbose=False
            )

        dist_between = float(
            ox.distance.great_circle(start_coords[0], start_coords[1], end_coords[0], end_coords[1])
        )
        print(f"📏 Distance: {dist_between:.2f}m")

        if dist_between > 25000:
            print("⚠️ Distance too large for local green routing. Limiting range.")

        center_lat = (start_coords[0] + end_coords[0]) / 2
        center_lon = (start_coords[1] + end_coords[1]) / 2
        fetch_dist = min(max(dist_between / 2, 2000.0) + 1000.0, 15000.0)
        print(f"🗺️ Fetching graph with radius: {fetch_dist}m")

        G = ox.graph_from_point(
            (center_lat, center_lon), dist=fetch_dist, network_type="drive", simplify=True
        )
        print(f"✅ Graph downloaded: {len(G.nodes)} nodes, {len(G.edges)} edges.")

        G = ox.add_edge_speeds(G)
        G = ox.add_edge_travel_times(G)
        _build_green_graph(G, pollution_model)

        orig = ox.distance.nearest_nodes(G, start_coords[1], start_coords[0])
        dest = ox.distance.nearest_nodes(G, end_coords[1], end_coords[0])

        routes_out = []
        seen_paths = set()

        # Penalty factor for already-used edges (alternative route algorithm)
        PENALTY = 5.0
        G_work = G.copy()

        for idx in range(k):
            try:
                route_nodes = nx.shortest_path(G_work, orig, dest, weight="green_weight")
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                break
            path_signature = tuple(route_nodes)
            if path_signature in seen_paths:
                # Force different path by penalizing again and retry once
                for (u, v, key) in _path_edge_keys(G_work, route_nodes):
                    if G_work.has_edge(u, v, key):
                        G_work[u][v][key]["green_weight"] *= PENALTY
                try:
                    route_nodes = nx.shortest_path(G_work, orig, dest, weight="green_weight")
                except (nx.NetworkXNoPath, nx.NodeNotFound):
                    break
                path_signature = tuple(route_nodes)
            if path_signature in seen_paths:
                break
            seen_paths.add(path_signature)

            route_gdf = ox.utils_graph.route_to_gdf(G, route_nodes)
            geojson = route_gdf.__geo_interface__
            stats = _route_stats(G, route_nodes, pollution_model)
            label = ["Best AQI", "Alternative 2", "Alternative 3"][idx] if idx < 3 else f"Option {idx + 1}"
            routes_out.append({
                "geojson": geojson,
                "summary": stats,
                "label": label,
            })

            # Penalize this route's edges so next path is different
            for (u, v, key) in _path_edge_keys(G_work, route_nodes):
                if G_work.has_edge(u, v, key):
                    G_work[u][v][key]["green_weight"] *= PENALTY

        print(f"🏁 Computed {len(routes_out)} route(s).")
        return {"routes": routes_out}
    except Exception as e:
        import traceback
        print(f"❌ Routing Critical Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/find-green-park")
def find_green_park(data: Dict[str, Any]):
    try:
        center = (float(data["lat"]), float(data["lon"]))
        sensor_lats = np.array([float(x) for x in data["sensor_data"].get("lats", [])])
        sensor_lons = np.array([float(x) for x in data["sensor_data"].get("lons", [])])
        sensor_values = np.array([float(x) for x in data["sensor_data"].get("pm25", [])])

        pollution_model = None
        if len(sensor_lats) >= 3:
            pollution_model = OrdinaryKriging(sensor_lons, sensor_lats, sensor_values, variogram_model="gaussian", verbose=False)

        gdf = ox.features_from_point(center, tags={"leisure": "park", "landuse": ["grass", "park", "recreational_ground"]}, dist=3000)
        if gdf.empty: return {"parks": []}

        parks = []
        for _, row in gdf.iterrows():
            if row.geometry is None: continue
            centroid = row.geometry.centroid
            p_lat, p_lon = float(centroid.y), float(centroid.x)
            p_aqi = get_pollution_at_point(p_lat, p_lon, pollution_model)
            
            name = str(row.get("name", "Local Park"))
            if name == "nan": name = "Green Oasis"
            
            parks.append({
                "name": name,
                "lat": p_lat,
                "lon": p_lon,
                "aqi": float(round(p_aqi, 1)),
                "address": "Kochi Area"
            })

        parks.sort(key=lambda x: x["aqi"])
        top_parks = parks[:5]
        return {"parks": top_parks}
    except Exception as e:
        print(f"Park Search Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forecast")
def get_forecast(data: Dict[str, Any]):
    try:
        historical = data.get("historical_data", [])
        if len(historical) < 5: 
            return {"forecast": [], "error": "Insufficient data (min 5 readings required)"}
        
        df_list = []
        for item in historical:
            df_list.append({
                "timestamp": item.get("timestamp"),
                "pm25": item.get("pm25", 0)
            })
        
        df = pd.DataFrame(df_list)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Calculate days from start for linear regression
        df['days_from_start'] = (df['timestamp'] - df['timestamp'].min()).dt.total_seconds() / (24 * 3600)
        X = df[['days_from_start']].values
        y = df['pm25'].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict next 7 days
        last_day = df['days_from_start'].max()
        last_date = df['timestamp'].max()
        
        forecast = []
        for i in range(1, 8):
            future_day = last_day + i
            prediction = model.predict([[future_day]])[0]
            forecast.append({
                "date": (last_date + pd.Timedelta(days=i)).strftime("%Y-%m-%d"),
                "pm25": round(max(0.0, float(prediction)), 2)
            })
            
        return {"forecast": forecast}
    except Exception as e:
        print(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/zoning-analysis")
def zoning_analysis(data: Dict[str, Any]):
    try:
        current_aqi = data.get("current_aqi", 0.0)
        forecast = data.get("forecast", [])
        
        if not forecast:
            return {"decision": "Inconclusive", "reason": "No forecast data available."}
        
        # Calculate trend from forecast
        trend = forecast[-1]["pm25"] - forecast[0]["pm25"]
        
        if current_aqi > 150:
            return {
                "decision": "Rejected", 
                "reason": f"Current AQI ({current_aqi}) is dangerously high for industrial development.",
                "color": "red"
            }
        
        if trend > 10: # Significantly rising trend
            return {
                "decision": "Rejected", 
                "reason": "Pollution levels are on a significant rising trend. Further development would be unsustainable.",
                "color": "orange"
            }
        
        if current_aqi < 50 and trend < 0:
            return {
                "decision": "Recommended", 
                "reason": "Area has excellent air quality and stable/improving trends. Suitable for eco-sensitive development.",
                "color": "green"
            }
            
        return {
            "decision": "Conditional Approval", 
            "reason": "Moderate conditions. Development allowed with strict pollution control measures.",
            "color": "yellow"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
