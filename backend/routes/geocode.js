const express = require("express");
const router = express.Router();
const axios = require("axios");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// GET /api/geocode?q=...&limit=5 - proxy to Nominatim (avoids CORS)
router.get("/", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({ error: "Query 'q' is required" });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);
    const response = await axios.get(NOMINATIM_URL, {
      params: { format: "json", q: q.trim(), limit },
      headers: { "User-Agent": "AsliVayu/1.0 (Kochi air quality app)" },
      timeout: 8000
    });
    res.json(response.data || []);
  } catch (err) {
    console.error("Geocode error:", err.message);
    res.status(500).json([]);
  }
});

module.exports = router;
