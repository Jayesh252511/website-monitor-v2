require("dotenv").config();
const axios = require("axios");
const nodemailer = require("nodemailer");

const URLS = (process.env.URLS || "").split(",").map((u) => u.trim()).filter(Boolean);

if (URLS.length === 0) {
  console.error("❌ No URLs configured.");
  process.exit(1);
}

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
  console.log(`🔍 Checking: ${url}`);
  try {
    const res = await axios.get(url, { timeout: 15000 });
    if (res.status >= 200 && res.status < 400) {
      console.log(`✅ ${url} is UP`);
    } else {
      console.log(`🚨 ${url} is DOWN (Status: ${res.status})`);
      await sendEmail(`🔴 WEBSITE DOWN: ${url}`, `${url} is DOWN. Status: ${res.status}\nTime: ${new Date()}`);
    }
  } catch (err) {
    console.log(`🚨 ${url} is DOWN (Error: ${err.message})`);
    await sendEmail(`🔴 WEBSITE DOWN: ${url}`, `${url} is DOWN or Unreachable.\nError: ${err.message}\nTime: ${new Date()}`);
  }
}

async function runOnce() {
  console.log("🚀 Starting Uptime Check...");
  for (let url of URLS) {
    await checkWebsite(url);
  }
  console.log("🏁 Check complete.");
}

runOnce().catch(console.error);
