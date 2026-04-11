import { useState, useEffect, useCallback, useRef } from "react";
import { App } from "antd";
import { BellOutlined } from "@ant-design/icons";
import axios from "axios";
import { requestFCMToken, onForegroundMessage } from "../firebase";

console.log('🔔 PUSH DEBUG: usePushNotifications hook initialized');
const FCM_TOKEN_KEY = "smartuni_fcm_token";

/**
 * usePushNotifications
 *
 * Hook that:
 * 1. Requests browser notification permission
 * 2. Gets FCM token from Firebase
 * 3. Registers the token with the backend (AWS SNS via our API)
 * 4. Shows foreground toast notifications
 * 5. Returns permission state & manual trigger
 */
export function usePushNotifications(isAuthenticated) {
    const { notification } = App.useApp();
    const [permissionState, setPermissionState] = useState(
        "Notification" in window ? Notification.permission : "unsupported"
    );
    console.log('🔔 PUSH DEBUG: Initial permission state:', permissionState);
    const [isRegistered, setIsRegistered] = useState(false);
    const unsubRef = useRef(null);

    const registerToken = useCallback(async (isManualTrigger = false) => {
      console.log('🔔 PUSH DEBUG: registerToken called, manual:', isManualTrigger, 'permission:', Notification.permission);
        try {
            // If the browser hasn't granted permission yet and this wasn't called by a user click, 
            // DON'T try to register to avoid "gesture" error.
            if (!isManualTrigger && Notification.permission !== "granted") {
                console.log('🔔 PUSH DEBUG: Skipping token request - permission not granted, not manual trigger');
                return false;
            }

            const token = await requestFCMToken();
            if (!token) {
              console.log('🔔 PUSH DEBUG: No token from requestFCMToken');
              return false;
            }
            console.log('🔑 PUSH DEBUG: Got FCM token:', token.substring(0, 20) + '...');

            // Avoid re-registering the same token
            const stored = localStorage.getItem(FCM_TOKEN_KEY);
            if (stored === token) {
                console.log('✅ Push token already registered:', token.substring(0, 20) + '...');
                setIsRegistered(true);
                return true;
            }

            console.log('📱 Registering new FCM token to backend:', token.substring(0, 20) + '...');
            
            // Send token to backend
            const response = await axios.post("/api/notifications/push/register", { fcmToken: token });
            console.log('📤 PUSH DEBUG: Backend POST /push/register response:', response.status, response.data);
            console.log('🎉 Backend registration response:', response.data);
            
            localStorage.setItem(FCM_TOKEN_KEY, token);
            setIsRegistered(true);
            setPermissionState("granted");
            
            console.log('✅ Push notifications fully enabled!');
            return true;
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            console.error('🚨 PUSH DEBUG: Backend registration FAILED:', errorMsg);
            console.error('🚨 Full error object:', err);
            console.error("❌ Failed to register push token:", errorMsg);
            if (err.response?.status === 400) {
                console.error('Backend rejected token - check AWS SNS platform ARN config');
            }
            return false;
        }
    }, []);

    // Request registration if already granted
    useEffect(() => {
        if (!isAuthenticated) return;
        if (!("Notification" in window)) return;

        const currentPermission = Notification.permission;
        setPermissionState(currentPermission);

        // If permission is already granted, we can try to get the token silently.
        // If it's NOT granted, we wait for the user to click the "Enable" button.
        if (currentPermission === "granted") {
            registerToken(false);
        }
    }, [isAuthenticated, registerToken]);

    // Foreground message listener (app is open)
    useEffect(() => {
        if (!isAuthenticated) return;

        unsubRef.current = onForegroundMessage((payload) => {
            // Extract from notification OR data (for data-only messages)
            const title = payload.notification?.title || payload.data?.title || "Smart Campus";
            const body = payload.notification?.body || payload.data?.body || "";

            notification.open({
                title: title, // Fixed per deprecated warning
                description: body,
                icon: <BellOutlined style={{ color: "#0f3460" }} />,
                placement: "topRight",
                duration: 6,
                style: {
                    borderLeft: "4px solid #0f3460",
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(15,52,96,0.15)",
                },
            });
        });

        return () => {
            if (unsubRef.current) {
                unsubRef.current();
                unsubRef.current = null;
            }
        };
    }, [isAuthenticated, notification]);

    return {
        permissionState,
        isRegistered,
        requestPermission: () => registerToken(true),
    };
}
