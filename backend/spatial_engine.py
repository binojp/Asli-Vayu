from fastapi import FastAPI, HTTPException
import numpy as np
from pykrige.ok import OrdinaryKriging
import osmnx as ox
import networkx as nx
from typing import List, Dict
import pandas as pd
from shapely.geometry import Point

app = FastAPI()

def get_pollution_at_point(lat, lon, pollution_model):
    """
    Estimate pollution at a specific point [lat, lon] using the Kriging model.
    """
    if pollution_model is None:
        return 1.0 # Default weight if no model
    
    try:
        # Execute Kriging for a single point
        val, _ = pollution_model.execute("points", np.array([lon]), np.array([lat]))
        return max(1.0, float(val[0]))
    except:
        return 1.0

@app.post("/kriging")
def kriging(data: dict):
    try:
        lats = np.array(data["lats"])
        lons = np.array(data["lons"])
        values = np.array(data["pm25"])

        if len(lats) < 3:
            # Not enough points for Kriging, return original points
            return {"grid": [], "error": "Insufficient data points (min 3)"}

        OK = OrdinaryKriging(
            lons, lats, values,
            variogram_model="gaussian",
            verbose=False
        )

        # Generate a 50x50 grid for visualization (heatmap)
        grid_lon = np.linspace(min(lons), max(lons), 50)
        grid_lat = np.linspace(min(lats), max(lats), 50)
        z, _ = OK.execute("grid", grid_lon, grid_lat)

        return {
            "grid": z.tolist(),
            "lat_range": grid_lat.tolist(),
            "lon_range": grid_lon.tolist(),
            "bounds": {
                "minLat": min(lats),
                "maxLat": max(lats),
                "minLon": min(lons),
                "maxLon": max(lons)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/green-route")
def compute_route(data: dict):
    try:
        start_coords = (data["from"]["lat"], data["from"]["lon"])
        end_coords = (data["to"]["lat"], data["to"]["lon"])
        
        # Sensor data for Kriging
        sensor_lats = np.array(data["sensor_data"]["lats"])
        sensor_lons = np.array(data["sensor_data"]["lons"])
        sensor_values = np.array(data["sensor_data"]["pm25"])

        # Build Kriging model for the route weight calculation
        pollution_model = None
        if len(sensor_lats) >= 3:
            pollution_model = OrdinaryKriging(
                sensor_lons, sensor_lats, sensor_values,
                variogram_model="gaussian",
                verbose=False
            )

        # Download graph around the start point
        # Using a radius that covers both points
        p1 = Point(start_coords[1], start_coords[0])
        p2 = Point(end_coords[1], end_coords[0])
        dist = ox.distance.great_circle_vec(start_coords[0], start_coords[1], end_coords[0], end_coords[1])
        
        G = ox.graph_from_point(start_coords, dist=max(dist, 2000) + 500, network_type="drive")

        # Reweight edges
        for u, v, k, d in G.edges(keys=True, data=True):
            # Midpoint of the edge for pollution sampling
            node_u = G.nodes[u]
            node_v = G.nodes[v]
            mid_lat = (node_u['y'] + node_v['y']) / 2
            mid_lon = (node_u['x'] + node_v['x']) / 2
            
            p_factor = get_pollution_at_point(mid_lat, mid_lon, pollution_model)
            # Weight = length * (1 + normalized_pollution)
            # Assuming PM2.5 > 100 is "bad", we can scale it
            d["weight"] = d["length"] * (1 + (p_factor / 100.0))

        # Find shortest path based on weighted edges
        orig_node = ox.distance.nearest_nodes(G, start_coords[1], start_coords[0])
        dest_node = ox.distance.nearest_nodes(G, end_coords[1], end_coords[0])
        
        route = nx.shortest_path(G, orig_node, dest_node, weight="weight")
        
        # Convert route to GeoJSON
        route_gdf = ox.utils_graph.route_to_gdf(G, route)
        return route_gdf.__geo_interface__

    except Exception as e:
        print(f"Error in compute_route: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
