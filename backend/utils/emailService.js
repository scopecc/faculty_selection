const nodemailer = require("nodemailer");
require("dotenv").config();

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    // SendGrid configuration (recommended for production)
    if (process.env.SENDGRID_API_KEY) {
      return nodemailer.createTransporter({
        service: "sendgrid",
        auth: {
          user: "apikey",
          pass: process.env.SENDGRID_API_KEY,
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      });
    }

    // MailerSend configuration (if using MailerSend SMTP)
    if (process.env.MAILERSEND_SMTP_HOST) {
      return nodemailer.createTransporter({
        host: process.env.MAILERSEND_SMTP_HOST,
        port: process.env.MAILERSEND_SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.MAILERSEND_SMTP_USER,
          pass: process.env.MAILERSEND_SMTP_PASS,
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 20000,
        rateLimit: 5,
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    // Gmail or custom SMTP configuration
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || "gmail",
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true" || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000,
      rateLimit: 5,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendOTP(email, otp) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Faculty Registration",
      text: `Your OTP is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Faculty Registration OTP</h2>
          <p>Your One-Time Password (OTP) for faculty registration is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ OTP email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send OTP email:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendAdminCredentials(email, username, password) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Admin Credentials - Faculty Selection System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Admin Credentials</h2>
          <p>Here are your admin credentials for the Faculty Selection System:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #dc3545;"><strong>Important:</strong> Please change your password after first login.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        "✅ Admin credentials email sent successfully:",
        info.messageId
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(
        "❌ Failed to send admin credentials email:",
        error.message
      );
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: "Email service connection successful" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
