from fastapi import FastAPI
import numpy as np
from pykrige.ok import OrdinaryKriging

app = FastAPI()

@app.post("/kriging")
def kriging(data: dict):
    lats = np.array(data["lats"])
    lons = np.array(data["lons"])
    values = np.array(data["pm25"])

    OK = OrdinaryKriging(
        lons, lats, values,
        variogram_model="gaussian",
        verbose=False
    )

    grid_lon = np.linspace(min(lons), max(lons), 100)
    grid_lat = np.linspace(min(lats), max(lats), 100)

    z, _ = OK.execute("grid", grid_lon, grid_lat)

    return {
        "grid": z.tolist(),
        "bounds": {
            "minLat": min(lats),
            "maxLat": max(lats),
            "minLon": min(lons),
            "maxLon": max(lons)
        }
    }
