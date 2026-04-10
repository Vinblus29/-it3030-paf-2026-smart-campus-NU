import { useState, useEffect } from 'react';
import { Tag, Empty, Spin, message } from 'antd';
import { Link } from 'react-router-dom';
import {
  CalendarOutlined,
  ToolOutlined,
  BellOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  BuildOutlined,
  UserOutlined,
  InfoCircleOutlined,
  SoundOutlined,
  EnvironmentOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import ticketService from '../../services/ticketService';
import notificationService from '../../services/notificationService';

const STATUS_COLORS = {
  PENDING: { bg: '#fff7e6', text: '#d46b08', border: '#ffd591' },
  APPROVED: { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
  REJECTED: { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' },
  CANCELLED: { bg: '#f5f5f5', text: '#595959', border: '#d9d9d9' },
  OPEN: { bg: '#e6f4ff', text: '#096dd9', border: '#91caff' },
  IN_PROGRESS: { bg: '#fff7e6', text: '#d46b08', border: '#ffd591' },
  RESOLVED: { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
  CLOSED: { bg: '#f5f5f5', text: '#595959', border: '#d9d9d9' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.CLOSED;
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`, letterSpacing: 0.3
    }}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const StatCard = ({ icon, label, value, sub, accent }) => (
  <div style={{
    background: '#fff', borderRadius: 6, padding: '20px 22px',
    borderLeft: `4px solid ${accent}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 0
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 8, background: accent + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, color: accent, flexShrink: 0
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#555', fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const ActionTile = ({ icon, label, to, accent, disabled }) => {
  const content = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '18px 10px', background: disabled ? '#f9f9f9' : '#fff', borderRadius: 6, textDecoration: 'none',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0',
      transition: 'all 0.2s', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      filter: disabled ? 'grayscale(0.5)' : 'none',
    }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 4px 12px ${accent}33`; } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; } }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 8, background: accent + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color: accent
      }}>{icon}</div>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#333', textAlign: 'center' }}>{label}</span>
      {disabled && <div style={{ fontSize: 9, color: '#999', fontWeight: 700, textTransform: 'uppercase' }}>Locked</div>}
    </div>
  );

  return disabled ? content : <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link>;
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myBookings, setMyBookings] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  useEffect(() => { fetchData(); fetchAnnouncements(); }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, ticketsRes] = await Promise.all([
        bookingService.getMyBookings(),
        ticketService.getMyTickets()
      ]);
      setMyBookings(Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.content ?? []));
      setMyTickets(Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.content ?? []));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const data = await notificationService.getRecentAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const pendingBookings = myBookings.filter(b => b.status === 'PENDING').length;
  const approvedBookings = myBookings.filter(b => b.status === 'APPROVED').length;
  const openTickets = myTickets.filter(t => t.status === 'OPEN').length;

  // Ticket stats
  const ticketStats = {
    total: myTickets.length,
    open: myTickets.filter(t => t.status === 'OPEN').length,
    inProgress: myTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: myTickets.filter(t => t.status === 'RESOLVED').length,
    closed: myTickets.filter(t => t.status === 'CLOSED').length,
    rejected: myTickets.filter(t => t.status === 'REJECTED').length,
  };
  const resolutionRate = ticketStats.total > 0
    ? Math.round(((ticketStats.resolved + ticketStats.closed) / ticketStats.total) * 100)
    : 0;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spin size="large" />
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#1a1a2e' }}>

      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
        borderRadius: 8, padding: '28px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f5a623', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Student Dashboard
          </div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 700 }}>
            Welcome back, {user?.firstName}!
          </h1>
          <p style={{ margin: '6px 0 0', color: '#b0b8d1', fontSize: 13 }}>
            Manage your facility bookings and support tickets from here.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#f5a623', fontSize: 13, fontWeight: 600 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
          <div style={{ color: '#b0b8d1', fontSize: 13 }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {!user?.enabled && (
        <div style={{
          background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8,
          padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <ClockCircleOutlined style={{ fontSize: 24, color: '#f5a623' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#d46b08', fontSize: 14 }}>Account Pending Approval</div>
            <div style={{ fontSize: 13, color: '#ad6800', marginTop: 2 }}>
              Your account is currently under review by the administration. You will be able to book facilities and raise support tickets once verified.
            </div>
          </div>
        </div>
      )}

      {/* ── Campus Notices & Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
        {/* Campus Notices - Left */}
        <div style={{ background: '#fffbf0', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderLeft: '4px solid #f5a623' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}><SoundOutlined style={{ color: '#f5a623', marginRight: 8 }} />Campus Notices</span>
            <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>NEW</Tag>
          </div>
          <div style={{ padding: '8px 16px', flex: 1 }}>
            {announcements.slice(0, 3).map(ann => (
              <div key={ann.id} style={{ padding: '14px 0', borderBottom: '1px solid #f8f8f8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', lineHeight: 1.3 }}>{ann.title}</div>
                  <div style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>{ann.date}</div>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 6, lineHeight: 1.4 }}>{ann.content}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, textAlign: 'center', background: '#fafafa' }}>
            <Link to="/notices" style={{ color: '#0f3460', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>View All Announcements</Link>
          </div>
        </div>

        {/* Quick Actions - Right */}
        <div style={{ background: '#fff', borderRadius: 6, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', borderBottom: '2px solid #f5a623', paddingBottom: 8, marginBottom: 16, display: 'inline-block' }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <ActionTile icon={<PlusOutlined />} label="New Booking" to="/my-bookings" accent="#0f3460" disabled={!user?.enabled} />
            <ActionTile icon={<ToolOutlined />} label="New Ticket" to="/my-tickets" accent="#e94560" disabled={!user?.enabled} />
            <ActionTile icon={<SendOutlined />} label="Campus Chat" to="/chat" accent="#0f3460" />
            <ActionTile icon={<BuildOutlined />} label="Facilities" to="/facilities" accent="#f5a623" />
            <ActionTile icon={<EnvironmentOutlined />} label="Campus Map" to="/map" accent="#52c41a" />
            <ActionTile icon={<BellOutlined />} label="Notifications" to="/notifications" accent="#722ed1" />
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 6, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `3px solid ${user?.enabled ? '#52c41a' : '#f5a623'}`, flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>Account Status</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{user?.enabled ? 'Active' : 'Pending'}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 6, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '3px solid #0f3460', flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>Total Bookings</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{myBookings.length}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 6, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '3px solid #e94560', flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>My Tickets</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{myTickets.length}</div>
        </div>
      </div>

      {/* ── Grid: Main Content ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Bookings */}
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>
              <CalendarOutlined style={{ color: '#0f3460', marginRight: 8 }} />
              My Recent Bookings
            </span>
            <Link to="/my-bookings" style={{ color: '#f5a623', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRightOutlined />
            </Link>
          </div>
          <div style={{ padding: '0 8px' }}>
            {myBookings.slice(0, 4).map((item, i) => (
              <div key={item.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px', borderBottom: i < 3 ? '1px solid #f7f7f7' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#e6f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f3460', fontSize: 16 }}>
                    <CalendarOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{item.facilityName}</div>
                    <div style={{ fontSize: 10, color: '#666' }}>{item.startTime}</div>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {myBookings.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No bookings yet" />}
          </div>
        </div>

        {/* Tickets */}
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>
              <ToolOutlined style={{ color: '#e94560', marginRight: 8 }} />
              My Ticket Stats
            </span>
            <Link to="/my-tickets" style={{ color: '#f5a623', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRightOutlined />
            </Link>
          </div>
          {myTickets.length === 0 ? (
            <div style={{ padding: 24 }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tickets yet" />
            </div>
          ) : (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, background: '#f8fafc', borderRadius: 8, padding: '12px 16px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e' }}>{ticketStats.total}</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 2 }}>Total</div>
                </div>
                <div style={{ flex: 1, background: resolutionRate >= 70 ? '#f6ffed' : resolutionRate >= 40 ? '#fff7e6' : '#fff1f0', borderRadius: 8, padding: '12px 16px', textAlign: 'center', border: `1px solid ${resolutionRate >= 70 ? '#b7eb8f' : resolutionRate >= 40 ? '#ffd591' : '#ffa39e'}` }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: resolutionRate >= 70 ? '#389e0d' : resolutionRate >= 40 ? '#d46b08' : '#cf1322' }}>{resolutionRate}%</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 2 }}>Resolved</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
