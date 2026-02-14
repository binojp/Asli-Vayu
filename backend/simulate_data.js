const mongoose = require("mongoose");
const dotenv = require("dotenv");
const SensorReading = require("./models/SensorReading");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const simulate = async () => {
  console.log("Simulating 50 sensor nodes across Kochi...");
  
  const kochi_center = { lat: 9.9312, lon: 76.2673 };
  
  for (let i = 0; i < 50; i++) {
    const lat = kochi_center.lat + (Math.random() - 0.5) * 0.2;
    const lon = kochi_center.lon + (Math.random() - 0.5) * 0.2;
    const pm25 = Math.floor(Math.random() * 300); // 0 to 300
    const pm10 = pm25 * 1.5;
    const co2 = 400 + Math.random() * 200;
    const oxygen = 20.9 - (pm25 / 1000);

    await SensorReading.create({
      lat,
      lon,
      pm25,
      pm10,
      co2,
      oxygen,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
    });
  }

  console.log("Simulation complete. System is now data-ready.");
  process.exit();
};

simulate();
