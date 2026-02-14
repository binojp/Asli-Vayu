const express = require("express");
const router = express.Router();
const axios = require("axios");
const { protect } = require("../middleware/authMiddleware");
const SensorReading = require("../models/SensorReading");
const HealthProfile = require("../models/HealthProfile");

router.post("/chat", protect, async (req, res) => {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const { message, location } = req.body;

    // 1. Fetch relevant context (Recent AQI, User Health Profile)
    const profile = await HealthProfile.findOne({ userId: req.user._id });
    const recentReading = await SensorReading.findOne().sort({ timestamp: -1 });

    const context = `
      Current AQI (PM2.5): ${recentReading?.pm25 || "Unknown"}
      User Conditions: ${profile?.conditions?.join(", ") || "None"}
      User Sensitivity: ${profile?.sensitivity || "Normal"}
      Current Location: ${location || "Unknown"}
    `;

    const prompt = `
      You are Asli Vayu AI, a personalized environmental and health assistant. 
      Context: ${context}
      User Question: ${message}
      
      Instructions:
      - Provide actionable health advice based on the AQI and user's conditions.
      - If they ask for a route, suggest avoiding high AQI areas.
      - Be concise, professional, and empathetic.
      - If AQI is high (>100), warn them to wear a mask or stay indoors.
    `;

    try {
      const response = await axios.post(GEMINI_URL, {
        contents: [{ parts: [{ text: prompt }] }]
      });

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        return res.json({ response: aiResponse });
      }
      throw new Error("Invalid response from Gemini");

    } catch (apiError) {
      console.error("Gemini API Error Detail:", apiError.response?.data || apiError.message);
      
      // Fallback: rule-based response
      let fallbackMsg = "I'm having trouble connecting to my central brain, but based on your local data: ";
      if (recentReading?.pm25 > 150) {
        fallbackMsg += "The air quality is currently Hazardous. Please avoid outdoor activities and use an air purifier.";
      } else if (recentReading?.pm25 > 50) {
        fallbackMsg += "The air quality is Moderate. It's generally safe, but wear a mask if you're sensitive.";
      } else {
        fallbackMsg += "The air quality is Great! Perfect time for a walk.";
      }

      if (profile?.conditions?.includes("Asthma")) {
        fallbackMsg += " Also, please keep your inhaler handy as a precaution.";
      }

      res.json({ response: fallbackMsg });
    }

  } catch (error) {
    console.error("Critical AI Route Error:", error.message);
    res.status(500).json({ error: "System encountered an unexpected error" });
  }
});

module.exports = router;
