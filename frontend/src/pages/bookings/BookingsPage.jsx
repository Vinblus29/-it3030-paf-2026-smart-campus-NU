import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Card, Select } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';

const { Option } = Select;

const BookingsPage = () => {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      let data;
      if (filter === 'ALL') {
        data = await bookingService.getAllBookings();
      } else {
        data = await bookingService.getBookingsByStatus(filter);
      }
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      message.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await bookingService.approveBooking(id);
      message.success('Booking approved successfully');
      fetchBookings();
    } catch (error) {
      message.error('Failed to approve booking');
    }
  };

  const handleReject = async (id) => {
    Modal.confirm({
      title: 'Reject Booking',
      content: 'Are you sure you want to reject this booking?',
      okText: 'Yes, Reject',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await bookingService.rejectBooking(id, 'Rejected by admin');
          message.success('Booking rejected');
          fetchBookings();
        } catch (error) {
          message.error('Failed to reject booking');
        }
      }
    });
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
          message.success('Booking cancelled');
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
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.userName || record.user?.firstName + ' ' + record.user?.lastName}</div>
          <div className="text-gray-400 text-sm">{record.userEmail || record.user?.email}</div>
        </div>
      ),
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
          {record.status === 'PENDING' && isAdmin && (
            <>
              <Button 
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                className="bg-green-500 border-green-500"
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
              <Button 
                danger
                icon={<CloseOutlined />}
                size="small"
                onClick={() => handleReject(record.id)}
              >
                Reject
              </Button>
            </>
          )}
          {(record.status === 'APPROVED' || record.status === 'PENDING') && (
            <Button 
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
            <h1 className="text-2xl font-bold text-gray-800">Bookings Management</h1>
            <p className="text-gray-500">Manage facility bookings</p>
          </div>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 200 }}
          >
            <Option value="ALL">All Status</Option>
            <Option value="PENDING">Pending</Option>
            <Option value="APPROVED">Approved</Option>
            <Option value="REJECTED">Rejected</Option>
            <Option value="CANCELLED">Cancelled</Option>
          </Select>
        </div>

        <Table 
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
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
              <label className="text-gray-500">User:</label>
              <p className="font-medium">{selectedBooking.userName || selectedBooking.user?.firstName + ' ' + selectedBooking.user?.lastName}</p>
            </div>
            <div>
              <label className="text-gray-500">Email:</label>
              <p className="font-medium">{selectedBooking.userEmail || selectedBooking.user?.email}</p>
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

export default BookingsPage;

