// Handles push notifications that arrive while this tab isn't focused (or
// is closed) — foreground pushes (tab open and focused) are handled
// instead by onForegroundPush() in src/firebase.js.
//
// IMPORTANT: this file is served as a static file from /public, so it
// can't read Vite's import.meta.env like the rest of the app can. Fill in
// the SAME values you put in .env's VITE_FIREBASE_* vars here too — these
// are the public web-app config values (not secrets), so duplicating them
// in a plain JS file like this is normal for Firebase web push setups.

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "REPLACE_WITH_VITE_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_VITE_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_VITE_FIREBASE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "Quelorax";
  const body = payload.notification?.body || payload.data?.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
  });
});
