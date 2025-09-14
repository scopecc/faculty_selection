const nodemailer = require("nodemailer");
require("dotenv").config();

// Test email configuration
async function testEmailConfig() {
  console.log("🧪 Testing Email Configuration...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || "gmail"}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || "NOT SET"}`);
  console.log(
    `EMAIL_PASS: ${process.env.EMAIL_PASS ? "***SET***" : "NOT SET"}`
  );
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || "NOT SET"}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || "NOT SET"}`);
  console.log(
    `MAILERSEND_SMTP_HOST: ${process.env.MAILERSEND_SMTP_HOST || "NOT SET"}`
  );
  console.log(
    `MAILERSEND_SMTP_USER: ${process.env.MAILERSEND_SMTP_USER || "NOT SET"}`
  );
  console.log(
    `MAILERSEND_SMTP_PASS: ${
      process.env.MAILERSEND_SMTP_PASS ? "***SET***" : "NOT SET"
    }\n`
  );

  // Check for MailerSend configuration
  if (process.env.MAILERSEND_SMTP_HOST) {
    console.log("📧 Using MailerSend SMTP configuration");
    if (
      !process.env.MAILERSEND_SMTP_USER ||
      !process.env.MAILERSEND_SMTP_PASS
    ) {
      console.error("❌ Missing MailerSend SMTP credentials!");
      return;
    }
  } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing required environment variables!");
    console.log("Please set EMAIL_USER and EMAIL_PASS in your .env file");
    return;
  }

  // Create transporter with same config as your app
  let transporterConfig;

  if (process.env.MAILERSEND_SMTP_HOST) {
    // MailerSend configuration
    transporterConfig = {
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
    };
  } else {
    // Standard SMTP configuration
    transporterConfig = {
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
    };
  }

  const transporter = nodemailer.createTransporter(transporterConfig);

  try {
    console.log("🔌 Testing SMTP connection...");

    // Verify connection
    await transporter.verify();
    console.log("✅ SMTP connection successful!\n");

    // Test sending email
    console.log("📧 Testing email send...");
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const testEmail = {
      from: fromEmail,
      to: fromEmail, // Send to yourself for testing
      subject: "Test Email - Faculty Selection App",
      text: "This is a test email to verify your SMTP configuration is working correctly.",
      html: `
        <h2>Test Email - Faculty Selection App</h2>
        <p>This is a test email to verify your SMTP configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ${fromEmail}</p>
      `,
    };

    const info = await transporter.sendMail(testEmail);
    console.log("✅ Test email sent successfully!");
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Response: ${info.response}`);
  } catch (error) {
    console.error("❌ Email test failed:");
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);

    if (error.code === "ETIMEDOUT") {
      console.log("\n💡 Suggestions for timeout issues:");
      console.log(
        "1. Check if your deployment environment allows SMTP connections"
      );
      console.log("2. Try using a different email service (SendGrid, Mailgun)");
      console.log("3. Verify your Gmail App Password is correct");
      console.log("4. Check firewall settings on your server");
    } else if (error.code === "EAUTH") {
      console.log("\n💡 Suggestions for authentication issues:");
      console.log("1. Verify your email credentials");
      console.log(
        "2. For Gmail, make sure you're using an App Password, not your regular password"
      );
      console.log("3. Enable 2-Factor Authentication on your Gmail account");
    }
  }
}

// Run the test
testEmailConfig().catch(console.error);
