import { useState, useEffect } from 'react';
import { Spin, Empty } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import notificationService from '../../services/notificationService';

const NoticesPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await notificationService.getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : (data?.content ?? []));
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spin size="large" />
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#1a1a2e' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
        borderRadius: 8, padding: '24px 28px', marginBottom: 20,
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
      }}>
        <h1 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 700 }}>
          <SoundOutlined style={{ color: '#f5a623', marginRight: 12 }} />
          Campus Notices
        </h1>
        <p style={{ margin: '8px 0 0', color: '#b0b8d1', fontSize: 13 }}>
          View all campus announcements and updates
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 20 }}>
        {announcements.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No announcements yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {announcements.map(ann => (
              <div key={ann.id} style={{ 
                background: '#fafafa', 
                borderRadius: 8, 
                padding: 20, 
                border: '1px solid #eee',
                transition: 'all 0.2s'
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
                  {ann.title}
                </div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                  {ann.content}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 12 }}>
                  {ann.createdAt 
                    ? new Date(ann.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticesPage;