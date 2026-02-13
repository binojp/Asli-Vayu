const express = require("express");
const router = express.Router();
const axios = require("axios");
const SensorReading = require("../models/SensorReading");

// Python Engine URL
const SPATIAL_ENGINE_URL = process.env.SPATIAL_ENGINE_URL || "http://localhost:8000";

// Route: Get Green Path
router.post("/route", async (req, res) => {
  try {
    const { from, to } = req.body;
    
    // Fetch recent sensor data (last 24 hours) for Kriging
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const readings = await SensorReading.find({ timestamp: { $gte: yesterday } });
    
    const sensorData = {
      lats: readings.map(r => r.lat),
      lons: readings.map(r => r.lon),
      pm25: readings.map(r => r.pm25)
    };

    // Proxy to Python engine
    const response = await axios.post(`${SPATIAL_ENGINE_URL}/green-route`, {
      from,
      to,
      sensor_data: sensorData
    });

    res.json(response.data);
  } catch (error) {
    console.error("Routing error:", error.message);
    res.status(500).json({ error: "Failed to compute green route" });
  }
});

// Route: Get Kriging Grid (Heatmap)
router.get("/heat", async (req, res) => {
  try {
    const readings = await SensorReading.find().sort({ timestamp: -1 }).limit(100);
    
    if (readings.length < 3) {
      return res.json({ grid: [], warning: "Insufficient data for Kriging" });
    }

    const sensorData = {
      lats: readings.map(r => r.lat),
      lons: readings.map(r => r.lon),
      pm25: readings.map(r => r.pm25)
    };

    const response = await axios.post(`${SPATIAL_ENGINE_URL}/kriging`, sensorData);
    res.json(response.data);
  } catch (error) {
    console.error("Kriging error:", error.message);
    res.status(500).json({ error: "Failed to compute pollution surface" });
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

module.exports = router;
