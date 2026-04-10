import { useState, useEffect, useMemo } from 'react'; 
import { 
  Card, Table, Button, Tag, Space, Modal, message, Empty, 
  Row, Col, Statistic, Input, Select, Typography, Alert, Spin 
} from 'antd'; 
import { 
  PlusOutlined, EyeOutlined, CloseOutlined, CalendarOutlined, 
  InfoCircleOutlined, SearchOutlined, ClearOutlined 
} from '@ant-design/icons'; 
import bookingService from '../../services/bookingService'; 
import { useNavigate } from 'react-router-dom'; 

const { Option } = Select;
const { Text } = Typography;

const MyBookingsPage = () => { 
  const navigate = useNavigate(); 
  const [bookings, setBookings] = useState([]); 
  const [allBookings, setAllBookings] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [fetchError, setFetchError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null); 
  const [viewModalVisible, setViewModalVisible] = useState(false); 
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrBase64, setQrBase64] = useState('');

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { 
    fetchBookings(); 
  }, []); 

  const fetchBookings = async () => { 
    try { 
      setLoading(true);
      setFetchError(null);
      const data = await bookingService.getMyBookings(); 
      setBookings(data); 
      setAllBookings(data);
    } catch (error) { 
      console.error('Error fetching bookings:', error);
      setFetchError('Unable to load your bookings. Please check your connection and try again.');
    } finally { 
      setLoading(false); 
    } 
  }; 

  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === 'PENDING').length,
    approved: allBookings.filter(b => b.status === 'APPROVED').length,
    rejected: allBookings.filter(b => b.status === 'REJECTED').length,
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = !searchText || 
        b.facilityName?.toLowerCase().includes(searchText.toLowerCase()) ||
        b.purpose?.toLowerCase().includes(searchText.toLowerCase()) ||
        b.id.toString().includes(searchText);
      
      const matchesStatus = !filterStatus || b.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchText, filterStatus]);

  const clearFilters = () => {
    setSearchText('');
    setFilterStatus('');
  };

  const handleCancel = async (id) => { 
    Modal.confirm({ 
      title: 'Cancel Booking', 
      content: 'Are you sure you want to cancel this booking? This action cannot be undone.',
      okText: 'Yes, Cancel', 
      okType: 'danger', 
      cancelText: 'Keep Booking', 
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

  const handleViewQR = async (id) => {
    try {
      const base64 = await bookingService.getBookingQR(id);
      setQrBase64(base64);
      setQrModalVisible(true);
    } catch (error) {
      message.error('Failed to generate QR code');
    }
  };

  const handleDownloadQR = () => {
    if (!qrBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrBase64}`;
    link.download = `booking-qr-${selectedBooking?.id || 'code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('QR Code download started');
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
      render: (text) => <span className="font-medium text-blue-600">{text || 'N/A'}</span>,
    }, 
    { 
      title: 'Schedule', 
      key: 'time', 
      render: (_, record) => ( 
        <div> 
          <div className="font-medium">{record.startTime ? new Date(record.startTime).toLocaleDateString() : '-'}</div>
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
      render: (status) => <Tag color={getStatusColor(status)} className="rounded-full px-3">{status}</Tag>,
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
            Details 
          </Button> 
          {(record.status === 'PENDING' || record.status === 'APPROVED') && ( 
            <Button  
              danger 
              ghost 
              icon={<CloseOutlined />} 
              size="small" 
              onClick={() => handleCancel(record.id)} 
            > 
              Cancel 
            </Button> 
          )} 
          {record.status === 'APPROVED' && !record.checkedIn && (
            <Button 
              icon={<CalendarOutlined />} 
              onClick={() => handleViewQR(record.id)}
              className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
            >
              View QR
            </Button>
          )}
          {record.checkedIn && (
            <Tag color="#87d068">Checked In</Tag>
          )}
        </Space> 
      ), 
    }, 
  ]; 

  return ( 
    <div className="space-y-4">

      {/* Inline error alert — no popup */}
      {fetchError && (
        <Alert
          message="Failed to Load Bookings"
          description={fetchError}
          type="error"
          showIcon
          closable
          onClose={() => setFetchError(null)}
          action={
            <Button size="small" danger onClick={fetchBookings}>
              Retry
            </Button>
          }
          className="rounded-xl"
        />
      )}

      <Row gutter={12}>
        {[
          { label: 'Total', value: stats.total, color: '#1677ff' },
          { label: 'Pending', value: stats.pending, color: '#fa8c16' },
          { label: 'Approved', value: stats.approved, color: '#52c41a' },
          { label: 'Rejected', value: stats.rejected, color: '#f5222d' },
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
            <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1> 
            <p className="text-gray-500">Keep track of your facility and resource requests</p>
          </div> 
          <Button  
            type="primary"  
            size="large" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/facilities')} 
            className="rounded-lg shadow-md" 
          > 
            New Booking 
          </Button> 
        </div> 

        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <Input
            placeholder="Search facility, purpose, ID..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 150 }}>
            <Option value="">All Statuses</Option>
            <Option value="PENDING"><Tag color="orange">PENDING</Tag></Option>
            <Option value="APPROVED"><Tag color="green">APPROVED</Tag></Option>
            <Option value="REJECTED"><Tag color="red">REJECTED</Tag></Option>
            <Option value="CANCELLED"><Tag color="default">CANCELLED</Tag></Option>
          </Select>
          {(searchText || filterStatus) && (
            <Button icon={<ClearOutlined />} onClick={clearFilters}>Clear</Button>
          )}
          {(searchText || filterStatus) && (
            <Text type="secondary" className="self-center text-sm">
              {filteredBookings.length} of {bookings.length} bookings
            </Text>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spin size="large" />
            <p className="animate-pulse text-indigo-500 text-base font-medium">Loading your bookings...</p>
          </div>
        ) : bookings.length > 0 ? (
          <Table 
            columns={columns}
            dataSource={filteredBookings}
            rowKey="id"
            loading={false}
            pagination={{ pageSize: 8, showTotal: total => `${total} bookings` }}
            className="booking-history-table"
            locale={{
              emptyText: (searchText || filterStatus)
                ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No bookings match your filters">
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </Empty>
                : 'No bookings yet'
            }}
          />
        ) : !fetchError && (
          <Empty 
            description={
              <div className="text-center">
                <p className="text-gray-500 mb-2">You haven't made any bookings yet</p>
                <Button type="link" onClick={() => navigate('/facilities')}>
                  Explore available facilities now
                </Button>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {/* View Booking Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <InfoCircleOutlined className="text-blue-500" />
            <span>Booking Information</span>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={500}
      >
        {selectedBooking && (
          <div className="space-y-6 py-2">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <label className="text-gray-400 text-xs uppercase font-bold block mb-1">Facility</label>
                <p className="text-lg font-bold text-gray-800">{selectedBooking.facilityName}</p>
                <Tag color="blue">{selectedBooking.facilityType}</Tag>
              </div>
              <div className="text-right">
                <label className="text-gray-400 text-xs uppercase font-bold block mb-1">Current Status</label>
                <Tag color={getStatusColor(selectedBooking.status)} className="text-sm font-semibold px-4 py-1 rounded-full m-0">
                  {selectedBooking.status}
                </Tag>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <CalendarOutlined className="text-blue-500 text-lg" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs uppercase font-bold block">Scheduled Time</label>
                  <p className="font-medium text-gray-700">
                    {new Date(selectedBooking.startTime).toLocaleString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    to {new Date(selectedBooking.endTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase font-bold block mb-1">Purpose of Visit</label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                  "{selectedBooking.purpose}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs uppercase font-bold block mb-1">Attendees</label>
                  <p className="font-semibold text-gray-700">{selectedBooking.numberOfPeople || 1} Person(s)</p>
                </div>
                <div>
                  <label className="text-gray-400 text-xs uppercase font-bold block mb-1">Request ID</label>
                  <p className="text-gray-500 font-mono">#BK-{selectedBooking.id.toString().padStart(5, '0')}</p>
                </div>
              </div>

              {selectedBooking.status === 'REJECTED' && selectedBooking.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <label className="text-red-500 text-xs uppercase font-bold block mb-1">Rejection Remarks</label>
                  <p className="text-red-700 font-medium">{selectedBooking.rejectionReason}</p>
                </div>
              )}

              {selectedBooking.status === 'APPROVED' && selectedBooking.approvedBy && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <label className="text-green-500 text-xs uppercase font-bold block mb-1">Approval Info</label>
                  <p className="text-green-700 font-medium">Approved by {selectedBooking.approvedBy}</p>
                  <p className="text-xs text-green-600">at {new Date(selectedBooking.approvedAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400 text-center pt-4">
              Requested on {new Date(selectedBooking.createdAt).toLocaleString()}
            </div>
          </div>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        title="Check-in QR Code"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="download" type="primary" onClick={handleDownloadQR}>
            Download QR
          </Button>,
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            Close
          </Button>
        ]}
        width={350}
        centered
      >
        <div className="text-center p-4">
          <p className="mb-4 text-gray-500">Show this QR code to the technician/admin at the facility for check-in.</p>
          <div className="bg-white p-4 rounded-xl shadow-inner inline-block border-2 border-dashed border-blue-200">
            {qrBase64 ? (
              <img src={`data:image/png;base64,${qrBase64}`} alt="Booking QR Code" style={{ width: 250, height: 250 }} />
            ) : (
              <div style={{ width: 250, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Loading...
              </div>
            )}
          </div>
          {selectedBooking && (
            <div className="mt-4">
              <p className="font-bold text-lg">{selectedBooking.facilityName}</p>
              <p className="text-gray-500">BK-{selectedBooking.id}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MyBookingsPage;

