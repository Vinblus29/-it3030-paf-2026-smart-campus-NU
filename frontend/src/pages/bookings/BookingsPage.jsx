import { useState, useEffect, useMemo } from 'react';
import { 
  Table, Button, Tag, Space, Modal, message, Card, Select, 
  Input, Row, Col, Statistic, Typography, Empty 
} from 'antd';
import { 
  CheckOutlined, CloseOutlined, EyeOutlined, CalendarOutlined,
  SearchOutlined, ClearOutlined 
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext'; 
import bookingService from '../../services/bookingService'; 

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const BookingsPage = () => {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  
  // Rejection state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [submittingReject, setSubmittingReject] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      message.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED' || b.status === 'CANCELLED').length,
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = !searchText || 
        b.facilityName?.toLowerCase().includes(searchText.toLowerCase()) ||
        b.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
        b.userEmail?.toLowerCase().includes(searchText.toLowerCase()) ||
        b.purpose?.toLowerCase().includes(searchText.toLowerCase()) ||
        b.id.toString().includes(searchText);
      
      const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchText, filterStatus]);

  const clearFilters = () => {
    setSearchText('');
    setFilterStatus('ALL');
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
            {record.startTime ? new Date(record.startTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : ''} - 
            {record.endTime ? new Date(record.endTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : ''}
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
    <div className="space-y-4">
      <Row gutter={12}>
        {[
          { label: 'Site-wide Bookings', value: stats.total, color: '#1677ff' },
          { label: 'Pending Reviews', value: stats.pending, color: '#fa8c16' },
          { label: 'Active Approvals', value: stats.approved, color: '#52c41a' },
          { label: 'Rejected/Cancelled', value: stats.rejected, color: '#d9d9d9' },
        ].map(({ label, value, color }) => (
          <Col xs={12} sm={6} key={label}>
            <Card size="small" style={{ borderTop: `3px solid ${color}` }}>
              <Statistic title={label} value={value} valueStyle={{ color, fontSize: 22 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm border-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bookings Management</h1>
            <p className="text-gray-500">Review and manage site-wide facility bookings</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <Input
            placeholder="Search facility, user, purpose, ID..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
          <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 180 }}>
            <Option value="ALL">All Statuses</Option>
            <Option value="PENDING"><Tag color="orange">PENDING</Tag></Option>
            <Option value="APPROVED"><Tag color="green">APPROVED</Tag></Option>
            <Option value="REJECTED"><Tag color="red">REJECTED</Tag></Option>
            <Option value="CANCELLED"><Tag color="default">CANCELLED</Tag></Option>
          </Select>
          {(searchText || filterStatus !== 'ALL') && (
            <Button icon={<ClearOutlined />} onClick={clearFilters}>Clear</Button>
          )}
          {(searchText || filterStatus !== 'ALL') && (
            <Text type="secondary" className="self-center text-sm">
              {filteredBookings.length} of {bookings.length} total bookings
            </Text>
          )}
        </div>

        {bookings.length > 0 ? (
          <Table 
            columns={columns}
            dataSource={filteredBookings}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bookings` }}
            locale={{
              emptyText: (searchText || filterStatus !== 'ALL')
                ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No bookings match your administration filters">
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </Empty>
                : 'No bookings records found'
            }}
          />
        ) : !loading && (
          <Empty description="No booking requests have been submitted yet" />
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
                  {new Date(selectedBooking.startTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(selectedBooking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
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

