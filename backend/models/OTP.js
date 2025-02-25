const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now}, // Auto-delete after 5 minutes
});

module.exports = mongoose.model("Otp", otpSchema); // ✅ Ensure consistent model name
