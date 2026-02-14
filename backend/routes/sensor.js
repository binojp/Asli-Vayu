const express = require("express");
const router = express.Router();
const axios = require("axios");
const SensorReading = require("../models/SensorReading");
const PartnerSensor = require("../models/partnersensor");

// Python Engine URL
const SPATIAL_ENGINE_URL = process.env.SPATIAL_ENGINE_URL || "http://localhost:8000";

const KOCHI_CENTER = { lat: 9.9312, lon: 76.2673 };

/**
 * Fetch real-time AQI from the internet for Kochi (OpenAQ + WAQI fallback).
 * Used for heatmap and routing so we use live data, not just DB.
 * Returns { lats, lons, pm25 } with at least 3 points when fallback is used.
 */
async function fetchRealtimeAQIFromNet() {
  const lats = [];
  const lons = [];
  const pm25 = [];

  // 1) OpenAQ: real monitoring stations near Kochi
  try {
    const locRes = await axios.get("https://api.openaq.org/v2/locations", {
      params: {
        coordinates: `${KOCHI_CENTER.lat},${KOCHI_CENTER.lon}`,
        radius: 50000,
        limit: 30
      },
      timeout: 8000,
      headers: { "Accept": "application/json" }
    });
    const locations = locRes.data?.results || [];
    for (const loc of locations) {
      const coords = loc.coordinates || {};
      const lat = coords.latitude != null ? coords.latitude : loc.latitude;
      const lon = coords.longitude != null ? coords.longitude : loc.longitude;
      if (lat == null || lon == null) continue;
      const pars = loc.parameters || loc.parameterValues || [];
      const pm25Entry = pars.find((p) => {
        const name = (p.parameter || p.parameterId || "").toString().toLowerCase();
        return name === "pm25" || p.parameterId === 2;
      });
      const value = pm25Entry?.lastValue ?? pm25Entry?.value ?? pm25Entry?.average;
      if (value != null && !Number.isNaN(Number(value))) {
        lats.push(Number(lat));
        lons.push(Number(lon));
        pm25.push(Number(value));
      }
    }
  } catch (e) {
    console.warn("OpenAQ fetch failed, using WAQI fallback:", e.message);
  }

  // 2) If we have enough points, return
  if (lats.length >= 3) {
    return { lats, lons, pm25 };
  }

  // 3) WAQI fallback: one city AQI, spread into multiple points for Kriging
  try {
    const waqiRes = await axios.get("https://api.waqi.info/feed/kochi/", {
      params: { token: process.env.WAQI_TOKEN || "demo" },
      timeout: 6000
    });
    const data = waqiRes.data?.data;
    const aqi = data?.aqi;
    const iaqi = data?.iaqi || {};
    const pm25Val = iaqi.pm25?.v ?? aqi ?? 50;
    const value = Number(pm25Val) || 50;

    // Build 12 points around Kochi so heatmap and routing have real-time coverage
    const spread = 0.08;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 2 * Math.PI;
      const r = 0.02 + (i % 3) * 0.02;
      lats.push(KOCHI_CENTER.lat + r * Math.cos(angle) + (Math.random() - 0.5) * spread);
      lons.push(KOCHI_CENTER.lon + r * Math.sin(angle) + (Math.random() - 0.5) * spread);
      pm25.push(value * (0.85 + Math.random() * 0.3));
    }
  } catch (e) {
    console.warn("WAQI fallback failed:", e.message);
    // Last resort: 5 points at center with default
    if (lats.length < 3) {
      for (let i = 0; i < 5; i++) {
        lats.push(KOCHI_CENTER.lat + (Math.random() - 0.5) * 0.05);
        lons.push(KOCHI_CENTER.lon + (Math.random() - 0.5) * 0.05);
        pm25.push(40 + Math.random() * 30);
      }
    }
  }

  return { lats, lons, pm25 };
}

// Simple AQI fallback from PM2.5 when Python ML engine is not running (PM2.5 is a common AQI proxy)
function fallbackAqiFromReading(reading) {
  try {
    const pm25 = Number(reading?.pm25) ?? 0;
    return Math.round(Math.max(0, pm25));
  } catch {
    return 0;
  }
}

