const firebaseConfig = {
  apiKey: "AIzaSyDgHI69rZPf4q4IIOZkmjL4mgtl0iBRGHQ",
  authDomain: "opsagent-prod.firebaseapp.com",
  projectId: "opsagent-prod",
  storageBucket: "opsagent-prod.firebasestorage.app",
  messagingSenderId: "523955774086",
  appId: "1:523955774086:web:07427c38b6f9468027e707"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const functions = firebase.functions();

// Google Analytics (GA4) — auto-activates once a GA4 stream is linked to the
// Firebase web app (measurementId is fetched dynamically). No-op until then.
let analytics = null;
try {
  if (firebase.analytics && firebase.analytics.isSupported) {
    firebase.analytics.isSupported().then(ok => {
      if (ok) { try { analytics = firebase.analytics(); } catch (_) {} }
    }).catch(() => {});
  } else if (firebase.analytics) {
    analytics = firebase.analytics();
  }
} catch (_) { /* GA not linked yet — safe no-op */ }

// track(name, params) — central analytics helper. Used app-wide.
function track(name, params) {
  try { if (analytics) analytics.logEvent(name, params || {}); } catch (_) {}
}

// Web error tracking = GA `exception` events (web has no Crashlytics SDK).
window.addEventListener('error', e => {
  track('exception', { description: String(e.message || e.error || e).slice(0, 150), fatal: false });
});
window.addEventListener('unhandledrejection', e => {
  track('exception', { description: String(e.reason || '').slice(0, 150), fatal: false });
});
