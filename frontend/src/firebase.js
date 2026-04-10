import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDVNcULcwTgWjpzK0o4_zDYY1E43KTQ0Uo",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartuni-b4744.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartuni-b4744",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartuni-b4744.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "595474175026",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:595474175026:web:3b3faa2957854080c0582b",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WVRR34RWQ3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
    messaging = getMessaging(app);
} catch (err) {
    console.warn("Firebase Messaging not available:", err.message);
}

// VAPID key for web push — generate from Firebase Console > Project Settings > Cloud Messaging
const VAPID_KEY =
    import.meta.env.VITE_FIREBASE_VAPID_KEY ||
    "BO54rbnxFyJel2I4ECqvgRyz8aLyaNDt34p3dHCYK8Au5OkLz2_n7-_PQzFFqFVVcZfOPwWedU6hwFOZMpilIDA";

/**
 * Request notification permission and get FCM token.
 * @returns {Promise<string|null>} FCM device token or null if denied/error
 */
export async function requestFCMToken() {
    if (!messaging) return null;
    try {
        // Check current permission first
        let currentPermission = "Notification" in window ? Notification.permission : "unsupported";

        if (currentPermission === "default") {
            try {
                currentPermission = await Notification.requestPermission();
            } catch (permErr) {
                console.warn("Notification request failed (gesture needed?):", permErr.message);
                return null;
            }
        }

        if (currentPermission !== "granted") {
            console.log("Notification permission is not granted (current state:", currentPermission, ")");
            return null;
        }

        // Ensure service worker is registered before requesting token
        let swRegistration = null;
        if ("serviceWorker" in navigator) {
            swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
                scope: "/",
            });
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
        }

        // Clean the VAPID key string: remove whitespace and potential quotes
        // We pass the STRING directly now, as the new key is the correct length (87 chars).
        // Firebase handles the base64url-to-byte conversion internally.
        const cleanedVapidKey = VAPID_KEY.trim().replace(/['"]/g, "");

        console.log("🔔 PUSH DEBUG: firebase.js - Requesting FCM token with VAPID:", cleanedVapidKey.substring(0, 20) + '...');
        console.log("Requesting FCM token with clean VAPID key string...");
        const token = await getToken(messaging, {
            vapidKey: cleanedVapidKey,
            serviceWorkerRegistration: swRegistration,
        });

        if (token) {
            console.log("FCM Token obtained successfully");
            return token;
        } else {
            console.warn("No FCM registration token available.");
            return null;
        }
        } catch (err) {
            console.error('🚨 PUSH DEBUG firebase.js: getToken FAILED:', err.name, err.message, err.stack);
            if (err.name === "NotAllowedError" || err.message?.includes("gesture")) {
                console.warn("Notification request requires a user gesture.");
            } else {
                console.error("Error getting FCM token:", err);
            }
            return null;
        }
}

/**
 * Listen for foreground push messages and invoke the handler.
 * @param {Function} handler - Callback (payload) => void
 * @returns {Function} unsubscribe function
 */
export function onForegroundMessage(handler) {
    if (!messaging) return () => { };
    return onMessage(messaging, handler);
}

export { app, messaging };
