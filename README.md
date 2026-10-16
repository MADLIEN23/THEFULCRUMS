# ToolTrack - Workshop & Factory Equipment Lifecycle System

ToolTrack is an industrial tool lifecycle and audit management platform engineered for workshops, machine shops, and manufacturing plants. It tracks equipment across all nine operational states:
Registered -> Received -> Inspected -> Issued -> In Use -> Returned -> Sent for Maintenance -> Repaired -> Retired.

Built for hackathons and local evaluation: runs entirely on your laptop with zero external cloud dependencies and no paid services.

---

## 1. Tech Stack Overview

- **Frontend**: React (Vite) + Tailwind CSS (slate industrial theme, high-contrast status colors, print stylesheet for labels).
- **Backend**: Node.js + Express.
- **Database**: Native SQLite (`node:sqlite`) with WAL mode and immutable audit logging.
- **QR Engine**: `qrcode` (dynamic printable tag generation) + `html5-qrcode` (camera barcode scanning and image file processing).
- **Authentication**: JWT authentication with Role-Based Access Control (RBAC).

---

## 2. Quick Start Instructions

### Prerequisites
- Node.js v22+ or v24+ (verified on Node v24).
- No external databases (PostgreSQL/MySQL) or paid cloud tools needed.

### Step 1: Initialize Database and Seed Data
```powershell
cd tooltrack/backend
npm install
npm run seed
```

### Step 2: Start Backend Server
```powershell
cd tooltrack/backend
npm run dev
```
Backend API will listen on `http://localhost:5000`.

### Step 3: Start Frontend Terminal
In a second terminal:
```powershell
cd tooltrack/frontend
npm install
npm run dev
```
Open `http://localhost:5173` in any modern web browser.

---

## 3. Demo Roles & Test Credentials

All demo accounts share the password: `password123`

| Username | Role | Full Name | Department | Primary Permissions |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | Admin | Alex Rivera | Shop Management | Fleet management, tool decommissioning/retiring, system reports |
| `operator` | Operator | Marcus Vance | Assembly | Tool checkout, returns, reporting defects, receiving intake deliveries |
| `inspector` | Inspector | Sarah Chen | Quality Assurance | QA calibration inspections, repair signoffs, returning tools to service |

The login screen also provides 1-click role buttons to switch personas instantly during live demonstrations.

---

## 4. Key Endpoints Summary

- `POST /api/auth/login`: Authenticate and receive JWT session pass.
- `GET /api/tools`: Query fleet with search, department, location, status, and date range filters.
- `POST /api/tools`: Intake new tool with automated `TL-10XX` ID sequencing and initial audit record.
- `GET /api/tools/:id`: Retrieve tool profile, high-resolution QR asset tag, and full chronological timeline.
- `POST /api/tools/:id/events`: Append immutable status event (who, when, location, notes, optional photo, defect flag).
- `GET /api/alerts`: Real-time operational red flags (overdue checkouts, uninspected tools, calibration due).
- `GET /api/reports/summary`: Fleet availability, turnaround time, maintenance frequency, and dormant items.
- `GET /api/reports/csv`: Comma-separated spreadsheet download of all equipment.

---

## 5. Production Launch & Custom Domain Setup

1. **Custom Favicon**: Implemented at `frontend/public/favicon.svg`.
2. **Compliance Pages**:
   - Privacy Policy live at `/privacy`.
   - Terms and Conditions live at `/terms`.
3. **No Third-Party AI Badges**: Clean code base with zero AI watermarks.
4. **Connecting a Custom Domain (e.g. `tooltrack.factory.internal` or `yourdomain.com`)**:
   - In your DNS provider (Cloudflare, Namecheap, Route 53):
     - For production server: Add an `A` record pointing `@` to your server public IPv4.
     - Add a `CNAME` record pointing `www` or `tools` to your server hostname.
   - For reverse proxy (Nginx / Caddy):
     ```nginx
     server {
       server_name tooltrack.yourdomain.com;
       location /api/ {
         proxy_pass http://localhost:5000;
       }
       location / {
         proxy_pass http://localhost:5173;
       }
     }
     ```
