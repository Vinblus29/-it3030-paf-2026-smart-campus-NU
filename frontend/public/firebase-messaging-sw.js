// Firebase Cloud Messaging Service Worker
// This file MUST be at the root of your public directory (public/firebase-messaging-sw.js)
// so the browser can register it at the root scope.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// ⚠️  Keep these values in sync with your firebase.js config
firebase.initializeApp({
    apiKey: "AIzaSyDVNcULcwTgWjpzK0o4_zDYY1E43KTQ0Uo",
    authDomain: "smartuni-b4744.firebaseapp.com",
    projectId: "smartuni-b4744",
    storageBucket: "smartuni-b4744.firebasestorage.app",
    messagingSenderId: "595474175026",
    appId: "1:595474175026:web:3b3faa2957854080c0582b",
});

const messaging = firebase.messaging();

// Force immediate activation
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || "Smart Campus";
    const body = payload.notification?.body || payload.data?.body || "";
    
    // Determine target URL from data (backend sends type/referenceId)
    let targetUrl = '/notifications';
    if (payload.data) {
        const type = payload.data.type;
        if (type === 'CHAT' || type === 'MESSAGE') targetUrl = '/chat';
        else if (type === 'TICKET') targetUrl = '/my-tickets';
        else if (type === 'BOOKING') targetUrl = '/my-bookings';
        else if (payload.data.referenceType && payload.data.referenceId) {
            targetUrl = `/${payload.data.referenceType.toLowerCase()}s/${payload.data.referenceId}`;
        }
    }

    const options = {
        body: body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: { url: targetUrl },
        tag: `smart-campus-${Date.now()}`, // Unique tag prevents duplicates
        renotify: false,
        silent: false
    };

    return self.registration.showNotification(title, options);
});

// Handle notification click - smart routing based on payload data
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    // Use notification data.url or fallback
    const targetUrl = event.notification.data?.url || '/notifications';

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // Try to focus existing tab with matching URL
                for (const client of clientList) {
                    if (client.url.includes(targetUrl.split('/')[1]) && "focus" in client) {
                        return client.focus();
                    }
                }
                // Open new tab if none found
                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
            })
    );
});
