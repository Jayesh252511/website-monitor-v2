# 🕷️ Website Monitor & Deep Link Crawler

A professional Node.js tool that does **two things**:

1. **Uptime Monitor** — Checks if your websites are UP or DOWN every 15 minutes and emails you when something changes.
2. **Deep Crawler** — Visits every page on your website, finds broken buttons/links, and sends you a clean report by email.

---

## 📋 What You Need Before Starting

Before you begin, make sure you have these installed on your computer:

- **Node.js** (version 18 or higher) → Download from [nodejs.org](https://nodejs.org)
- **Git** → Download from [git-scm.com](https://git-scm.com)
- A **Gmail account** (to send email reports)

---

## 🚀 Step-by-Step Setup Guide

### Step 1 — Download the project

Open your terminal (Command Prompt or PowerShell on Windows) and run:

```bash
git clone https://github.com/YOUR-USERNAME/website-monitor.git
cd website-monitor
```

> Replace `YOUR-USERNAME` with your actual GitHub username.

---

### Step 2 — Install the packages

This command downloads everything the project needs to run:

```bash
npm install
```

Wait for it to finish. You will see a `node_modules` folder appear. That's normal!

---

### Step 3 — Create your `.env` file

This is the most important step. The `.env` file holds your private settings (email, password, websites to scan).

In the `website-monitor` folder, create a new file called exactly `.env` (with a dot at the start).

Copy and paste this into it:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password-here
ALERT_EMAILS=your-gmail@gmail.com
URLS=https://yourwebsite.com
```

Replace each value with your own (see explanations below 👇).

---

### Step 4 — Fill in your `.env` values

#### `EMAIL_USER`
This is the Gmail address that will **send** the reports.
```
EMAIL_USER=jayesh@gmail.com
```

---

#### `EMAIL_PASS` — How to get your Gmail App Password

> ⚠️ This is NOT your normal Gmail login password. You need a special **App Password**.

Follow these steps:

1. Go to → [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** on the left side
3. Find **"2-Step Verification"** and turn it **ON** (required first)
4. Go back to **Security** and find **"App Passwords"**
5. Under "App name" type: `website-monitor`
6. Click **Create**
7. Google shows you a **16-letter password** like: `mbtv aloc sjrc ubmt`
8. Copy it **without spaces** and paste it into `.env`:

```
EMAIL_PASS=mbtvalocsjrcubmt
```

---

#### `ALERT_EMAILS`
The Gmail address that will **receive** the reports. Can be same as `EMAIL_USER`.
```
ALERT_EMAILS=jayesh@gmail.com
```

---

#### `URLS`
The websites you want to **monitor for uptime**. For multiple websites, separate them with a comma:
```
URLS=https://website1.com,https://website2.com,https://website3.com
```

---

#### `CRAWL_URLS` *(optional — for deep link scanning)*
The websites you want to **deep crawl for broken links**. If you skip this, it uses `URLS` automatically.
```
CRAWL_URLS=https://website1.com/en,https://website2.com/en
```

---

#### `CRAWL_SCHEDULE` *(optional)*
When the deep scan runs. Default is every day at 9:00 AM.
```
CRAWL_SCHEDULE=0 9 * * *
```

---

#### `CRAWL_MAX_PAGES` *(optional)*
Maximum pages to scan per website. Default is 500.
```
CRAWL_MAX_PAGES=500
```

---

### Step 5 — Run the tools

#### Run the Uptime Monitor:
```bash
node index.js
```
This checks your websites every 15 minutes and emails you if any go down.

#### Run the Deep Crawler (broken link finder):
```bash
node deep-scan.js
```
This visits every page on your websites, finds broken buttons/links, and emails you a full report.

---

## 📧 What the Email Report Looks Like

```
══════════════════════════════════════════════════════
     WEBSITE HEALTH REPORT — OVERALL SUMMARY
══════════════════════════════════════════════════════

Scan Date         : 13/05/2026, 9:00:00 AM
Total Sites       : 3
Total Pages       : 312
Total Broken Links: 1

Site Status:
  🟢 Healthy   : 2
  🟡 Warning   : 1
  🔴 Critical  : 0

══════════════════════════════════════════════════════
https://yourwebsite.com/en
══════════════════════════════════════════════════════

Status          : 🟡 WARNING
Pages Crawled   : 233
Broken Links    : 1

──────────────────────────────────────────────────────

1. Broken Button Detected

   Button Text :
   "Career"

   Broken Redirect URL :
   https://yourwebsite.com/en/career/

   Error :
   404 Not Found

   Button Found On Pages (3):

   • https://yourwebsite.com/en
   • https://yourwebsite.com/en/admissions
   • https://yourwebsite.com/en/contact-us
```

---

## ⚡ Run Both at the Same Time with PM2

PM2 keeps your scripts running forever, even after you close the terminal or restart your computer.

#### Install PM2:
```bash
npm install -g pm2
```

#### Start both processes:
```bash
pm2 start index.js --name "uptime-monitor"
pm2 start deep-scan.js --name "deep-crawler"
pm2 save
pm2 startup
```

#### Useful PM2 commands:
```bash
pm2 list              # See all running processes
pm2 logs              # See live output/logs
pm2 restart all       # Restart everything
pm2 stop all          # Stop everything
```

---

## 📁 Project File Structure

```
website-monitor/
├── index.js          ← Uptime monitor (runs every 15 min)
├── crawler.js        ← Core BFS deep crawling engine
├── reporter.js       ← Email report builder
├── deep-scan.js      ← Deep crawler entry point
├── package.json      ← Project info + package list
├── .env              ← YOUR PRIVATE SETTINGS (never upload this!)
├── .gitignore        ← Tells Git to ignore .env and node_modules
└── README.md         ← This file
```

---

## 📦 Packages Used

| Package | What it does |
|---|---|
| `axios` | Sends web requests to check links |
| `cheerio` | Reads HTML pages to find all links |
| `dotenv` | Reads your `.env` settings file |
| `node-cron` | Runs tasks on a schedule (like a timer) |
| `nodemailer` | Sends emails via Gmail |

---

## ❓ Common Problems

**"Cannot find module" error**
→ Run `npm install` first.

**Emails not sending**
→ Make sure you used an **App Password**, not your Gmail login password.
→ Make sure 2-Step Verification is ON in your Google account.

**No broken links found but I know there are some**
→ The crawler only checks internal pages. Make sure your `URLS` starts with the correct path (e.g. `https://site.com/en` not just `https://site.com`).

---

## 🔒 Security

- **Never upload your `.env` file to GitHub.** It contains your email password.
- The `.gitignore` file in this project already protects you from accidentally doing this.
- If you accidentally commit `.env`, change your Gmail App Password immediately.

---

*Built with ❤️ for website quality monitoring.*
