const mqtt = require("mqtt");
const SensorReading = require("./models/SensorReading");

const client = mqtt.connect(process.env.MQTT_BROKER);

client.on("connect", () => {
  console.log("MQTT connected");
  client.subscribe("env/sensors/+");
});

client.on("message", async (_, message) => {
  const data = JSON.parse(message.toString());
  await SensorReading.create(data);
});

module.exports = client;
