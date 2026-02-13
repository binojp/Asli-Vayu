const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const sensorRoutes = require("./routes/sensor");
// Start MQTT Subscriber
require("./mqtt");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));
  
app.use("/api/auth", authRoutes);
app.use("/api/sensor", sensorRoutes);


const PORT = process.env.PORT || 5000;

// Change 'server' to 'app'
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);