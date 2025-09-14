const express = require("express");
const router = express.Router();
const emailService = require("../utils/emailService");
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

    // ✅ Send email using email service
    const result = await emailService.sendOTP(email, otp);

    if (result.success) {
      res.status(200).json({ message: "OTP sent successfully" });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("❌ [SEND OTP] Error:", error);
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
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
