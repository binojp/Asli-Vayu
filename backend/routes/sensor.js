const express = require("express");
const router = express.Router();
const axios = require("axios");
const SensorReading = require("../models/SensorReading");

// Python Engine URL
const SPATIAL_ENGINE_URL = process.env.SPATIAL_ENGINE_URL || "http://localhost:8000";

// Route: Get ML-powered AQI Prediction (Scientific Analysis)
router.get("/predict", async (req, res) => {
  console.log("ML Prediction Start: Fetching latest sensor reading...");
  try {
    const reading = await SensorReading.findOne().sort({ timestamp: -1 });
    if (!reading) {
      console.log("ML Prediction Error: No sensor readings found in database.");
      return res.status(404).json({ error: "Sensor data not available" });
    }

    console.log("ML Prediction: Data found, sending to Python ML Engine...");
    const response = await axios.post(`${SPATIAL_ENGINE_URL}/ml-predict`, {
      pm25: reading.pm25,
      pm10: reading.pm10,
      no2: reading.no2,
      so2: reading.so2,
      co: reading.co,
      o3: reading.o3
    });

    console.log("ML Prediction Success:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("ML Prediction Critical Error:", error.message);
    if (error.response) {
      console.error("ML Engine Response Error:", error.response.data);
    }
    res.status(500).json({ error: "ML forecasting engine is warming up, please retry..." });
  }
});

// Route: Get latest sensor reading
router.get("/latest", async (req, res) => {
  try {
    const reading = await SensorReading.findOne().sort({ timestamp: -1 });
    res.json(reading || { pm25: 0 });
  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
});

// Route: Get Green Path
router.post("/green-route", async (req, res) => {
  console.log("Routing Request Received:", req.body);
  try {
    const { from, to } = req.body;
    
    // Fetch recent sensor data (last 24 hours) for Kriging
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const readings = await SensorReading.find({ timestamp: { $gte: yesterday } }).limit(100);
    
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

// Route: Find Nearby Green Park
router.post("/park", async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const readings = await SensorReading.find().sort({ timestamp: -1 }).limit(100);
    
    const sensorData = {
      lats: readings.map(r => r.lat),
      lons: readings.map(r => r.lon),
      pm25: readings.map(r => r.pm25)
    };

    const response = await axios.post(`${SPATIAL_ENGINE_URL}/find-green-park`, {
      lat,
      lon,
      sensor_data: sensorData
    });

    res.json(response.data);
  } catch (error) {
    console.error("Park search error:", error.message);
    res.status(500).json({ error: "Failed to find green parks" });
  }
});

// Route: Get AQI Forecast (Trend Analysis)
router.get("/forecast", async (req, res) => {
  try {
    const readings = await SensorReading.find().sort({ timestamp: 1 }).limit(1000);
    
    // This part bridges to our forecast_engine.py logic
    // Since we are in Node, let's assuming we might run a separate python process or use a child process
    // For now, let's implement a simple linear regression in JS if possible, 
    // or better yet, make forecast_engine.py a FastAPI service too.
    
    // For simplicity, let's assume we proxy it to the same spatial engine if we add the endpoint there
    const response = await axios.post(`${SPATIAL_ENGINE_URL}/forecast`, {
      historical_data: readings
    });

    res.json(response.data);
  } catch (error) {
    console.error("Forecast error:", error.message);
    res.status(500).json({ error: "Failed to generate AQI forecast" });
  }
});


module.exports = router;
