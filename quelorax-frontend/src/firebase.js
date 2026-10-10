// Firebase Cloud Messaging (web push) setup.
//
// All of the values below are the Firebase *web app config* — this is
// meant to be public (it identifies your Firebase project to the browser,
// it isn't a secret credential), safe to ship in frontend code. Get it
// from: Firebase Console → Project Settings → General → "Your apps" →
// select your web app → SDK setup and configuration.
//
// The VAPID key is separate and comes from: Firebase Console → Project
// Settings → Cloud Messaging → Web configuration → "Generate key pair".
//
// If these env vars aren't set, push notifications are simply skipped —
// nothing breaks, the app just won't ask for notification permission.
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && VAPID_KEY);

let app = null;
let messagingPromise = null;

function getMessagingInstance() {
  if (!isConfigured) return Promise.resolve(null);
  if (!messagingPromise) {
    messagingPromise = isSupported().then((supported) => {
      if (!supported) return null; // e.g. Safari/private browsing without SW support
      app = app || initializeApp(firebaseConfig);
      return getMessaging(app);
    });
  }
  return messagingPromise;
}

// Asks the browser for notification permission (shows the native prompt)
// and, if granted, registers the service worker and returns an FCM device
// token identifying this browser. Returns null if push isn't configured,
// isn't supported, or the person declines the permission prompt.
export async function requestPushToken() {
  if (!isConfigured) return null;
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    return await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  } catch (e) {
    console.warn("Push notification setup failed:", e);
    return null;
  }
}

// Fires for pushes that arrive while the app is open/focused (background
// pushes, e.g. when the tab isn't focused or is closed, are handled by
// public/firebase-messaging-sw.js instead). Returns an unsubscribe function.
export async function onForegroundPush(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

export const isPushConfigured = isConfigured;