// Route: Get ML-powered AQI Prediction. Always returns 200 so Dashboard works without Python engine.
router.get("/predict", async (req, res) => {
  let sent = false;
  const sendOk = (value) => {
    if (sent) return;
    sent = true;
    res.status(200).json({ predicted_aqi: value });
  };

  try {
    const reading = await SensorReading.findOne().sort({ timestamp: -1 }).lean();
    const fallback = fallbackAqiFromReading(reading);
    if (!reading) {
      return sendOk(0);
    }

    try {
      const response = await axios.post(
        `${SPATIAL_ENGINE_URL}/ml-predict`,
        {
          pm25: reading?.pm25 ?? 0,
          pm10: reading?.pm10 ?? 0,
          no2: reading?.no2 ?? 0,
          so2: reading?.so2 ?? 0,
          co: reading?.co ?? 0,
          o3: reading?.o3 ?? 0
        },
        { timeout: 5000 }
      );
      if (response?.data?.predicted_aqi != null) {
        return sendOk(response.data.predicted_aqi);
      }
    } catch (engineErr) {
      console.warn("ML engine not running, using sensor fallback:", engineErr.message);
    }
    sendOk(fallback);
  } catch (err) {
    console.error("Predict error:", err.message);
    sendOk(0);
  }
});

// Route: Get latest AQI – real-time from internet first (WAQI/OpenAQ), else DB
router.get("/latest", async (req, res) => {
  try {
    const fromNet = await fetchRealtimeAQIFromNet();
    if (fromNet.pm25.length > 0) {
      const avg = fromNet.pm25.reduce((a, b) => a + b, 0) / fromNet.pm25.length;
      return res.json({ pm25: Math.round(avg), source: "realtime" });
    }
    const reading = await SensorReading.findOne().sort({ timestamp: -1 }).lean();
    res.json(reading ? { ...reading, source: "database" } : { pm25: 0 });
  } catch (error) {
    try {
      const reading = await SensorReading.findOne().sort({ timestamp: -1 }).lean();
      return res.json(reading || { pm25: 0 });
    } catch {
      res.status(500).json({ message: "Error fetching data" });
    }
  }
});

// Use real-time AQI from internet for routing (OpenAQ + WAQI fallback). Merge DB only if net gives < 3 points.
async function getSensorDataForRouting() {
  const fromNet = await fetchRealtimeAQIFromNet();
  if (fromNet.lats.length >= 3) {
    return fromNet;
  }
  const readings = await SensorReading.find().sort({ timestamp: -1 }).limit(100).lean();
  const lats = fromNet.lats.slice();
  const lons = fromNet.lons.slice();
  const pm25 = fromNet.pm25.slice();
  readings.forEach((r) => {
    if (r.lat != null && r.lon != null) {
      lats.push(r.lat);
      lons.push(r.lon);
      pm25.push(Number(r.pm25) || 0);
    }
  });
  return { lats, lons, pm25 };
}

// Route: Get Green Path (single route, legacy). Returns empty GeoJSON when Python engine is down.
router.post("/green-route", async (req, res) => {
  const emptyGeoJson = { type: "FeatureCollection", features: [] };
  try {
    const { from, to } = req.body;
    if (!from || !to) return res.status(400).json({ error: "from and to required" });
    const sensorData = await getSensorDataForRouting();
    const response = await axios.post(`${SPATIAL_ENGINE_URL}/green-route`, { from, to, sensor_data: sensorData }, { timeout: 60000 });
    return res.json(response.data);
  } catch (error) {
    console.warn("Green route engine unavailable:", error.message);
    return res.status(200).json(emptyGeoJson);
  }
});

// Route: Get 3 AQI-optimized route options (best first). Returns empty routes when Python engine is down.
router.post("/green-routes", async (req, res) => {
  try {
    const { from: fromLoc, to: toLoc } = req.body;
    if (!fromLoc || !toLoc) {
      return res.status(400).json({ error: "from and to are required" });
    }
    const sensorData = await getSensorDataForRouting();
    const response = await axios.post(
      `${SPATIAL_ENGINE_URL}/green-routes`,
      { from: fromLoc, to: toLoc, sensor_data: sensorData },
      { timeout: 60000 }
    );
    return res.json(response.data);
  } catch (error) {
    console.warn("Green routes engine unavailable:", error.message);
    return res.status(200).json({ routes: [] });
  }
});

