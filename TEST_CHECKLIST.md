# 🧪 Test & Verification Checklist (Regression + Attendance)

Run through this checklist to ensure all existing features remain 100% operational and the new attendance verification flow works smoothly.

---

## Part 1: Regression Test (Existing Features)

- [ ] **Landing Page & Role Selection**:
  - Landing page loads with full layout and hero section.
  - Clicking "Volunteer View" switches to volunteer auth tab.
  - Clicking "NGO Coordinator" switches to NGO auth tab.
- [ ] **Volunteer Identity Verification**:
  - Opening Volunteer Profile shows "Identity Verification" card.
  - Validates 12-digit Aadhaar & consent checkbox.
  - OTP modal validates demo code `123456` and updates status to `✓ Identity Verified`.
- [ ] **NGO Organization Registration**:
  - Opening NGO Registration modal shows the **multi-select checkbox group** for Primary Causes / Focus Sectors.
  - Checking "Other" reveals the custom cause input field.
  - Registration successfully creates the NGO account.
- [ ] **Navigation & Existing Pages**:
  - Volunteer Dashboard, Profile, Opportunities, Smart Match, Deployments, Emergency, Analytics, Settings load correctly.
  - NGO Dashboard, Events & Drives, Volunteer Roster, Smart Match Engine, Emergency Center load correctly.

---

## Part 2: Tamper-Resistant Attendance System (New Feature)

- [ ] **Sidebar Navigation**:
  - In Volunteer Portal: Sidebar has **"Attendance"** tab.
  - In NGO Portal: Sidebar has **"Attendance Telemetry"** tab.
- [ ] **Mentor Demo Mode Toggle**:
  - Toggle "Mentor Demo Mode" ON in the top right.
  - Banner appears indicating on-site coordinates are simulated for indoor testing.
- [ ] **Volunteer Check-In Workflow**:
  - Tap **"Verified On-Site Check In"**.
  - Modal opens showing 3 verification steps (GPS Geofence, Live Camera Stream, Rotating QR).
  - Video stream starts (or displays demo poster in Demo Mode).
  - Click **"Confirm Verified Check In"**.
  - Success toast appears with Trust Score (e.g. `94% HIGH`).
  - Active session updates to **"ON-SITE DEPLOYED"**.
- [ ] **Volunteer Check-Out Workflow**:
  - Tap **"Verified Check Out & Conclude"**.
  - Modal verifies final snapshot and concludes shift.
  - Verified hours are calculated and added to the total.
  - Record appears in the **Verified Attendance History** table.
- [ ] **Trust Score Analysis**:
  - Click any Trust Score badge (e.g., `🛡️ 96%`) in the table.
  - Analysis modal opens displaying the breakdown of passed signals (GPS, Selfie, QR, server time).
- [ ] **NGO Attendance Telemetry & Review**:
  - Switch to NGO Portal (`NGO Coordinator`).
  - Navigate to **"Attendance Telemetry"**.
  - Rotating QR canvas refreshes dynamically every 45 seconds with live countdown timer.
  - Click **"Fullscreen QR Broadcast"** to launch on-site kiosk mode.
  - In the Roster table, click **"Approve"** or **"Flag"** with a custom audit note.
  - Click **"Export CSV Audit"** and confirm download of verified records.
