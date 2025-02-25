const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

const Otp = require("../models/OTP"); // ✅ Correct way



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
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    await Otp.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );
        console.log("Stored OTP:", storedOtp?.otp); 
    console.log("User Entered OTP:", otp);
    console.log("OTP Match:", storedOtp?.otp === otp);

    

    if (!storedOtp || storedOtp.otp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    

    // ✅ OTP Matched → Delete after verification
    await Otp.deleteOne({ email });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error); // ✅ Debug
    res.status(500).json({ message: "Error verifying OTP", error });
  }
});


module.exports = router;
