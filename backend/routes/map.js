/**
 * Standalone map API: geocode + route only. No dependency on sensor/auth/other routes.
 * Mount at /api/map - frontend uses GET /api/map/geocode and GET /api/map/route
 */
const express = require("express");
const router = express.Router();
const axios = require("axios");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

// GET /api/map/geocode?q=...&limit=5
router.get("/geocode", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({ error: "Query 'q' is required" });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);
    const response = await axios.get(NOMINATIM_URL, {
      params: { format: "json", q: q.trim(), limit },
      headers: { "User-Agent": "AsliVayu-Map/1.0" },
      timeout: 8000
    });
    return res.json(response.data || []);
  } catch (err) {
    console.error("Map geocode error:", err.message);
    return res.status(500).json([]);
  }
});

// GET /api/map/route?from=lat,lon&to=lat,lon
router.get("/route", async (req, res) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    if (!from || !to) {
      return res.status(400).json({ error: "Query 'from' and 'to' required (lat,lon)" });
    }
    const [fromLat, fromLon] = from.split(",").map(Number);
    const [toLat, toLon] = to.split(",").map(Number);
    if ([fromLat, fromLon, toLat, toLon].some((n) => isNaN(n))) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
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
      features: [{ type: "Feature", properties: {}, geometry: route.geometry }]
    };
    return res.json(geojson);
  } catch (err) {
    console.error("Map route error:", err.message);
    return res.status(500).json({ error: err.response?.data?.message || "Routing failed" });
  }
});

module.exports = router;
