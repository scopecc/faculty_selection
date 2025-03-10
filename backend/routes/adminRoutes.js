const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const nodemailer = require("nodemailer");

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username, password });
        
        if (!admin) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        
        res.json({ message: "Login successful" });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//route for handling forgot password
router.post("/forgot-password", async (req, res) => {
    try {
        const { username } = req.body;
        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            return res.status(401).json({ message: "Invalid username" });
        }

        // Create HTML email content
        const mailOptions = {
            from: 'scopecc.wat@vit.ac.in', // Replace with your Gmail address
            to: 'scopecc.wat@vit.ac.in',
            subject: 'Admin Credentials',
            html: `
                <h2>Admin Credentials</h2>
                <p><strong>Username:</strong> ${admin.username}</p>
                <p><strong>Password:</strong> ${admin.password}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Password reset email sent" });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: "Error sending email" });
    }
});

//route for handling reset password
router.post("/reset-password", async (req, res) => {
    try {
        const { username, oldPassword, newPassword } = req.body;
        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            return res.status(401).json({ message: "Invalid username" });
        }

        // Verify old password
        if (admin.password !== oldPassword) {
            return res.status(401).json({ message: "Invalid old password" });
        }

        // Update the admin's password with the new password
        admin.password = newPassword;
        await admin.save();
        
        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: "Error resetting password" });
    }
});

module.exports = router;
