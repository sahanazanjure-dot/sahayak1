/**
 * Sahayak — Community Volunteer Coordination Platform
 * // REAL-LOCATION-FIX: Real-Time High-Accuracy Device Geolocation & Telemetry Engine
 * 
 * Multi-factor Real Geolocation Architecture:
 * 1. navigator.geolocation.watchPosition with enableHighAccuracy: true, maximumAge: 0, timeout: 15000
 * 2. Active broadcast strictly while checked in on-site
 * 3. Firestore live collection ('live_volunteer_telemetry') with serverTimestamp()
 * 4. Anti-spoofing velocity & accuracy validation (< 50m threshold, mock GPS detection)
 * 5. Offline Queueing (Indexed/LocalStorage sync with 'recorded offline at' audit flags)
 * 6. NGO Real-Time onSnapshot listener with Live (<30s), Stale (30s-2m), Offline (>2m) indicators
 */

(function () {
  'use strict';

  // // REAL-LOCATION-FIX: Internal State
  const locationState = {
    watchId: null,
    isTracking: false,
    currentSession: null,
    lastPosition: null,
    lastBroadcastTime: 0,
    broadcastIntervalMs: 12000, // Every 12 seconds
    isOnline: navigator.onLine !== false,
    offlineQueue: [],
    firestoreUnsubscribe: null,
    liveTelemetryMap: {} // key: volunteerId, value: telemetry record
  };

  const STORAGE_KEY_OFFLINE_QUEUE = 'sahayak_offline_telemetry_queue';
  const STORAGE_KEY_ACTIVE_SESSION = 'sahayak_active_tracking_session';

  // // REAL-LOCATION-FIX: Initialize Offline Queue
  function loadOfflineQueue() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE);
      if (data) locationState.offlineQueue = JSON.parse(data);
    } catch (e) {
      locationState.offlineQueue = [];
    }
  }

  function saveOfflineQueue() {
    try {
      localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(locationState.offlineQueue));
    } catch (e) {}
  }

  // // REAL-LOCATION-FIX: Distance Calculation (Haversine)
  function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // // REAL-LOCATION-FIX: Anti-Spoofing & Sanity Validator
  function validateTelemetryReading(coords, lastReading) {
    const flags = [];
    let isMocked = false;

    // Check 1: Accuracy of exactly 0 is a known Android emulator / fake GPS artifact
    if (coords.accuracy === 0) {
      flags.push('ZERO_ACCURACY_EMULATOR_ARTIFACT');
      isMocked = true;
    }

    // Check 2: Accuracy worse than 50 meters
    if (coords.accuracy > 50) {
      flags.push(`POOR_ACCURACY_${Math.round(coords.accuracy)}M`);
    }

    // Check 3: Teleportation / Impossible Velocity Jump (> 160 km/h)
    if (lastReading && lastReading.timestamp) {
      const elapsedSec = (Date.now() - lastReading.timestamp) / 1000;
      if (elapsedSec > 0 && elapsedSec < 180) {
        const distMeters = calculateDistanceMeters(
          lastReading.latitude,
          lastReading.longitude,
          coords.latitude,
          coords.longitude
        );
        const speedKmH = (distMeters / elapsedSec) * 3.6;
        if (speedKmH > 160) {
          flags.push(`IMPOSSIBLE_SPEED_${Math.round(speedKmH)}KMH`);
          isMocked = true;
        }
      }
    }

    return {
      isValid: flags.length === 0,
      isMocked: isMocked,
      accuracyAcceptable: coords.accuracy <= 50,
      flags: flags
    };
  }

  // // REAL-LOCATION-FIX: Broadcast Location Reading to Firestore / Queue
  async function broadcastLocation(position) {
    const coords = position.coords;
    const now = Date.now();

    // Rate-limit writes to every 10-15s
    if (now - locationState.lastBroadcastTime < locationState.broadcastIntervalMs) {
      return;
    }
    locationState.lastBroadcastTime = now;

    const validation = validateTelemetryReading(coords, locationState.lastPosition);
    locationState.lastPosition = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp: now
    };

    const session = locationState.currentSession || {};
    const volunteer = (window.SahayakApp && window.SahayakApp.state && window.SahayakApp.state.currentUser) || {};
    const volunteerId = volunteer.id || session.volunteerId || 'vol-current';
    const volunteerName = volunteer.name || session.volunteerName || 'Active Volunteer';
    const eventId = session.eventId || (window.SahayakApp && window.SahayakApp.state && window.SahayakApp.state.selectedEventId) || 'opp-med-01';

    // Calculate distance to venue if event coordinates are known
    let distanceToSite = null;
    if (session.siteCoordinates) {
      distanceToSite = Math.round(
        calculateDistanceMeters(
          coords.latitude,
          coords.longitude,
          session.siteCoordinates.lat,
          session.siteCoordinates.lng
        )
      );
    }

    const telemetryPayload = {
      volunteerId: volunteerId,
      volunteerName: volunteerName,
      volunteerEmail: volunteer.email || '',
      volunteerRole: volunteer.role || 'Volunteer Responder',
      avatar: volunteer.avatar || 'V',
      eventId: eventId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracyMeters: coords.accuracy || 10,
      speedKmh: coords.speed != null ? Math.round(coords.speed * 3.6) : null,
      heading: coords.heading != null ? Math.round(coords.heading) : null,
      altitudeMeters: coords.altitude != null ? Math.round(coords.altitude) : null,
      distanceToSiteMeters: distanceToSite,
      insideGeofence: distanceToSite != null ? distanceToSite <= (session.allowedRadiusMeters || 100) : true,
      validation: validation,
      isMocked: validation.isMocked,
      deviceTimestamp: new Date(now).toISOString(),
      updatedAtClient: now
    };

    // Update topbar status badge with real coordinates
    updateTopbarLocationUI(`📍 ${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E (±${Math.round(coords.accuracy)}m)`, true);

    // If Offline: Queue locally with explicit recorded offline note
    if (!navigator.onLine) {
      telemetryPayload.isOfflineRecord = true;
      telemetryPayload.recordedOfflineAt = new Date(now).toISOString();
      telemetryPayload.syncStatus = 'PENDING_OFFLINE_SYNC';
      locationState.offlineQueue.push(telemetryPayload);
      saveOfflineQueue();
      showOfflineBanner(true);
      console.log('📡 [Location] Network offline. Queued reading locally:', telemetryPayload);
      return;
    }

    // Save to Firestore 'live_volunteer_telemetry' using real serverTimestamp()
    try {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        const db = firebase.firestore();
        await db.collection('live_volunteer_telemetry').doc(volunteerId).set({
          ...telemetryPayload,
          serverUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          isOfflineRecord: false
        }, { merge: true });
        console.log(`📍 [Firestore] Real GPS telemetry synced for ${volunteerName} (±${Math.round(coords.accuracy)}m)`);
      } else {
        // Fallback in-memory map update
        locationState.liveTelemetryMap[volunteerId] = {
          ...telemetryPayload,
          serverUpdatedAt: new Date(now).toISOString()
        };
      }
    } catch (err) {
      console.warn('⚠️ [Location] Firestore sync notice, queuing locally:', err.message);
      telemetryPayload.isOfflineRecord = true;
      telemetryPayload.recordedOfflineAt = new Date(now).toISOString();
      locationState.offlineQueue.push(telemetryPayload);
      saveOfflineQueue();
    }
  }

  // // REAL-LOCATION-FIX: Start Tracking Volunteer via watchPosition
  function startVolunteerTracking(eventSession = {}) {
    if (!navigator.geolocation) {
      showLocationError('Geolocation is not supported by this browser.');
      return false;
    }

    locationState.currentSession = eventSession;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(eventSession));
    } catch (e) {}

    if (locationState.watchId !== null) {
      navigator.geolocation.clearWatch(locationState.watchId);
    }

    locationState.isTracking = true;
    updateTopbarLocationUI('📍 Initializing High-Accuracy GPS...', true);

    locationState.watchId = navigator.geolocation.watchPosition(
      pos => {
        broadcastLocation(pos);
      },
      err => {
        let msg = 'GPS Permission Denied. Please enable location services in your browser settings.';
        if (err.code === 2) msg = 'GPS Position Unavailable. Move to an area with clear sky visibility.';
        if (err.code === 3) msg = 'GPS request timed out. Retrying high-accuracy fix...';
        console.warn('⚠️ [Location Error]:', msg);
        updateTopbarLocationUI('⚠️ GPS Error: ' + err.message, false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      }
    );

    console.log('🚀 [Location Engine] Active watchPosition tracking started.');
    return true;
  }

  // // REAL-LOCATION-FIX: Stop Volunteer Tracking
  async function stopVolunteerTracking() {
    if (locationState.watchId !== null) {
      navigator.geolocation.clearWatch(locationState.watchId);
      locationState.watchId = null;
    }
    locationState.isTracking = false;
    locationState.currentSession = null;
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    } catch (e) {}

    updateTopbarLocationUI('📍 GPS Standby (Check In to Share)', false);

    // Clean up or mark inactive in Firestore
    const volunteer = (window.SahayakApp && window.SahayakApp.state && window.SahayakApp.state.currentUser) || {};
    const volunteerId = volunteer.id || 'vol-current';

    try {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        const db = firebase.firestore();
        await db.collection('live_volunteer_telemetry').doc(volunteerId).update({
          isTrackingActive: false,
          checkedOutAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (e) {}

    console.log('🛑 [Location Engine] Volunteer tracking stopped.');
  }

  // // REAL-LOCATION-FIX: Offline Queue Processor
  async function processOfflineQueue() {
    if (!navigator.onLine || locationState.offlineQueue.length === 0) return;
    console.log(`🔄 [Location Engine] Syncing ${locationState.offlineQueue.length} offline location records to Firestore...`);

    const queue = [...locationState.offlineQueue];
    locationState.offlineQueue = [];
    saveOfflineQueue();

    try {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        const db = firebase.firestore();
        const batch = db.batch();

        queue.forEach(item => {
          const docRef = db.collection('live_volunteer_telemetry').doc(item.volunteerId);
          batch.set(docRef, {
            ...item,
            serverSyncedAt: firebase.firestore.FieldValue.serverTimestamp(),
            flaggedForReview: true,
            reviewReason: 'Recorded offline. Server timestamp verified upon reconnection.'
          }, { merge: true });
        });

        await batch.commit();
        console.log('✅ [Location Engine] Offline queue synced successfully.');
        showOfflineBanner(false);
      }
    } catch (err) {
      console.warn('⚠️ [Location Engine] Failed to sync offline queue, restoring:', err.message);
      locationState.offlineQueue = queue.concat(locationState.offlineQueue);
      saveOfflineQueue();
    }
  }

  // // REAL-LOCATION-FIX: Topbar GPS Status UI Update
  function updateTopbarLocationUI(text, isLive) {
    const el = document.getElementById('topbar-location-text');
    const dot = document.querySelector('.live-status-chip .pulse-green-dot');
    if (el) {
      el.textContent = text;
      el.title = text;
    }
    if (dot) {
      dot.style.background = isLive ? '#10b981' : '#94a3b8';
      dot.style.boxShadow = isLive ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none';
    }
  }

  // // REAL-LOCATION-FIX: Offline Banner Manager
  function showOfflineBanner(show) {
    let banner = document.getElementById('sahayak-offline-banner');
    if (show) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'sahayak-offline-banner';
        banner.style.cssText = 'position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 9999; background: #b45309; color: #fff; padding: 10px 20px; border-radius: 30px; font-size: 0.85rem; font-weight: 700; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 8px;';
        banner.innerHTML = `<span>⚠️ You are offline. Location updates are queued and will sync securely when reconnected.</span>`;
        document.body.appendChild(banner);
      }
    } else {
      if (banner) banner.remove();
    }
  }

  // // REAL-LOCATION-FIX: Setup Network & Lifecycle Listeners
  function setupNetworkListeners() {
    window.addEventListener('online', () => {
      locationState.isOnline = true;
      showOfflineBanner(false);
      if (window.SahayakApp && window.SahayakApp.showToast) {
        window.SahayakApp.showToast('📶 Internet connection restored. Syncing pending data...', 'success');
      }
      processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      locationState.isOnline = false;
      showOfflineBanner(true);
      if (window.SahayakApp && window.SahayakApp.showToast) {
        window.SahayakApp.showToast('⚠️ Network offline. Location points will be stored safely on device.', 'warning');
      }
    });

    // Check if previous session needs resuming
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
      if (stored) {
        const session = JSON.parse(stored);
        startVolunteerTracking(session);
      }
    } catch (e) {}

    loadOfflineQueue();
  }

  // // REAL-LOCATION-FIX: NGO Live Telemetry Listener via onSnapshot
  function listenToLiveVolunteerTelemetry(onUpdateCallback) {
    if (locationState.firestoreUnsubscribe) {
      locationState.firestoreUnsubscribe();
      locationState.firestoreUnsubscribe = null;
    }

    if (window.firebase && firebase.apps && firebase.apps.length) {
      try {
        const db = firebase.firestore();
        locationState.firestoreUnsubscribe = db.collection('live_volunteer_telemetry')
          .onSnapshot(
            snapshot => {
              const liveList = [];
              const now = Date.now();

              snapshot.forEach(doc => {
                const data = doc.data();
                // Determine age of server timestamp
                let serverTime = now;
                if (data.serverUpdatedAt && data.serverUpdatedAt.toDate) {
                  serverTime = data.serverUpdatedAt.toDate().getTime();
                } else if (data.updatedAtClient) {
                  serverTime = data.updatedAtClient;
                }

                const ageSec = Math.max(0, Math.floor((now - serverTime) / 1000));
                let freshness = 'LIVE';
                if (ageSec > 120) freshness = 'OFFLINE';
                else if (ageSec > 30) freshness = 'STALE';

                liveList.push({
                  ...data,
                  ageSeconds: ageSec,
                  freshness: freshness
                });
              });

              if (typeof onUpdateCallback === 'function') {
                onUpdateCallback(liveList);
              }
            },
            err => {
              console.warn('⚠️ [NGO Telemetry onSnapshot notice]:', err.message);
              // Fallback to local map
              const list = Object.values(locationState.liveTelemetryMap);
              if (typeof onUpdateCallback === 'function') onUpdateCallback(list);
            }
          );
      } catch (e) {
        console.warn('⚠️ [Firestore onSnapshot init error]:', e);
      }
    } else {
      // Offline / Local state ticker fallback
      const interval = setInterval(() => {
        const list = Object.values(locationState.liveTelemetryMap);
        if (typeof onUpdateCallback === 'function') onUpdateCallback(list);
      }, 5000);
      return () => clearInterval(interval);
    }

    return () => {
      if (locationState.firestoreUnsubscribe) {
        locationState.firestoreUnsubscribe();
        locationState.firestoreUnsubscribe = null;
      }
    };
  }

  function showLocationError(msg) {
    if (window.SahayakApp && window.SahayakApp.showToast) {
      window.SahayakApp.showToast(`GPS Notice: ${msg}`, 'danger');
    }
  }

  // // REAL-LOCATION-FIX: Auto Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNetworkListeners);
  } else {
    setupNetworkListeners();
  }

  // // REAL-LOCATION-FIX: Expose Public API
  window.SahayakLocation = {
    startVolunteerTracking,
    stopVolunteerTracking,
    isTrackingActive: () => locationState.isTracking,
    getLatestLocation: () => locationState.lastPosition,
    listenToLiveVolunteerTelemetry,
    processOfflineQueue,
    updateTopbarLocationUI,
    calculateDistanceMeters
  };

})();
