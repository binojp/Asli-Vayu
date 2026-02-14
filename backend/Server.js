const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/auth");
const sensorRoutes = require("./routes/sensor");
const userRoutes = require("./routes/user");
const aiRoutes = require("./routes/ai");
const mapRoutes = require("./routes/map");
const { syncAtmosphericData } = require("./sync_atmos");

const app = express();
app.use(express.json());
app.use(cors());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    // Run Atmospheric Sync on Startup
    console.log("🚀 Server Initializing: Performing Real-Time Atmospheric Sync...");
    await syncAtmosphericData();
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));
  
app.use("/api/auth", authRoutes);
app.use("/api/sensor", sensorRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/map", mapRoutes);

const PORT = process.env.PORT || 5000;

// Change 'server' to 'app'
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);