# 🛠️ Step-by-Step Firebase Setup Guide for Sahayak Attendance

This guide provides exact steps to connect your Firebase Firestore project for tamper-resistant volunteer attendance tracking.

---

## 1. Create a Firebase Project

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Name your project (e.g., `sahayak-attendance-hackathon`).
4. Disable Google Analytics (optional, not needed for prototype).
5. Click **Create project**.

---

## 2. Enable Firestore Database

1. In the left sidebar, click **Build** → **Firestore Database**.
2. Click **Create database**.
3. Choose a database location close to your users (e.g., `asia-south1` for Mumbai/India).
4. Select **Start in production mode**.
5. Click **Enable**.

---

## 3. Apply Firestore Security Rules

1. In the Firestore Database tab, click the **Rules** tab at the top.
2. Open the [`firestore.rules`](file:///c:/Users/sonal/Desktop/Sahayak%20%E2%80%94%20Community%20Volunteer%20Coordination%20Platform_files/firestore.rules) file in this repository.
3. Copy and paste the entire contents into the Firebase Console rules editor.
4. Click **Publish**.

*These rules enforce that:*
- Volunteers can **only append** their own check-in records with `serverCreatedAt: request.time`.
- Volunteers **cannot edit or delete** existing attendance records.
- Only authenticated NGOs can update status (`VERIFIED`, `FLAGGED`) with reviewer audit notes.

---

## 4. Register a Web App & Get Config

1. In the Firebase Project Overview, click the **Web icon (`</>`)** to add an app.
2. Enter App nickname (e.g., `Sahayak Web Client`).
3. Click **Register app**.
4. You will see a `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-YourApiKeyHere...",
  authDomain: "sahayak-attendance.firebaseapp.com",
  projectId: "sahayak-attendance",
  storageBucket: "sahayak-attendance.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## 5. Where to Paste the Config in Sahayak

Open [`env.js`](file:///c:/Users/sonal/Desktop/Sahayak%20%E2%80%94%20Community%20Volunteer%20Coordination%20Platform_files/env.js) and fill in your Firebase keys:

```javascript
window.ENV = {
  // Existing Supabase (preserved)
  SUPABASE_URL: "https://wpyqindosvzkobyqhbog.supabase.co",
  SUPABASE_KEY: "sb_publishable_zp00DP1wifLG8zb6eo6TmA_FqnM2Jaz",
  SUPABASE_ANON_KEY: "sb_publishable_zp00DP1wifLG8zb6eo6TmA_FqnM2Jaz",

  // Firebase Configuration (for Tamper-Resistant Attendance)
  FIREBASE_API_KEY: "AIzaSyD-YourApiKeyHere...",
  FIREBASE_AUTH_DOMAIN: "sahayak-attendance.firebaseapp.com",
  FIREBASE_PROJECT_ID: "sahayak-attendance",
  FIREBASE_STORAGE_BUCKET: "sahayak-attendance.appspot.com",
  FIREBASE_MESSAGING_SENDER_ID: "123456789012",
  FIREBASE_APP_ID: "1:123456789012:web:abcdef123456"
};
```

### 🔒 Is it safe to expose these Firebase keys on GitHub Pages?
**Yes.** Firebase client configuration (`apiKey`, `projectId`, etc.) is intended to be public in browser SPAs. True security is enforced entirely by your **Firestore Security Rules** (`firestore.rules`), which validate timestamps, prevent record mutations, and restrict delete permissions.

---

## 6. High-Availability Fallback
If Firebase keys are not yet configured, the system operates seamlessly with its **Local Append-Only Audit Trail Engine** so you can immediately demo the entire end-to-end flow to your mentor offline or on-stage!
