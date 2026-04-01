import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Card, Select, Input } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext'; 
import bookingService from '../../services/bookingService'; 

const { Option } = Select;
const { TextArea } = Input;

const BookingsPage = () => {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  
  // Rejection state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [submittingReject, setSubmittingReject] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
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
      const errorMsg = error.response?.data?.message || 'Failed to approve booking';
      message.error(errorMsg);
    }
  };

  const showRejectModal = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      message.warning('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmittingReject(true);
      await bookingService.rejectBooking(rejectingId, rejectReason);
      message.success('Booking rejected');
      setRejectModalVisible(false);
      fetchBookings();
    } catch (error) {
      message.error('Failed to reject booking');
    } finally {
      setSubmittingReject(false);
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
          <div className="font-medium">{record.userName}</div>
          <div className="text-gray-400 text-sm">{record.userEmail}</div>
        </div>
      ),
    },
    {
      title: 'Time Slot',
      key: 'time',
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium">
            {record.startTime ? new Date(record.startTime).toLocaleDateString() : '-'}
          </div>
          <div className="text-xs text-gray-500">
            {record.startTime ? new Date(record.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} - 
            {record.endTime ? new Date(record.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
          </div>
        </div>
      ),
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
                onClick={() => showRejectModal(record.id)}
              >
                Reject
              </Button>
            </>
          )}
          {(record.status === 'APPROVED') && (
            <Button 
              size="small"
              danger
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
            <p className="text-gray-500">Review and manage site-wide facility bookings</p>
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
          </Button>,
          selectedBooking?.status === 'PENDING' && isAdmin && (
            <Button key="approve" type="primary" className="bg-green-500" onClick={() => { setViewModalVisible(false); handleApprove(selectedBooking.id); }}>
              Approve
            </Button>
          )
        ]}
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-500 text-xs uppercase font-bold">Facility</label>
                <p className="font-medium">{selectedBooking.facilityName}</p>
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase font-bold">Status</label>
                <p><Tag color={getStatusColor(selectedBooking.status)}>{selectedBooking.status}</Tag></p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-500 text-xs uppercase font-bold">User</label>
                <p className="font-medium">{selectedBooking.userName}</p>
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase font-bold">Email</label>
                <p className="font-medium">{selectedBooking.userEmail}</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="text-gray-500 text-xs uppercase font-bold block mb-1">Schedule</label>
              <div className="flex items-center gap-2">
                <CalendarOutlined />
                <span className="font-medium">
                  {new Date(selectedBooking.startTime).toLocaleString()} - {new Date(selectedBooking.endTime).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase font-bold">Purpose</label>
              <p className="bg-blue-50 p-3 rounded italic text-gray-700">"{selectedBooking.purpose}"</p>
            </div>

            {selectedBooking.numberOfPeople > 0 && (
              <div>
                <label className="text-gray-500 text-xs uppercase font-bold">Attendees</label>
                <p className="font-medium">{selectedBooking.numberOfPeople}</p>
              </div>
            )}

            {selectedBooking.rejectionReason && (
              <div className="p-3 border border-red-100 bg-red-50 rounded-lg">
                <label className="text-red-500 text-xs uppercase font-bold block mb-1">Rejection Reason</label>
                <p className="text-red-700">{selectedBooking.rejectionReason}</p>
              </div>
            )}
            
            {selectedBooking.approvedBy && (
              <div>
                <label className="text-gray-500 text-xs uppercase font-bold">Approved By</label>
                <p className="font-medium">{selectedBooking.approvedBy} on {new Date(selectedBooking.approvedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        title="Reason for Rejection"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={submittingReject}
        okText="Reject Booking"
        okType="danger"
      >
        <p className="mb-4 text-gray-500">Please provide a brief reason why this booking is being rejected. This will be sent to the user.</p>
        <TextArea 
          rows={4} 
          value={rejectReason} 
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason here..."
        />
      </Modal>
    </div>
  );
};

export default BookingsPage;

