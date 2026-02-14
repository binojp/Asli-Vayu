const mongoose = require("mongoose");
const dotenv = require("dotenv");
const SensorReading = require("./models/SensorReading");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const resetAndSimulate = async () => {
  console.log("Clearing old sensor data...");
  await SensorReading.deleteMany({});
  
  console.log("Simulating 50 sensor nodes across Kochi...");
  const kochi_center = { lat: 9.9312, lon: 76.2673 };
  
  for (let i = 0; i < 50; i++) {
    const lat = kochi_center.lat + (Math.random() - 0.5) * 0.15;
    const lon = kochi_center.lon + (Math.random() - 0.5) * 0.15;
    const pm25 = Math.floor(Math.random() * 200); // 0 to 200 (Kochi is generally cleaner than Delhi)
    const pm10 = pm25 * 1.5;
    const no2 = 20 + Math.random() * 40;
    const so2 = 5 + Math.random() * 15;
    const co = 0.5 + Math.random() * 1.5;
    const o3 = 10 + Math.random() * 30;
    const co2 = 400 + Math.random() * 100;
    const oxygen = 20.9 - (pm25 / 1500);

    await SensorReading.create({
      lat,
      lon,
      pm25,
      pm10,
      no2,
      so2,
      co,
      o3,
      co2,
      oxygen,
      timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000)
    });
  }

  console.log("Kochi Region is now live with real-time simulated data.");
  process.exit();
};

resetAndSimulate();
