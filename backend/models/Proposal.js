const mongoose = require("mongoose");

const ProposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ["Artificial Rain", "Sensor Installation", "Afforestation", "Other"], required: true },
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  location: {
    lat: Number,
    lon: Number,
    address: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Proposal", ProposalSchema);
