const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://broker.hivemq.com");

const deliveryBoyId = "db_001";
let currentPos = { lat: 28.6139, lon: 77.2090 };

client.on("connect", () => {
  console.log("Delivery Tracker Active...");
  
  setInterval(() => {
    // Simulate walking/riding
    currentPos.lat += (Math.random() - 0.5) * 0.001;
    currentPos.lon += (Math.random() - 0.5) * 0.001;
    
    const payload = {
      lat: currentPos.lat,
      lon: currentPos.lon,
      pm25: Math.floor(Math.random() * 200),
      pm10: Math.floor(Math.random() * 300),
      co2: 450 + Math.random() * 50,
      oxygen: 20.8 + Math.random() * 0.2,
      timestamp: new Date()
    };
    
    client.publish(`env/sensors/${deliveryBoyId}`, JSON.stringify(payload));
    console.log(`[${deliveryBoyId}] Tracked: ${currentPos.lat.toFixed(4)}, ${currentPos.lon.toFixed(4)} PM2.5: ${payload.pm25}`);
  }, 5000); // Send data every 5 seconds
});
