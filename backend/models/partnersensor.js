// models/PartnerSensor.js
const mongoose = require('mongoose');

const PartnerSensorSchema = new mongoose.Schema({
  deviceId:  { type: String, required: true, index: true },
  lat:       { type: Number, required: true },
  lon:       { type: Number, required: true },
  mq135:     { type: Number },          // raw or calibrated AQI/ppm
  oxygen:    { type: Number },          // % O₂
  temp:      { type: Number },          // °C
  humidity:  { type: Number },          // %
  
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false   // we use our own timestamp
});

module.exports = mongoose.model('PartnerSensor', PartnerSensorSchema);