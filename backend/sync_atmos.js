const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const SensorReading = require('./models/SensorReading');

const KOCHI_COORDS = { lat: 9.9312, lon: 76.2673 };

async function syncAtmosphericData() {
    try {
        console.log("⚓ Anchoring system to real-time Kochi data (WAQI)...");
        
        // Use WAQI to get current Kochi status
        const response = await axios.get(`https://api.waqi.info/feed/kochi/?token=demo`);
        
        if (response.data.status !== 'ok') {
            throw new Error("Unable to fetch WAQI data");
        }

        const data = response.data.data;
        const mainAQI = data.aqi;
        console.log(`Current Kochi AQI (Real): ${mainAQI}`);

        // Get pollutants
        const iaqi = data.iaqi;
        const pm25 = iaqi.pm25?.v || mainAQI;
        const pm10 = iaqi.pm10?.v || pm25 * 1.5;
        const no2 = iaqi.no2?.v || 20;
        const so2 = iaqi.so2?.v || 10;
        const co = iaqi.co?.v || 0.5;
        const o3 = iaqi.o3?.v || 15;

        // Clear existing data to replace it with real-anchored simulation
        await SensorReading.deleteMany({});
        console.log("Database cleared for real-time synchronization.");

        // Create 50 points around Kochi, anchored to the real AQI
        const nodes = [];
        for (let i = 0; i < 50; i++) {
            const lat = KOCHI_COORDS.lat + (Math.random() - 0.5) * 0.15;
            const lon = KOCHI_COORDS.lon + (Math.random() - 0.5) * 0.15;
            
            // Variance: +/- 20% of the real AQI
            const variance = 0.8 + Math.random() * 0.4;
            
            nodes.push({
                lat,
                lon,
                pm25: Math.round(pm25 * variance),
                pm10: Math.round(pm10 * variance),
                no2: Math.round(no2 * variance),
                so2: Math.round(so2 * variance),
                co: co * variance,
                o3: o3 * variance,
                timestamp: new Date()
            });
        }

        await SensorReading.insertMany(nodes);
        console.log("✅ Successfully anchored 50 virtual sensors to real Kochi atmospheric data.");
        
        return mainAQI;
    } catch (error) {
        console.error("Atmospheric Sync Failure:", error.message);
        return 50; // default
    }
}

if (require.main === module) {
    mongoose.connect(process.env.MONGO_URI).then(async () => {
        await syncAtmosphericData();
        process.exit();
    });
}

module.exports = { syncAtmosphericData };
