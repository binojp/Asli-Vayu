const express = require("express");
const router = express.Router();
const axios = require("axios");

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

// GET /api/route?from=lat,lon&to=lat,lon - returns GeoJSON for Leaflet
router.get("/", async (req, res) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    if (!from || !to) {
      return res.status(400).json({ error: "Query params 'from' and 'to' required (lat,lon)" });
    }
    const [fromLat, fromLon] = from.split(",").map(Number);
    const [toLat, toLon] = to.split(",").map(Number);
    if ([fromLat, fromLon, toLat, toLon].some((n) => isNaN(n))) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    // OSRM expects lon,lat;lon,lat
    const coords = `${fromLon},${fromLat};${toLon},${toLat}`;
    const response = await axios.get(`${OSRM_URL}/${coords}`, {
      params: { overview: "full", geometries: "geojson" },
      timeout: 10000
    });
    if (response.data.code !== "Ok" || !response.data.routes?.[0]) {
      return res.status(404).json({ error: "No route found" });
    }
    const route = response.data.routes[0];
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: route.geometry
        }
      ]
    };
    res.json(geojson);
  } catch (err) {
    console.error("Route error:", err.message);
    res.status(500).json({ error: err.response?.data?.message || "Routing failed" });
  }
});

module.exports = router;
