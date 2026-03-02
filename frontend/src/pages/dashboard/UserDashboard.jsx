import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Button, List, Tag, Empty } from 'antd';
import { 
  CalendarOutlined, 
  ToolOutlined, 
  BellOutlined,
  PlusOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import ticketService from '../../services/ticketService';

const { Title, Text } = Typography;

const UserDashboard = () => {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookings, tickets] = await Promise.all([
        bookingService.getMyBookings(),
        ticketService.getMyTickets()
      ]);
      setMyBookings(bookings.slice(0, 3));
      setMyTickets(tickets.slice(0, 3));
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

  const pendingBookings = myBookings.filter(b => b.status === 'PENDING').length;
  const pendingTickets = myTickets.filter(t => t.status === 'OPEN').length;
  const approvedBookings = myBookings.filter(b => b.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} className="text-white mb-1">
              Welcome back, {user?.firstName}!
            </Title>
            <Text className="text-green-100">
              Manage your bookings and tickets from here.
            </Text>
          </Col>
          <Col>
            <div className="text-right">
              <Text className="text-green-100 block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="My Bookings"
              value={myBookings.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary">{approvedBookings} approved</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Pending Approval"
              value={pendingBookings}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary">bookings waiting</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="My Tickets"
              value={myTickets.length}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary">{pendingTickets} open</Text>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Button type="primary" block href="/my-bookings" icon={<PlusOutlined />}>
              New Booking
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button type="primary" block href="/my-tickets" icon={<PlusOutlined />}>
              New Ticket
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button type="primary" block href="/facilities" icon={<CalendarOutlined />}>
              View Facilities
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button type="primary" block href="/notifications" icon={<BellOutlined />}>
              Notifications
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="My Recent Bookings"
            extra={<Button type="link" href="/my-bookings">View All</Button>}
          >
            {myBookings.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={myBookings}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <CalendarOutlined className="text-blue-600" />
                        </div>
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <span>{item.facilityName || 'Facility Booking'}</span>
                          <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                        </div>
                      }
                      description={`${item.date ? new Date(item.date).toLocaleDateString() : ''} - ${item.startTime || ''}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No bookings yet" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="My Recent Tickets"
            extra={<Button type="link" href="/my-tickets">View All</Button>}
          >
            {myTickets.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={myTickets}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <ToolOutlined className="text-purple-600" />
                        </div>
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <span>{item.title}</span>
                          <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                        </div>
                      }
                      description={item.description?.substring(0, 50) + '...'}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No tickets yet" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserDashboard;

