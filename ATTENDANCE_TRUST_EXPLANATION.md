# 🛡️ How Sahayak Ensures Trust in Volunteer Attendance
### A 1-Page Briefing on Anti-Tamper Mechanisms, Threat Models, & Limitations

---

## 1. Executive Summary
In disaster response and relief operations, NGOs need absolute confidence that volunteers are genuinely present on-site before issuing certifications, disbursing relief allowances, or reporting to government bodies (e.g., NDMA).

Sahayak replaces honor-system check-ins with a **multi-factor anti-tamper attendance verification architecture** combining high-accuracy geolocation, in-app biometrics, rotating cryptographic tokens, and immutable server timestamps.

---

## 2. The Multi-Layer Verification Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │                  VOLUNTEER CHECK-IN FLOW                     │
   ├──────────────────┬──────────────────┬───────────────────────┤
   │ 1. High-Accuracy │ 2. Live In-App   │ 3. Dynamic Rotating   │
   │    GPS Geofence  │    Camera Selfie │    Cryptographic QR   │
   │   (<100m / <50m) │ (Direct Stream)  │ (45s Time-Boxed Slot) │
   └─────────┬────────┴────────┬─────────┴───────────┬───────────┘
             │                 │                     │
             ▼                 ▼                     ▼
   ┌─────────────────────────────────────────────────────────────┐
   │         ANTI-SPOOFING HEURISTICS & TRUST SCORE ENGINE       │
   │   (Velocity jump check, mock-GPS detection, accuracy check) │
   └───────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
   ┌─────────────────────────────────────────────────────────────┐
   │          APPEND-ONLY FIRESTORE AUDIT TRAIL LOG              │
   │   (Immutable serverTimestamp(), Volunteer Create-Only)      │
   └─────────────────────────────────────────────────────────────┘
```

---

## 3. Attack Vectors & Countermeasures

| Attack Vector / Exploit | How an Attacker Attempts It | Sahayak's Tamper-Resistant Defense |
| :--- | :--- | :--- |
| **1. Fake Location (Mock GPS)** | Using FakeGPS / Developer Options / Android Emulators to fake coordinates. | • Rejects `accuracy === 0` (standard mock GPS signature).<br>• Enforces high accuracy threshold (< 50m).<br>• Speed calculation flags teleportation velocity jumps (>160 km/h). |
| **2. Ghost / Proxy Check-In** | A friend at home checks in on behalf of an absent volunteer. | • Single active device per session.<br>• Requires live selfie direct from camera stream (no gallery/file upload). |
| **3. Replaying Stale QR Codes** | Taking a photo or screenshot of the on-site QR code and sharing it on WhatsApp. | • Dynamic Rotating QR code regenerates every **45 seconds** using a time-boxed cryptographic hash.<br>• Stale screenshots are instantly rejected. |
| **4. Device Clock Manipulation** | Rolling back phone clock to claim on-time attendance. | • Check-in records enforce **Firestore `serverTimestamp()`** / `request.time`. Phone local clocks are ignored. |
| **5. Tampering with Past Records** | Modifying attendance hours in localStorage or database. | • Firestore Security Rules (`firestore.rules`) enforce **Create-Only** for volunteers.<br>• Records are append-only with full audit trail history. |

---

## 4. Trust Scoring System (High / Medium / Low)

Every check-in is evaluated across 5 dimensions yielding an objective **0–100 Trust Score**:
- **High Trust (88–100%)**: All layers passed (< 100m geofence, live selfie, dynamic QR within 45s, high GPS accuracy).
- **Medium Trust (68–87%)**: Marginal GPS accuracy or borderline radius.
- **Low Trust (< 68%)**: Out-of-geofence or invalid QR token; automatically flagged for NGO supervisor review.

---

## 5. Honest Technical Limitations & Mitigations

1. **Indoor Concrete Buildings & Urban Canyons**:
   - *Limitation*: GPS accuracy can degrade inside dense multi-story relief centers.
   - *Mitigation*: The allowed geofence is configurable per event (default 100m), with fallback to on-site rotating QR scanning.
2. **Offline Field Deployments (No 4G Signal)**:
   - *Limitation*: Remote disaster zones may have intermittent cellular coverage.
   - *Mitigation*: Client queues cryptographic proofs locally and syncs to Firestore once connectivity returns, validating against the cryptographic QR token timestamp.
3. **Hardware-Level Video Stream Spoofing**:
   - *Limitation*: Advanced root-level virtual camera drivers on modified devices can simulate camera feeds.
   - *Mitigation*: The rotating QR on the NGO physical screen must be visible within the same live frame, proving physical on-site presence.
