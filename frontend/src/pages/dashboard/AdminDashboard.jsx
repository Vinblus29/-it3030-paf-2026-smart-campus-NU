import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button, Typography } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  ToolOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  RiseOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import { Pie, Column } from '@ant-design/charts';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import facilityService from '../../services/facilityService';
import ticketService from '../../services/ticketService';
import axios from 'axios';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFacilities: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalTickets: 0,
    pendingTickets: 0,
    totalUsers: 0,
    pendingUsers: 0,
    enabledUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [bookingStats, setBookingStats] = useState({});
  const [ticketStats, setTicketStats] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [facilities, bookings, tickets, userStats] = await Promise.all([
        facilityService.getAllFacilities(),
        bookingService.getAllBookings(),
        ticketService.getAllTickets(),
        axios.get('/api/admin/stats')
      ]);

      const pendingBookings = bookings.filter(b => b.status === 'PENDING');
      const pendingTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');

      // Calculate booking stats by status
      const bookingByStatus = {
        APPROVED: bookings.filter(b => b.status === 'APPROVED').length,
        PENDING: bookings.filter(b => b.status === 'PENDING').length,
        REJECTED: bookings.filter(b => b.status === 'REJECTED').length,
        CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
      };

      // Calculate ticket stats by status
      const ticketByStatus = {
        OPEN: tickets.filter(t => t.status === 'OPEN').length,
        IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
        CLOSED: tickets.filter(t => t.status === 'CLOSED').length,
      };

      setBookingStats(bookingByStatus);
      setTicketStats(ticketByStatus);

      setStats({
        totalFacilities: facilities.length,
        totalBookings: bookings.length,
        pendingBookings: pendingBookings.length,
        totalTickets: tickets.length,
        pendingTickets: pendingTickets.length,
        totalUsers: userStats.data.totalUsers || 0,
        pendingUsers: userStats.data.pendingUsers || 0,
        enabledUsers: userStats.data.enabledUsers || 0
      });

      setRecentBookings(bookings.slice(0, 5));
      setRecentTickets(tickets.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  // Pie chart config for bookings
  const bookingPieData = Object.entries(bookingStats).map(([key, value]) => ({
    type: key,
    value: value
  }));

  const bookingPieConfig = {
    data: bookingPieData,
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
    color: ['#52c41a', '#faad14', '#ff4d4f', '#8c8c8c'],
  };

  // Pie chart config for tickets
  const ticketPieData = Object.entries(ticketStats).map(([key, value]) => ({
    type: key,
    value: value
  }));

  const ticketPieConfig = {
    data: ticketPieData,
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
    color: ['#1890ff', '#1890ff', '#52c41a', '#8c8c8c'],
  };

  const bookingColumns = [
    {
      title: 'Facility',
      dataIndex: 'facilityName',
      key: 'facility',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => `${record.startTime || ''} - ${record.endTime || ''}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
  ];

  const ticketColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const color = priority === 'HIGH' ? 'red' : priority === 'MEDIUM' ? 'orange' : 'blue';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} className="text-white mb-1">
              Welcome back, {user?.firstName}!
            </Title>
            <Text className="text-blue-100">
              Here's what's happening on campus today.
            </Text>
          </Col>
          <Col>
            <div className="text-right">
              <Text className="text-blue-100 block">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Stats Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary">{stats.enabledUsers} active, {stats.pendingUsers} pending</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Facilities"
              value={stats.totalFacilities}
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Bookings"
              value={stats.totalBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary">{stats.pendingBookings} pending approval</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Tickets"
              value={stats.totalTickets}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Text type="secondary">{stats.pendingTickets} open</Text>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Bookings Overview">
            {bookingPieData.some(d => d.value > 0) ? (
              <Pie {...bookingPieConfig} height={250} />
            ) : (
              <div className="text-center py-12 text-gray-400">No booking data</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Tickets Overview">
            {ticketPieData.some(d => d.value > 0) ? (
              <Pie {...ticketPieConfig} height={250} />
            ) : (
              <div className="text-center py-12 text-gray-400">No ticket data</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Recent Bookings" 
            extra={<Button type="link" href="/bookings">View All</Button>}
          >
            <Table 
              dataSource={recentBookings} 
              columns={bookingColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="Recent Tickets" 
            extra={<Button type="link" href="/tickets">View All</Button>}
          >
            <Table 
              dataSource={recentTickets} 
              columns={ticketColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Button type="primary" block href="/users" icon={<UserOutlined />}>
              Manage Users
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button type="primary" block href="/bookings" icon={<CalendarOutlined />}>
              Manage Bookings
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button type="primary" block href="/tickets" icon={<ToolOutlined />}>
              Manage Tickets
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button type="primary" block href="/facilities" icon={<ApartmentOutlined />}>
              Manage Facilities
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AdminDashboard;

