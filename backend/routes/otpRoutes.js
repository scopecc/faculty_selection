const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

// ✅ MongoDB OTP Schema
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, expires: 300, default: Date.now }, // OTP expires in 5 minutes
});

const Otp = mongoose.model("Otp", otpSchema);

// ✅ Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Endpoint to send OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Delete any existing OTP for this email
    await Otp.deleteOne({ email });

    // Save new OTP to MongoDB
    await Otp.create({ email, otp });

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Faculty Registration",
      text: `Your OTP is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP", error });
  }
});

// ✅ Endpoint to verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const storedOtp = await Otp.findOne({ email });

    if (!storedOtp || storedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Delete OTP after successful verification
    await Otp.deleteOne({ email });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP", error });
  }
});

module.exports = router;
