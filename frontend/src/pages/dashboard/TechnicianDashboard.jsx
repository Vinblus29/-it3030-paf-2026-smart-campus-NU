import { useState, useEffect } from 'react';
import { Table, Spin } from 'antd';
import {
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  SyncOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import { useAuth } from '../../context/AuthContext';
import ticketService from '../../services/ticketService';

const STATUS_COLORS = {
  OPEN: { bg: '#e6f4ff', text: '#096dd9', border: '#91caff' },
  IN_PROGRESS: { bg: '#fff7e6', text: '#d46b08', border: '#ffd591' },
  RESOLVED: { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
  CLOSED: { bg: '#f5f5f5', text: '#595959', border: '#d9d9d9' },
  PENDING: { bg: '#fff7e6', text: '#d46b08', border: '#ffd591' },
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

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await ticketService.getAllTickets();
      const allTickets = Array.isArray(res) ? res : (res?.content ?? []);
      setTickets(allTickets);
      setTicketStats({
        open: allTickets.filter(t => t.status === 'OPEN').length,
        inProgress: allTickets.filter(t => t.status === 'IN_PROGRESS').length,
        resolved: allTickets.filter(t => t.status === 'RESOLVED').length,
        closed: allTickets.filter(t => t.status === 'CLOSED').length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieConfig = {
    data: [
      { type: 'Open', value: ticketStats.open },
      { type: 'In Progress', value: ticketStats.inProgress },
      { type: 'Resolved', value: ticketStats.resolved },
      { type: 'Closed', value: ticketStats.closed },
    ],
    angleField: 'value', colorField: 'type', radius: 0.75, innerRadius: 0.6,
    label: { text: 'value', style: { fontWeight: 600, fontSize: 12 } },
    legend: { position: 'bottom' },
    color: ['#0f3460', '#f5a623', '#52c41a', '#8c8c8c'],
  };

  const getPriorityStyle = (p) => {
    const map = {
      HIGH: { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' },
      MEDIUM: { bg: '#fff7e6', text: '#d46b08', border: '#ffd591' },
      LOW: { bg: '#e6f4ff', text: '#096dd9', border: '#91caff' }
    };
    return map[p] || map.LOW;
  };

  const columns = [
    {
      title: 'Ticket', dataIndex: 'title', key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{text}</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{record.description?.substring(0, 50)}{record.description?.length > 50 ? '…' : ''}</div>
        </div>
      ),
    },
    {
      title: 'Priority', dataIndex: 'priority', key: 'priority',
      render: p => {
        const c = getPriorityStyle(p);
        return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{p}</span>;
      },
      filters: [{ text: 'High', value: 'HIGH' }, { text: 'Medium', value: 'MEDIUM' }, { text: 'Low', value: 'LOW' }],
      onFilter: (value, record) => record.priority === value,
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <StatusBadge status={s} /> },
    {
      title: 'Created', dataIndex: 'createdAt', key: 'createdAt',
      render: d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
    },
    {
      title: '', key: 'actions',
      render: (_, record) => (
        <a href={`/tickets?id=${record.id}`} style={{ color: '#f5a623', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
          Details <ArrowRightOutlined />
        </a>
      ),
    },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  const urgent = tickets.filter(t => t.status === 'OPEN' && t.priority === 'HIGH');

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#1a1a2e' }}>

      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: 8, padding: '28px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f5a623', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Technician Workspace
          </div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 700 }}>
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#b0b8d1', fontSize: 13 }}>
            Manage and resolve maintenance tickets assigned to you.
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

      {/* ── Stat Cards ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard icon={<ExclamationCircleOutlined />} label="Open Tickets" value={ticketStats.open} sub="requires attention" accent="#e94560" />
        <StatCard icon={<SyncOutlined />} label="In Progress" value={ticketStats.inProgress} sub="currently working" accent="#f5a623" />
        <StatCard icon={<CheckCircleOutlined />} label="Resolved" value={ticketStats.resolved} sub="completed tickets" accent="#52c41a" />
        <div style={{
          background: '#fff', borderRadius: 6, padding: '20px 22px', flex: 1, minWidth: 240,
          borderLeft: '4px solid #0f3460', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e' }}>94%</div>
            <div style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>Performance</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#52c41a', fontWeight: 700 }}>+2.4%</div>
            <div style={{ fontSize: 10, color: '#999' }}>this month</div>
          </div>
        </div>
      </div>

      {/* ── Urgent Ticker ── */}
      <div style={{
        background: '#1a1a2e', color: '#fff', padding: '10px 20px', borderRadius: 6,
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden'
      }}>
        <Tag color="error" style={{ margin: 0, fontSize: 10, fontWeight: 800 }}>URGENT</Tag>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
          Next maintenance window: Friday 10:00 PM · 4 High priority requests pending · System backup scheduled for midnight
        </div>
      </div>

      {/* ── Urgent Alert ── */}
      {urgent.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 6,
          padding: '12px 20px', marginBottom: 20
        }}>
          <ExclamationCircleOutlined style={{ fontSize: 22, color: '#e94560' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#cf1322', fontSize: 13 }}>
              {urgent.length} HIGH priority ticket{urgent.length > 1 ? 's' : ''} open
            </div>
            <div style={{ fontSize: 11, color: '#a8071a' }}>These require immediate attention</div>
          </div>
          <a href="/tickets" style={{ color: '#e94560', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View Now <ArrowRightOutlined />
          </a>
        </div>
      )}

      {/* ── Chart + Status Breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 14 }}>
            <ToolOutlined style={{ color: '#f5a623', marginRight: 8 }} />Tickets Overview
          </div>
          <div style={{ padding: 16 }}>
            {pieConfig.data.some(d => d.value > 0)
              ? <Pie {...pieConfig} height={220} />
              : <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>No ticket data yet</div>
            }
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 14 }}>
            <ToolOutlined style={{ color: '#0f3460', marginRight: 8 }} />Status Breakdown
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Open', value: ticketStats.open, total: tickets.length, color: '#e94560' },
              { label: 'In Progress', value: ticketStats.inProgress, total: tickets.length, color: '#f5a623' },
              { label: 'Resolved', value: ticketStats.resolved, total: tickets.length, color: '#52c41a' },
              { label: 'Closed', value: ticketStats.closed, total: tickets.length, color: '#8c8c8c' },
            ].map(({ label, value, total, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{label}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>{value} / {total}</span>
                </div>
                <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${total > 0 ? (value / total) * 100 : 0}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <a href="/tickets" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#0f3460', color: '#fff', padding: '10px', borderRadius: 6,
              textDecoration: 'none', fontWeight: 600, fontSize: 13, transition: 'background 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#16213e'}
              onMouseLeave={e => e.currentTarget.style.background = '#0f3460'}
            >
              <ToolOutlined /> View All Tickets
            </a>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ background: '#fff', borderRadius: 6, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', borderBottom: '2px solid #f5a623', paddingBottom: 8, marginBottom: 16, display: 'inline-block' }}>
          Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { icon: <ToolOutlined />, label: 'Active Tasks', href: '/tickets', accent: '#e94560' },
            { icon: <SendOutlined />, label: 'Campus Chat', href: '/chat', accent: '#0f3460' },
            { icon: <BuildOutlined />, label: 'Facility Status', href: '/facilities', accent: '#f5a623' },
            { icon: <UserOutlined />, label: 'My Profile', href: '/profile', accent: '#52c41a' },
          ].map(({ icon, label, href, accent }) => (
            <a key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '16px 10px', background: accent + '08', borderRadius: 6, textDecoration: 'none',
              border: `1px solid ${accent}22`, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = accent + '18'; e.currentTarget.style.borderColor = accent; }}
              onMouseLeave={e => { e.currentTarget.style.background = accent + '08'; e.currentTarget.style.borderColor = accent + '22'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: accent }}>{icon}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#333', textAlign: 'center' }}>{label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Tickets Table ── */}
      <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            <ToolOutlined style={{ color: '#e94560', marginRight: 8 }} />All Tickets
          </span>
          <span style={{ fontSize: 12, color: '#999' }}>{tickets.length} total</span>
        </div>
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `${total} tickets` }}
          size="small"
          style={{ padding: '0 8px' }}
        />
      </div>
    </div>
  );
};

export default TechnicianDashboard;
