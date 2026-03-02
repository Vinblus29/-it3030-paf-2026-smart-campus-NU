import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Modal, message, Empty } from 'antd';
import { PlusOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';
import bookingService from '../../services/bookingService';
import { useNavigate } from 'react-router-dom';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      message.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    Modal.confirm({
      title: 'Cancel Booking',
      content: 'Are you sure you want to cancel this booking?',
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await bookingService.cancelBooking(id);
          message.success('Booking cancelled successfully');
          fetchBookings();
        } catch (error) {
          message.error('Failed to cancel booking');
        }
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'orange',
      APPROVED: 'green',
      REJECTED: 'red',
      CANCELLED: 'default'
    };
    return colors[status] || 'default';
  };

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setViewModalVisible(true);
  };

  const columns = [
    {
      title: 'Facility',
      dataIndex: 'facilityName',
      key: 'facility',
      render: (text) => <span className="font-medium">{text || 'N/A'}</span>,
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {(record.status === 'PENDING' || record.status === 'APPROVED') && (
            <Button 
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={() => handleCancel(record.id)}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
            <p className="text-gray-500">View and manage your bookings</p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/facilities')}
          >
            New Booking
          </Button>
        </div>

        {bookings.length > 0 ? (
          <Table 
            columns={columns}
            dataSource={bookings}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty 
            description="You haven't made any bookings yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/facilities')}>
              Browse Facilities
            </Button>
          </Empty>
        )}
      </Card>

      {/* View Booking Modal */}
      <Modal
        title="Booking Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div>
              <label className="text-gray-500">Facility:</label>
              <p className="font-medium">{selectedBooking.facilityName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-gray-500">Date:</label>
              <p className="font-medium">{selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <label className="text-gray-500">Time:</label>
              <p className="font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
            </div>
            <div>
              <label className="text-gray-500">Status:</label>
              <p>
                <Tag color={getStatusColor(selectedBooking.status)}>{selectedBooking.status}</Tag>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBookingsPage;

