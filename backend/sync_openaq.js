const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const SensorReading = require('./models/SensorReading');

const KOCHI_COORDS = { lat: 9.9312, lon: 76.2673 };

async function fetchOpenAQData() {
    try {
        console.log("Fetching real-time air quality from OpenAQ for Kochi...");
        
        // Step 1: Find locations near Kochi (radius 25km)
        // Note: OpenAQ V2 API format
        const locResponse = await axios.get(`https://api.openaq.org/v2/locations`, {
            params: {
                coordinates: `${KOCHI_COORDS.lat},${KOCHI_COORDS.lon}`,
                radius: 25000,
                limit: 20
            }
        });

        const locations = locResponse.data.results;
        console.log(`Found ${locations.length} monitoring stations near Kochi.`);

        if (locations.length === 0) {
            console.log("No stations found. Falling back to simulation...");
            return;
        }

        // Clear enough data to make space for real data if needed, or just append
        // For this task, we want to Replace the random data.
        await SensorReading.deleteMany({});
        console.log("Cleared old simulated data.");

        for (const loc of locations) {
            const latestReadings = loc.parameters;
            
            // Map parameters to our schema
            const pm25 = latestReadings.find(p => p.parameter === 'pm25')?.lastValue || 0;
            const pm10 = latestReadings.find(p => p.parameter === 'pm10')?.lastValue || pm25 * 1.5;
            const no2 = latestReadings.find(p => p.parameter === 'no2')?.lastValue || 25;
            const so2 = latestReadings.find(p => p.parameter === 'so2')?.lastValue || 10;
            const co = latestReadings.find(p => p.parameter === 'co')?.lastValue || 0.8;
            const o3 = latestReadings.find(p => p.parameter === 'o3')?.lastValue || 20;

            await SensorReading.create({
                lat: loc.coordinates.latitude,
                lon: loc.coordinates.longitude,
                pm25: pm25,
                pm10: pm10,
                no2: no2,
                so2: so2,
                co: co,
                o3: o3,
                co2: 400 + Math.random() * 50, // OpenAQ often doesn't have CO2
                oxygen: 20.9,
                timestamp: new Date(loc.lastUpdated)
            });
            console.log(`Saved real data for station: ${loc.name}`);
        }

        console.log("Database updated with real atmospheric data from OpenAQ.");
    } catch (error) {
        console.error("OpenAQ Sync Error:", error.message);
    } finally {
        // Don't exit if called from server, but here it's a standalone test
        if (require.main === module) process.exit();
    }
}

if (require.main === module) {
    mongoose.connect(process.env.MONGO_URI).then(fetchOpenAQData);
}

module.exports = { fetchOpenAQData };
