import { useState, useEffect } from 'react';
import { Table, Tag, Spin } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ApartmentOutlined,
  ArrowRightOutlined,
  WarningOutlined,
  LineChartOutlined,
  HistoryOutlined,
  SettingOutlined,
  SendOutlined,
  NotificationOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import { useAuth } from '../../context/AuthContext';
import { Modal, Input, Button as AntdButton, message, Popconfirm, Space } from 'antd';
import bookingService from '../../services/bookingService';
import facilityService from '../../services/facilityService';
import ticketService from '../../services/ticketService';
import notificationService from '../../services/notificationService';
import axios from 'axios';

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
      background: c.bg, color: c.text, border: `1px solid ${c.border}`, letterSpacing: 0.3, whiteSpace: 'nowrap'
    }}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const StatCard = ({ icon, label, value, sub, accent }) => (
  <div style={{
    background: '#fff', borderRadius: 6, padding: '16px 18px',
    borderLeft: `4px solid ${accent}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 6, background: accent + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, color: accent, flexShrink: 0
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#555', fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFacilities: 0, totalBookings: 0, pendingBookings: 0,
    totalTickets: 0, pendingTickets: 0, totalUsers: 0, pendingUsers: 0, enabledUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [bookingStats, setBookingStats] = useState({});
  const [ticketStats, setTicketStats] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ title: '', body: '' });
  const [broadcasting, setBroadcasting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementData, setAnnouncementData] = useState({ title: '', content: '' });

  useEffect(() => { fetchDashboardData(); fetchAnnouncements(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [facilitiesRes, bookingsRes, ticketStatsData, userStats] = await Promise.all([
        facilityService.getAllFacilities(),
        bookingService.getAllBookings(),
        ticketService.getStats(),       // #1 — use stats endpoint
        axios.get('/api/admin/stats')
      ]);
      const facilities = Array.isArray(facilitiesRes) ? facilitiesRes : (facilitiesRes?.content ?? []);
      const bookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.content ?? []);

      const pendingBookings = bookings.filter(b => b.status === 'PENDING');

      const bookingByStatus = {
        APPROVED: bookings.filter(b => b.status === 'APPROVED').length,
        PENDING: bookings.filter(b => b.status === 'PENDING').length,
        REJECTED: bookings.filter(b => b.status === 'REJECTED').length,
        CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
      };

      const ticketByStatus = {
        OPEN: ticketStatsData.open || 0,
        IN_PROGRESS: ticketStatsData.inProgress || 0,
        RESOLVED: ticketStatsData.resolved || 0,
        CLOSED: ticketStatsData.closed || 0,
      };

      setBookingStats(bookingByStatus);
      setTicketStats(ticketByStatus);

      setStats({
        totalFacilities: facilities.length,
        totalBookings: bookings.length,
        pendingBookings: pendingBookings.length,
        totalTickets: ticketStatsData.total || 0,
        pendingTickets: (ticketStatsData.open || 0) + (ticketStatsData.inProgress || 0),
        totalUsers: userStats.data.totalUsers || 0,
        pendingUsers: userStats.data.pendingUsers || 0,
        enabledUsers: userStats.data.enabledUsers || 0
      });

      // recent tickets still need the list — fetch separately but limit
      const recentList = await ticketService.getAllTickets();
      setRecentBookings(bookings.slice(0, 5));
      setRecentTickets(recentList.slice(0, 5));

      // Generate dynamic system logs
      const logs = [];
      
      if (Array.isArray(bookings)) {
        bookings.slice(0, 20).forEach(b => {
          logs.push({
            id: `b_${b.id}`,
            action: b.status === 'PENDING' ? 'New Booking Request' : `Booking ${b.status}`,
            user: b.userName || b.userEmail || 'User',
            timeObj: new Date(b.createdAt || b.startTime || Date.now()),
            color: b.status === 'APPROVED' ? '#52c41a' : b.status === 'REJECTED' ? '#cf1322' : '#f5a623'
          });
        });
      }

      if (Array.isArray(recentList)) {
        recentList.slice(0, 20).forEach(t => {
          logs.push({
            id: `t_${t.id}`,
            action: t.status === 'RESOLVED' ? 'Ticket Resolved' : t.status === 'OPEN' ? 'New Ticket' : `Ticket ${t.status}`,
            user: t.reporterName || t.reporterEmail || 'User',
            timeObj: new Date(t.createdAt || t.updatedAt || Date.now()),
            color: t.status === 'RESOLVED' ? '#0f3460' : t.status === 'OPEN' ? '#e94560' : '#d46b08'
          });
        });
      }

      logs.sort((a, b) => b.timeObj - a.timeObj);

      const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval >= 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval >= 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval >= 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval >= 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval >= 1) return Math.floor(interval) + " mins ago";
        return isNaN(seconds) || seconds < 0 ? "just now" : Math.floor(seconds) + " secs ago";
      };

      setSystemLogs(logs.slice(0, 5).map(log => ({
        ...log,
        time: timeAgo(log.timeObj)
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please ensure the backend is running and the database schema is up to date.');
    } finally {
      setLoading(false);
    }
  };

  const bookingPieConfig = {
    data: Object.entries(bookingStats).map(([key, value]) => ({ type: key, value })),
    angleField: 'value', colorField: 'type', radius: 0.75, innerRadius: 0.6,
    label: { text: 'value', style: { fontWeight: 600, fontSize: 12 } },
    legend: { position: 'bottom' },
    color: ['#52c41a', '#f5a623', '#e94560', '#8c8c8c'],
  };

  const ticketPieConfig = {
    data: Object.entries(ticketStats).map(([key, value]) => ({ type: key, value })),
    angleField: 'value', colorField: 'type', radius: 0.75, innerRadius: 0.6,
    label: { text: 'value', style: { fontWeight: 600, fontSize: 12 } },
    legend: { position: 'bottom' },
    color: ['#0f3460', '#f5a623', '#52c41a', '#8c8c8c'],
  };

  const handleBroadcast = async () => {
    if (!broadcastData.title || !broadcastData.body) {
      return message.warning('Please enter both title and message');
    }
    setBroadcasting(true);
    try {
      await axios.post('/api/notifications/push/broadcast', broadcastData);
      message.success('Push notification broadcasted successfully!');
      setBroadcastModal(false);
      setBroadcastData({ title: '', body: '' });
    } catch (error) {
      console.error('Broadcast failed:', error);
      message.error(error.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      console.log('Fetching announcements from /api/admin/announcements...');
      const data = await notificationService.getAnnouncements();
      console.log('Announcements response:', data);
      console.log('Announcements type:', typeof data, Array.isArray(data));
      setAnnouncements(Array.isArray(data) ? data : (data?.content || []));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      console.error('Error response:', error.response);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const openAnnouncementModal = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setAnnouncementData({ title: announcement.title, content: announcement.content });
    } else {
      setEditingAnnouncement(null);
      setAnnouncementData({ title: '', content: '' });
    }
    setAnnouncementModal(true);
  };

  const handleAnnouncementSave = async () => {
    if (!announcementData.title || !announcementData.content) {
      return message.warning('Please enter both title and content');
    }
    try {
      if (editingAnnouncement) {
        await notificationService.updateAnnouncement(editingAnnouncement.id, announcementData);
        message.success('Announcement updated successfully!');
      } else {
        await notificationService.createAnnouncement(announcementData);
        message.success('Announcement created successfully!');
      }
      setAnnouncementModal(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      message.error('Failed to save announcement');
    }
  };

  const handleAnnouncementDelete = async (id) => {
    try {
      await notificationService.deleteAnnouncement(id);
      message.success('Announcement deleted successfully!');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      message.error('Failed to delete announcement');
    }
  };

  const bookingColumns = [
    { title: 'Facility', dataIndex: 'facilityName', key: 'facility', render: v => <span style={{ fontWeight: 600 }}>{v || '—'}</span> },
    { title: 'Date', dataIndex: 'date', key: 'date', render: d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
    { title: 'Time', key: 'time', render: (_, r) => `${r.startTime || ''} - ${r.endTime || ''}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <StatusBadge status={s} /> },
  ];

  const ticketColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    {
      title: 'Priority', dataIndex: 'priority', key: 'priority',
      render: p => {
        const map = { HIGH: { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' }, MEDIUM: { bg: '#fff7e6', text: '#d46b08', border: '#ffd591' }, LOW: { bg: '#e6f4ff', text: '#096dd9', border: '#91caff' } };
        const c = map[p] || map.LOW;
        return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{p}</span>;
      }
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <StatusBadge status={s} /> },
  ];


  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#1a1a2e' }}>
      {error && (
        <div style={{ 
          background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 6, 
          padding: '12px 20px', marginBottom: 20, color: '#cf1322', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <WarningOutlined /> {error}
        </div>
      )}

      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f3460 0%, #16213e 60%, #1a1a2e 100%)',
        borderRadius: 8, padding: '28px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f5a623', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Admin Control Panel
          </div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 700 }}>
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#b0b8d1', fontSize: 13 }}>
            Here's an overview of everything happening on campus today.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#f5a623', fontSize: 13, fontWeight: 600 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div style={{ color: '#b0b8d1', fontSize: 13 }}>
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Grid: Main Dashboard ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, marginBottom: 20 }}>

        {/* Left Column: Stats & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <StatCard icon={<UserOutlined />} label="Total Users" value={stats.totalUsers} sub={`${stats.enabledUsers} active · ${stats.pendingUsers} pending`} accent="#0f3460" />
            <StatCard icon={<CalendarOutlined />} label="Total Bookings" value={stats.totalBookings} sub={`${stats.pendingBookings} pending approval`} accent="#f5a623" />
            <StatCard icon={<ToolOutlined />} label="Total Tickets" value={stats.totalTickets} sub={`${stats.pendingTickets} open/in-progress`} accent="#e94560" />
          </div>

          {/* Quick Actions under Stats */}
          <div style={{ background: '#fff', borderRadius: 8, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', borderBottom: '2px solid #0f3460', paddingBottom: 12, marginBottom: 20, display: 'inline-block' }}>
              Quick Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
              {[
                { icon: <UserOutlined />, label: 'Manage Users', href: '/users', accent: '#0f3460' },
                { icon: <CalendarOutlined />, label: 'Manage Bookings', href: '/bookings', accent: '#f5a623' },
                { icon: <ToolOutlined />, label: 'Manage Tickets', href: '/tickets', accent: '#e94560' },
                { icon: <ApartmentOutlined />, label: 'Manage Facilities', href: '/facilities', accent: '#52c41a' },
                { icon: <NotificationOutlined />, label: 'Announcements', onClick: () => openAnnouncementModal(), accent: '#0f3460' },
                { icon: <SendOutlined />, label: 'Push Broadcast', onClick: () => setBroadcastModal(true), accent: '#e94560' },
                { icon: <SendOutlined />, label: 'Campus Chat', href: '/chat', accent: '#0f3460' },
                { icon: <CheckCircleOutlined />, label: 'QR Check-in', href: '/bookings/qr-check-in', accent: '#a569bd' },
              ].map(({ icon, label, href, onClick, accent }) => (
                <a key={href || label} href={href || '#'} onClick={onClick} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '12px 10px', background: accent + '08', borderRadius: 6, textDecoration: 'none',
                  border: `1px solid ${accent}22`, transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.background = accent + '18'; 
                    e.currentTarget.style.borderColor = accent; 
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.background = accent + '08'; 
                    e.currentTarget.style.borderColor = accent + '22'; 
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: accent }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#333', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                </a>
              ))}
            </div>
          </div>

          {(stats.pendingBookings > 0 || stats.pendingTickets > 0) && (

            <div style={{ display: 'flex', gap: 12 }}>
              {stats.pendingBookings > 0 && (
                <a href="/bookings" style={{
                  flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '12px 18px'
                }}>
                  <WarningOutlined style={{ fontSize: 20, color: '#f5a623' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#d46b08' }}>{stats.pendingBookings} Booking Approvals</div>
                    <div style={{ fontSize: 11, color: '#ad6800' }}>Review needed for space allocation</div>
                  </div>
                </a>
              )}
              {stats.pendingTickets > 0 && (
                <a href="/tickets" style={{
                  flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 6, padding: '12px 18px'
                }}>
                  <ToolOutlined style={{ fontSize: 20, color: '#e94560' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#cf1322' }}>{stats.pendingTickets} Unresolved Ticket{stats.pendingTickets > 1 ? 's' : ''}</div>
                    <div style={{ fontSize: 11, color: '#a8071a' }}>Check priority and assignments</div>
                  </div>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right Column: System Logs */}
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}><HistoryOutlined style={{ color: '#0f3460', marginRight: 8 }} />System Activity</span>
            <SettingOutlined style={{ color: '#8896a4', cursor: 'pointer', fontSize: 14 }} />
          </div>
          <div style={{ padding: '4px 16px', flex: 1 }}>
            {systemLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 12 }}>No recent activity</div>
            ) : (
              systemLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f8f8f8' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: log.color, marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a2e' }}>{log.action}</div>
                      <div style={{ fontSize: 10, color: '#999' }}>{log.time}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{log.user}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 12, textAlign: 'center', background: '#fafafa' }}>
            <a href="/logs" style={{ color: '#0f3460', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>View Detailed Logs</a>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 14 }}>
            <CalendarOutlined style={{ color: '#f5a623', marginRight: 8 }} />Bookings Overview
          </div>
          <div style={{ padding: '16px' }}>
            {bookingPieConfig.data.some(d => d.value > 0)
              ? <Pie {...bookingPieConfig} height={220} />
              : <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>No booking data yet</div>
            }
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 14 }}>
            <ToolOutlined style={{ color: '#e94560', marginRight: 8 }} />Tickets Overview
          </div>
          <div style={{ padding: '16px' }}>
            {ticketPieConfig.data.some(d => d.value > 0)
              ? <Pie {...ticketPieConfig} height={220} />
              : <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>No ticket data yet</div>
            }
          </div>
        </div>
      </div>

      {/* ── Recent Tables ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}><CalendarOutlined style={{ color: '#0f3460', marginRight: 8 }} />Recent Bookings</span>
            <a href="/bookings" style={{ color: '#f5a623', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View All <ArrowRightOutlined /></a>
          </div>
          <Table dataSource={recentBookings} columns={bookingColumns} rowKey="id" pagination={false} size="small"
            style={{ padding: '0 8px' }}
            rowClassName={() => 'admin-table-row'}
          />
        </div>
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}><ToolOutlined style={{ color: '#e94560', marginRight: 8 }} />Recent Tickets</span>
            <a href="/tickets" style={{ color: '#f5a623', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View All <ArrowRightOutlined /></a>
          </div>
          <Table dataSource={recentTickets} columns={ticketColumns} rowKey="id" pagination={false} size="small"
            style={{ padding: '0 8px' }}
          />
        </div>
      </div>



      {/* ── Broadcast Modal ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationOutlined style={{ color: '#e94560' }} />
            <span>Send Campus-wide Announcement</span>
          </div>
        }
        open={broadcastModal}
        onOk={handleBroadcast}
        onCancel={() => setBroadcastModal(false)}
        confirmLoading={broadcasting}
        okText="Send Announcement"
        okButtonProps={{ style: { background: '#e94560' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Announcement Title</div>
            <Input
              placeholder="e.g. Campus Holiday Tomorrow"
              value={broadcastData.title}
              onChange={e => setBroadcastData({ ...broadcastData, title: e.target.value })}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Message Content</div>
            <Input.TextArea
              rows={4}
              placeholder="Enter the notification body..."
              value={broadcastData.body}
              onChange={e => setBroadcastData({ ...broadcastData, body: e.target.value })}
            />
          </div>
          <div style={{ background: '#fff7e6', padding: 12, borderRadius: 6, fontSize: 11, color: '#ad6800' }}>
            <InfoCircleOutlined /> This will send a real-time push notification via AWS SNS to all registered student and staff devices.
          </div>
        </div>
      </Modal>

      {/* ── Announcements Modal ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationOutlined style={{ color: '#0f3460' }} />
            <span>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</span>
          </div>
        }
        open={announcementModal}
        onOk={handleAnnouncementSave}
        onCancel={() => setAnnouncementModal(false)}
        okText={editingAnnouncement ? 'Update' : 'Create'}
        okButtonProps={{ style: { background: '#0f3460' } }}
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Title</div>
            <Input
              placeholder="Enter announcement title"
              value={announcementData.title}
              onChange={e => setAnnouncementData({ ...announcementData, title: e.target.value })}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Content</div>
            <Input.TextArea
              rows={4}
              placeholder="Enter announcement content..."
              value={announcementData.content}
              onChange={e => setAnnouncementData({ ...announcementData, content: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* ── Announcements List ── */}
      <div style={{ background: '#fffbf0', borderRadius: 6, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20, borderLeft: '4px solid #f5a623' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', borderBottom: '2px solid #0f3460', paddingBottom: 8, display: 'inline-block' }}>
            <NotificationOutlined style={{ color: '#0f3460', marginRight: 8 }} />Campus Announcements
          </div>
          <AntdButton type="primary" onClick={() => openAnnouncementModal()} style={{ background: '#0f3460' }}>
            + New Announcement
          </AntdButton>
        </div>
        {loadingAnnouncements ? <Spin /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>No announcements yet. Create one to get started.</div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} style={{ background: '#fafafa', borderRadius: 6, padding: 16, border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{ann.title}</div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{ann.content}</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 8 }}>
                        {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <Space>
                      <AntdButton size="small" icon={<EditOutlined />} onClick={() => openAnnouncementModal(ann)} />
                      <Popconfirm
                        title="Delete this announcement?"
                        onConfirm={() => handleAnnouncementDelete(ann.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <AntdButton size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
