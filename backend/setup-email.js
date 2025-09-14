#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔧 Faculty Selection - Email Setup\n");

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupEmail() {
  console.log(
    "This script will help you configure email settings for your application.\n"
  );

  console.log("📧 Email Service Options:");
  console.log("1. Gmail (requires App Password)");
  console.log("2. SendGrid (recommended for production)");
  console.log("3. Custom SMTP");
  console.log("4. Skip (use existing configuration)\n");

  const choice = await askQuestion("Choose an option (1-4): ");

  let envContent = "";

  switch (choice) {
    case "1":
      console.log("\n📧 Gmail Configuration:");
      const gmailUser = await askQuestion("Enter your Gmail address: ");
      const gmailPass = await askQuestion("Enter your Gmail App Password: ");

      envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/faculty_selection

# Gmail Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=${gmailUser}
EMAIL_PASS=${gmailPass}

# Server
PORT=5000
NODE_ENV=production
`;
      break;

    case "2":
      console.log("\n📧 SendGrid Configuration:");
      const sendgridKey = await askQuestion("Enter your SendGrid API Key: ");
      const sendgridEmail = await askQuestion(
        "Enter your verified sender email: "
      );

      envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/faculty_selection

# SendGrid Configuration
SENDGRID_API_KEY=${sendgridKey}
EMAIL_FROM=${sendgridEmail}

# Server
PORT=5000
NODE_ENV=production
`;
      break;

    case "3":
      console.log("\n📧 Custom SMTP Configuration:");
      const smtpHost = await askQuestion("Enter SMTP host: ");
      const smtpPort =
        (await askQuestion("Enter SMTP port (default 587): ")) || "587";
      const smtpUser = await askQuestion("Enter SMTP username: ");
      const smtpPass = await askQuestion("Enter SMTP password: ");
      const smtpSecure = await askQuestion("Use SSL? (y/n): ");

      envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/faculty_selection

# Custom SMTP Configuration
EMAIL_SERVICE=
SMTP_HOST=${smtpHost}
SMTP_PORT=${smtpPort}
SMTP_SECURE=${smtpSecure.toLowerCase() === "y" ? "true" : "false"}
EMAIL_USER=${smtpUser}
EMAIL_PASS=${smtpPass}
EMAIL_FROM=${smtpUser}

# Server
PORT=5000
NODE_ENV=production
`;
      break;

    case "4":
      console.log("Skipping email configuration setup.");
      rl.close();
      return;

    default:
      console.log("Invalid choice. Exiting.");
      rl.close();
      return;
  }

  // Write .env file
  const envPath = path.join(__dirname, ".env");
  fs.writeFileSync(envPath, envContent);

  console.log("\n✅ .env file created successfully!");
  console.log("📁 Location:", envPath);

  console.log("\n🧪 Testing email configuration...");
  console.log("Run: node test-email.js");

  rl.close();
}

setupEmail().catch(console.error);
