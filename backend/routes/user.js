const express = require("express");
const router = express.Router();
const HealthProfile = require("../models/HealthProfile");
const Proposal = require("../models/Proposal");
const { protect } = require("../middleware/authMiddleware");

// --- Health Profile ---

// @route   GET /api/user/profile
// @desc    Get user's health profile
router.get("/profile", protect, async (req, res) => {
  try {
    let profile = await HealthProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await HealthProfile.create({ userId: req.user._id });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user's health profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { conditions, sensitivity, age } = req.body;
    let profile = await HealthProfile.findOneAndUpdate(
      { userId: req.user._id },
      { conditions, sensitivity, age, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- Proposals ---

// @route   POST /api/proposals
// @desc    Submit a new proposal
router.post("/proposals", protect, async (req, res) => {
  try {
    const { title, description, type, location } = req.body;
    const proposal = await Proposal.create({
      title,
      description,
      type,
      location,
      submittedBy: req.user._id
    });
    res.status(201).json(proposal);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/proposals
// @desc    Get all proposals (User sees their own, Admin sees all)
router.get("/proposals", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "Partner" && req.user.role !== "Admin") {
      query = { submittedBy: req.user._id };
    }
    const proposals = await Proposal.find(query).populate("submittedBy", "name email");
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PATCH /api/proposals/:id
// @desc    Update proposal status (Admin only)
router.patch("/proposals/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Partner") {
      return res.status(403).json({ message: "Not authorized" });
    }
    const { status } = req.body;
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
