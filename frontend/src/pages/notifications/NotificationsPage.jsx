import { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, Spin, Typography, Space, Badge, message } from 'antd';
import { BellOutlined, CheckCircleOutlined, InfoCircleOutlined, WarningOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import notificationService from '../../services/notificationService';

const { Text } = Typography;

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingLoading, setMarkingLoading] = useState({});

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    setMarkingLoading(prev => ({...prev, [id]: true}));
    try {
      await notificationService.markAsRead(id);
      setNotifications(nots => nots.map(n => n.id === id ? {...n, read: true} : n));
      message.success('Marked as read');
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (error) {
      message.error('Failed to mark as read');
    } finally {
      setMarkingLoading(prev => ({...prev, [id]: false}));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(nots => nots.map(n => ({...n, read: true})));
      message.success('All notifications marked as read');
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (error) {
      message.error('Failed to mark all as read');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'WARNING':
        return <WarningOutlined className="text-orange-500" />;
      case 'ERROR':
        return <InfoCircleOutlined className="text-red-500" />;
      case 'CHAT':
        return <CheckCircleOutlined className="text-blue-500" />;
      case 'BROADCAST':
        return <WarningOutlined className="text-purple-500" />;
      case 'FACILITY':
        return <InfoCircleOutlined className="text-indigo-500" />;
      case 'SYSTEM':
        return <InfoCircleOutlined className="text-gray-500" />;
      default:
        return <BellOutlined className="text-blue-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'SUCCESS':
        return 'green';
      case 'WARNING':
        return 'orange';
      case 'ERROR':
        return 'red';
      case 'CHAT':
        return 'blue';
      case 'BROADCAST':
        return 'purple';
      case 'FACILITY':
        return 'indigo';
      case 'SYSTEM':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const notificationDate = new Date(date);
    const now = new Date();
    const diff = now - notificationDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return notificationDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-500">View your recent notifications</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              count={notifications.filter(n => !n.read).length} 
              offset={[10, -5]}
              style={{ backgroundColor: '#e94560' }}
            >
              <BellOutlined className="text-xl" />
            </Badge>
            {notifications.filter(n => !n.read).length > 0 && (
              <Button 
                onClick={handleMarkAllRead}
                size="small"
                type="primary"
                ghost
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : notifications.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                className="hover:bg-gray-50 rounded-lg p-4 transition-colors"
                actions={[
                  <Text key="time" type="secondary" className="text-sm">
                    {formatDate(notification.createdAt)}
                  </Text>,
                  notification.read ? (
                    <span key="read" className="text-xs text-gray-400">✓ Read</span>
                  ) : (
                    <Button 
                      key="markread" 
                      size="small" 
                      type="link" 
                      loading={markingLoading[notification.id]}
                      onClick={() => handleMarkAsRead(notification.id)}
                      icon={<EyeOutlined />}
                    >
                      Mark read
                    </Button>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getTypeIcon(notification.type)}
                    </div>
                  }
                  title={
                    <Space>
                      <span>{notification.title}</span>
                      {notification.type && (
                        <Tag color={getTypeColor(notification.type)}>{notification.type}</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <p className="text-gray-600">{notification.message}</p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description="No notifications yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" href="/dashboard">
              Go to Dashboard
            </Button>
          </Empty>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;

