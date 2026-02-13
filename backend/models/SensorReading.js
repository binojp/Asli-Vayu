const mongoose = require("mongoose");

const SensorSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  pm25: { type: Number, required: true },
  pm10: { type: Number },
  co2: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SensorReading", SensorSchema);
