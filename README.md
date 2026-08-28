# 🏥 Saveetha Urology DJ Stent Tracker & Overdue Prevention System

A comprehensive, 100% free web application for tracking Double-J (DJ) Stents for the **Department of Urology at Saveetha Medical College and Hospital**.

Built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Supabase (PostgreSQL)**, and **whatsapp-web.js** for zero-cost automated WhatsApp reminders.

---

## ✨ Key Features

1. **Core Business Logic & Default Stent Lifespans**:
   - **Regular Stent**: 90 days
   - **Carbothane Stent**: 180 days
   - **Silicone Stent**: 365 days
   - **Bilateral Priority Rule**: Automatically prioritizes the stent with the shortest remaining time.
   - **Exchange Protocol**: Seamlessly archives old stents as `"Exchanged"` and creates a new active stent resetting the lifespan clock.

2. **Deduplication Engine**:
   - Live real-time checking during registration. If an active stent exists for that UHID & Side, the app alerts staff and offers a 1-click **"Exchange Stent Instead"** modal.

3. **Technician Calling Queue**:
   - Filtered queue of Due (T-0) and Overdue patients.
   - 1-click telephone dialer (`tel:`).
   - In-line dropdown to log call outcomes:
     - *"Patient not answering"*
     - *"Promised to come"*
     - *"Refused - High Risk"*
     - *"Scheduled for OPD"*
     - *"Family Notified"*
     - *"Number Invalid / Switched Off"*
   - Audit trail of previous call history.

4. **Bilingual Messaging Engine (Zero-Cost Gateway)**:
   - Automated via `whatsapp-web.js` (no Meta API fees or SMS costs).
   - **First Half**: ALWAYS in English.
   - **Second Half**: Either in **Tamil** or **Hindi** based on the patient's `second_language`.
   - Dynamic placeholders: `[Patient Name]`, `[Laterality]`, `[Insertion Date]`, `[Due Date]`.
   - **Notification Schedule Matrix**:
     - **Pre-Expiry**: T - 30 days & T - 14 days
     - **Day of Removal**: T - 0 (On the day)
     - **Overdue**: T + 14 days, T + 30 days, T + 90 days, T + 180 days
     - **Severely Overdue**: Every 30 days sequentially after T + 180 days until marked "Removed"
     - **Removal Confirmation**: One-time confirmation message

5. **Interactive Dashboard & Triage Matrix**:
   - Urgency KPI Cards (Active Stents, Due Today, Overdue, Severely Overdue, Stents Removed).
   - Search by UHID, Name, Phone, Surgeon.
   - Filters for Urology Unit 1 / Unit 2, Urgency Status, and Stent Material.
   - Quick action buttons: Log Call, Mark Removed, Exchange Stent, Preview Bilingual WhatsApp payload.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Local Preview)
Copy `.env.example` to `.env.local`:
```bash
# Supabase settings (app includes local mock fallback if empty)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WhatsApp Gateway Port
WHATSAPP_SERVICE_PORT=3001
WHATSAPP_API_URL=http://localhost:3001
```

### 3. Run the Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📲 Zero-Cost WhatsApp Gateway Setup

To enable live WhatsApp notifications from your department's phone:

1. In a separate terminal, start the local WhatsApp daemon:
   ```bash
   npm run whatsapp-service
   ```
2. Navigate to **WhatsApp Center** (`/whatsapp-center`) in the web UI, or scan the QR code printed in the terminal using the hospital phone's WhatsApp (*Linked Devices*).
3. Once authenticated, all automated notifications and manual test messages will be dispatched directly through your WhatsApp account with zero API fees.

---

## ⏰ Daily Cron Job

The daily notification evaluation can be run as a background service or triggered on demand:

- **Run in background (daily at 08:00 AM)**:
  ```bash
  npm run cron-job
  ```
- **Trigger single evaluation immediately via CLI**:
  ```bash
  node scripts/cron-service.js --now
  ```
- **Trigger from UI**: Click **"Run Daily Check"** on the Dashboard.
- **Trigger via Webhook / External HTTP**: `POST /api/cron/trigger`

---

## 🗄️ Database Setup (Supabase)

To deploy on Supabase:
1. Create a new project on [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy and run the entire contents of [`schema.sql`](./schema.sql).
4. Copy your **Project URL** and **anon / service_role API keys** into `.env.local`.

---

## 🛡️ License & Hospital Credit
Built for the **Department of Urology, Saveetha Medical College & Hospital**, Thandalam, Chennai.
100% Free & Open-Source Clinical Registry System.