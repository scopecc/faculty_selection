const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

// ✅ In-memory storage for OTPs
const otpStorage = {};

// ✅ Send OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // ✅ Store OTP with expiry (5 mins)
    otpStorage[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    // ✅ Send OTP using n8n workflow
    const n8nWebhookUrl = process.env.N8N_OTP_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      throw new Error("N8N webhook URL not configured");
    }

    const response = await axios.post(
      n8nWebhookUrl,
      {
        email: email,
        otp: otp,
      },
      {
        timeout: 30000, // 30 second timeout
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log("✅ OTP sent via n8n workflow successfully");
      res.status(200).json({ message: "OTP sent successfully" });
    } else {
      throw new Error(`n8n workflow returned status: ${response.status}`);
    }
  } catch (error) {
    console.error("❌ [SEND OTP] Error:", error.message);

    // Provide more specific error messages
    if (error.code === "ECONNABORTED") {
      res.status(500).json({
        message: "Request timeout - n8n workflow took too long to respond",
      });
    } else if (error.code === "ECONNREFUSED") {
      res.status(500).json({
        message: "Cannot connect to n8n workflow - service unavailable",
      });
    } else {
      res
        .status(500)
        .json({ message: "Failed to send OTP", error: error.message });
    }
  }
});

// ✅ Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  // ✅ Fetch OTP from memory
  const storedOtpData = otpStorage[email];

  if (!storedOtpData) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  if (Date.now() > storedOtpData.expiresAt) {
    delete otpStorage[email]; // Remove expired OTP
    return res.status(400).json({ message: "OTP expired" });
  }

  if (storedOtpData.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // ✅ OTP matched → Remove from memory
  delete otpStorage[email];

  res.status(200).json({ message: "OTP verified successfully" });
});

module.exports = router;