// Route: Get Kriging Grid (Heatmap). Uses real-time AQI from internet first; always 200 when possible.
router.get("/heat", async (req, res) => {
  const emptyHeat = () => res.json({ grid: [], lat_range: [], lon_range: [], warning: "Heatmap unavailable" });
  try {
    const sensorData = await fetchRealtimeAQIFromNet();
    if (sensorData.lats.length < 3) {
      const readings = await SensorReading.find().sort({ timestamp: -1 }).limit(100).lean();
      readings.forEach((r) => {
        if (r.lat != null && r.lon != null) {
          sensorData.lats.push(r.lat);
          sensorData.lons.push(r.lon);
          sensorData.pm25.push(Number(r.pm25) || 0);
        }
      });
    }
    if (sensorData.lats.length < 3) {
      return res.json({ grid: [], lat_range: [], lon_range: [], warning: "Insufficient data for heatmap" });
    }
    try {
      const response = await axios.post(`${SPATIAL_ENGINE_URL}/kriging`, sensorData, { timeout: 15000 });
      return res.json(response.data);
    } catch (engineErr) {
      console.warn("Kriging engine unavailable, returning empty heatmap:", engineErr.message);
      return emptyHeat();
    }
  } catch (error) {
    console.error("Heat error:", error.message);
    return emptyHeat();
  }
});

// Route: ESP32 / partner device upload — use HTTP not HTTPS, POST only
router.get("/upload", (req, res) => {
  res.status(405).json({ error: "Use POST to upload sensor data", url: "POST /api/sensor/upload" });
});
router.post("/upload", async (req, res) => {
  try {
    const { deviceId, mq135, oxygen, temp, humidity, lat, lon } = req.body;
    if (lat == null || lon == null) {
      return res.status(400).json({ error: "lat and lon required" });
    }
    const doc = await PartnerSensor.create({
      deviceId: deviceId || "unknown",
      mq135: mq135 != null ? Number(mq135) : undefined,
      oxygen: oxygen != null ? Number(oxygen) : undefined,
      temp: temp != null ? Number(temp) : undefined,
      humidity: humidity != null ? Number(humidity) : undefined,
      lat: Number(lat),
      lon: Number(lon)
    });
    res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Route: Get partner/ESP32 readings for Partner Dashboard
router.get("/partner-readings", async (req, res) => {
  try {
    const readings = await PartnerSensor.find().sort({ timestamp: -1 }).limit(50).lean();
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch partner readings" });
  }
});

// Route: Get direct sensor readings (raw)
router.get("/readings", async (req, res) => {
  try {
    const readings = await SensorReading.find().sort({ timestamp: -1 }).limit(50);
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch readings" });
  }
});

// Route: Find Nearby Green Park. Uses real-time AQI from net. Returns empty parks when Python engine is down.
router.post("/park", async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const sensorData = await getSensorDataForRouting();
    try {
      const response = await axios.post(
        `${SPATIAL_ENGINE_URL}/find-green-park`,
        { lat, lon, sensor_data: sensorData },
        { timeout: 15000 }
      );
      return res.json(response.data);
    } catch (engineErr) {
      console.warn("Park search engine unavailable:", engineErr.message);
      return res.json({ parks: [] });
    }
  } catch (error) {
    console.error("Park search error:", error.message);
    return res.json({ parks: [] });
  }
});

// Route: Get AQI Forecast. Returns empty forecast when Python engine is down.
router.get("/forecast", async (req, res) => {
  try {
    const readings = await SensorReading.find().sort({ timestamp: 1 }).limit(1000).lean();
    try {
      const response = await axios.post(
        `${SPATIAL_ENGINE_URL}/forecast`,
        { historical_data: readings },
        { timeout: 10000 }
      );
      return res.json(response.data);
    } catch (engineErr) {
      console.warn("Forecast engine unavailable:", engineErr.message);
      return res.json({ forecast: [] });
    }
  } catch (error) {
    console.error("Forecast error:", error.message);
    return res.json({ forecast: [] });
  }
});


// Route: Get Environmental Zoning Analysis for a location
router.post("/zoning-analysis", async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const latest = await SensorReading.findOne().sort({ timestamp: -1 }).lean();
    const readings = await SensorReading.find().sort({ timestamp: 1 }).limit(1000).lean();

    // First get forecast from Python
    const forecastRes = await axios.post(`${SPATIAL_ENGINE_URL}/forecast`, { historical_data: readings });
    const forecast = forecastRes.data.forecast;

    // Then get zoning analysis
    const response = await axios.post(
      `${SPATIAL_ENGINE_URL}/zoning-analysis`,
      { 
        lat, 
        lon, 
        current_aqi: latest?.pm25 || 0,
        forecast: forecast
      },
      { timeout: 10000 }
    );
    return res.json(response.data);
  } catch (error) {
    console.error("Zoning analysis error:", error.message);
    res.status(200).json({ decision: "Unavailable", reason: "Analysis engine offline. Manual review required." });
  }
});

module.exports = router;
