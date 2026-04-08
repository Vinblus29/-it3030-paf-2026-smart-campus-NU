import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Button, Table, Tag, Badge } from 'antd';
import {
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import { useAuth } from '../../context/AuthContext';
import ticketService from '../../services/ticketService';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
    avgResolutionHours: 0, byPriority: {}
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsData, assigned] = await Promise.all([
        ticketService.getStats(),
        ticketService.getAssignedTickets()
      ]);
      setStats(statsData);
      setRecentTickets(assigned.slice(0, 8));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLOR = {
    OPEN: 'blue', IN_PROGRESS: 'processing', RESOLVED: 'success',
    CLOSED: 'default', REJECTED: 'error'
  };
  const PRIORITY_COLOR = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red', CRITICAL: 'magenta' };

  const pieData = [
    { type: 'Open', value: stats.open },
    { type: 'In Progress', value: stats.inProgress },
    { type: 'Resolved', value: stats.resolved },
    { type: 'Closed', value: stats.closed },
  ].filter(d => d.value > 0);

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: { text: 'value', style: { fontWeight: 600 } },
    legend: { position: 'bottom' },
    color: ['#1890ff', '#faad14', '#52c41a', '#8c8c8c'],
  };

  const columns = [
    {
      title: 'Ticket', dataIndex: 'title', key: 'title',
      render: (text, r) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-400 text-xs">{r.category} · {r.location}</div>
        </div>
      )
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <StatusBadge status={s} /> },
    {
      title: 'Priority', dataIndex: 'priority', key: 'priority',
      render: p => <Tag color={PRIORITY_COLOR[p]}>{p}</Tag>,
      filters: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(v => ({ text: v, value: v })),
      onFilter: (v, r) => r.priority === v,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: s => <Tag color={STATUS_COLOR[s]}>{s?.replace('_', ' ')}</Tag>
    },
    {
      title: 'Created', dataIndex: 'createdAt', key: 'createdAt',
      render: d => d ? new Date(d).toLocaleDateString() : '-'
    },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  const urgent = tickets.filter(t => t.status === 'OPEN' && t.priority === 'HIGH');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} className="text-white mb-1">Welcome back, {user?.firstName}!</Title>
            <Text className="text-orange-100">Here are your assigned tickets.</Text>
          </Col>
          <Col>
            <Text className="text-orange-100 block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic title="Assigned to Me" value={stats.total}
              prefix={<ToolOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic title="In Progress" value={stats.inProgress}
              prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic title="Resolved" value={stats.resolved}
              prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        {/* #5 — avg resolution time */}
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic title="Avg Resolution Time" value={stats.avgResolutionHours}
              suffix="hrs" prefix={<ThunderboltOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Pie chart */}
        <Col xs={24} lg={12}>
          <Card title="My Tickets Overview">
            {pieData.length > 0
              ? <Pie {...pieConfig} height={250} />
              : <div className="text-center py-12 text-gray-400">No assigned tickets</div>
            }
          </Card>
        </Col>

        {/* Priority breakdown from stats API */}
        <Col xs={24} lg={12}>
          <Card title="Priority Breakdown">
            <Row gutter={[12, 12]}>
              {Object.entries(stats.byPriority || {}).map(([p, count]) => (
                <Col span={12} key={p}>
                  <Card size="small" hoverable>
                    <Statistic
                      title={<Tag color={PRIORITY_COLOR[p]}>{p}</Tag>}
                      value={count}
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Card>
                </Col>
              ))}
              {Object.keys(stats.byPriority || {}).length === 0 && (
                <Col span={24}>
                  <div className="text-center py-8 text-gray-400">No data</div>
                </Col>
              )}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent assigned tickets */}
      <Card
        title="My Assigned Tickets"
        extra={<Button type="primary" onClick={() => navigate('/tickets')}>View All</Button>}
      >
        <Table
          columns={columns}
          dataSource={recentTickets}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </div>
    </div>
  );
};

export default TechnicianDashboard;
