const mongoose = require("mongoose");

const HealthProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  conditions: [{ type: String }], // e.g., ["Asthma", "Heart Condition"]
  sensitivity: { type: String, enum: ["Low", "Moderate", "High"], default: "Moderate" },
  age: { type: Number },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HealthProfile", HealthProfileSchema);
