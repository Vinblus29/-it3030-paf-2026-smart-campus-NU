import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Button, Table, Tag, Badge } from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import { useAuth } from '../../context/AuthContext';
import ticketService from '../../services/ticketService';
import bookingService from '../../services/bookingService';

const { Title, Text } = Typography;

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const allTickets = await ticketService.getAllTickets();
      setTickets(allTickets);

      // Calculate stats
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

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'orange',
      APPROVED: 'green',
      REJECTED: 'red',
      CANCELLED: 'default',
      OPEN: 'blue',
      IN_PROGRESS: 'processing',
      RESOLVED: 'success',
      CLOSED: 'default'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      HIGH: 'red',
      MEDIUM: 'orange',
      LOW: 'blue'
    };
    return colors[priority] || 'default';
  };

  // Pie chart data
  const pieData = [
    { type: 'Open', value: ticketStats.open },
    { type: 'In Progress', value: ticketStats.inProgress },
    { type: 'Resolved', value: ticketStats.resolved },
    { type: 'Closed', value: ticketStats.closed },
  ];

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      text: 'value',
      style: {
        fontWeight: 600,
      },
    },
    legend: {
      position: 'bottom',
    },
    color: ['#1890ff', '#faad14', '#52c41a', '#8c8c8c'],
  };

  const columns = [
    {
      title: 'Ticket',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-400 text-sm">{record.description?.substring(0, 40)}...</div>
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>,
      filters: [
        { text: 'High', value: 'HIGH' },
        { text: 'Medium', value: 'MEDIUM' },
        { text: 'Low', value: 'LOW' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          href={`/tickets?id=${record.id}`}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} className="text-white mb-1">
              Welcome back, {user?.firstName}!
            </Title>
            <Text className="text-orange-100">
              Manage and resolve tickets assigned to you.
            </Text>
          </Col>
          <Col>
            <div className="text-right">
              <Text className="text-orange-100 block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Stats Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Open Tickets"
              value={ticketStats.open}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="In Progress"
              value={ticketStats.inProgress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Resolved"
              value={ticketStats.resolved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Tickets"
              value={tickets.length}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Tickets Overview">
            {pieData.some(d => d.value > 0) ? (
              <Pie {...pieConfig} height={250} />
            ) : (
              <div className="text-center py-12 text-gray-400">No ticket data</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Button type="primary" block href="/tickets" size="large">
                  View All Tickets
                </Button>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Statistic 
                    title="Open" 
                    value={ticketStats.open} 
                    prefix={<Badge status="processing" />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Statistic 
                    title="In Progress" 
                    value={ticketStats.inProgress} 
                    prefix={<Badge status="warning" />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Tickets Table */}
      <Card title="Recent Tickets">
        <Table 
          columns={columns}
          dataSource={tickets.slice(0, 10)}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

export default TechnicianDashboard;

