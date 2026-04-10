import { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Space } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const NotificationPrompt = () => {
    const { isAuthenticated } = useAuth();
    const { permissionState, requestPermission } = usePushNotifications(isAuthenticated);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        console.log("NotificationPrompt status:", { isAuthenticated, permissionState });
        // If the browser hasn't asked for permission yet, show our custom prompt after 3s
        if (isAuthenticated && permissionState === 'default') {
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        } else {
            setShowPrompt(false);
        }
    }, [permissionState, isAuthenticated]);

    if (!showPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            maxWidth: 400,
            animation: 'slideIn 0.5s ease-out'
        }}>
            <Alert
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#0f3460', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <BellOutlined style={{ color: '#fff' }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>Stay Updated!</span>
                    </div>
                }
                description="Enable push notifications to receive real-time updates for bookings, tickets, and messages."
                type="info"
                showIcon={false}
                action={
                    <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
                        <Button type="primary" size="small" block onClick={requestPermission} style={{ background: '#0f3460' }}>
                            Enable Notifications
                        </Button>
                        <Button type="text" size="small" block onClick={() => setShowPrompt(false)}>
                            Not Now
                        </Button>
                    </Space>
                }
                style={{
                    borderRadius: 12,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    border: 'none',
                    background: '#fff',
                    padding: '16px 20px'
                }}
            />
            <style>
                {`
                    @keyframes slideIn {
                        from { transform: translateY(100px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
};

export default NotificationPrompt;
