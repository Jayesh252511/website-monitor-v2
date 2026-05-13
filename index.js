require("dotenv").config();
const axios = require("axios");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const URLS = process.env.URLS.split(",").map((u) => u.trim());

// Store status + last alert time
let websiteData = {};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendEmail(subject, message) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAILS,
      subject,
      text: message,
    });
    console.log("📩 Email sent:", subject);
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
}

async function checkWebsite(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });

    if (res.status >= 200 && res.status < 400) {
      await handleStatus(url, "UP");
    } else {
      await handleStatus(url, "DOWN");
    }
  } catch {
    await handleStatus(url, "DOWN");
  }
}

async function handleStatus(url, currentStatus) {
  const now = Date.now();
  const data = websiteData[url] || {};

  // First time
  if (!data.status) {
    websiteData[url] = { status: currentStatus, lastAlert: now };

    await sendEmail(
      `ℹ️ Initial Status: ${currentStatus}`,
      `${url}\nStatus: ${currentStatus}\nTime: ${new Date()}`
    );

    console.log(`🔔 First check: ${url} → ${currentStatus}`);
    return;
  }

  // Status changed
  if (data.status !== currentStatus) {
    websiteData[url] = { status: currentStatus, lastAlert: now };

    await sendEmail(
      `🔄 Status Changed: ${currentStatus}`,
      `${url}\nNew Status: ${currentStatus}\nTime: ${new Date()}`
    );

    console.log(`🚨 Change detected: ${url} → ${currentStatus}`);
    return;
  }

  // If still DOWN → send reminder every 1 hour
  if (currentStatus === "DOWN") {
    const oneHour = 5 * 60 * 60 * 1000;

    if (!data.lastAlert || now - data.lastAlert >= oneHour) {
      websiteData[url].lastAlert = now;

      await sendEmail(
        `⏰ Reminder: Still DOWN`,
        `${url} is still DOWN\nTime: ${new Date()}`
      );

      console.log(`⏰ Reminder sent: ${url} still DOWN`);
    } else {
      console.log(`⏳ Waiting for reminder: ${url}`);
    }
  } else {
    console.log(`✅ No change: ${url} → UP`);
  }
}

async function runChecks() {
  console.log("\n⏳ Checking all websites...\n");

  for (let url of URLS) {
    await checkWebsite(url);
  }
}

// Every 15 minutes
cron.schedule("*/15 * * * *", runChecks);

// Run immediately
runChecks();