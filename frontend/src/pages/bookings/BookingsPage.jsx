import { useState, useEffect, useMemo } from 'react';
import { 
  Table, Button, Tag, Space, Modal, message, Card, Select, 
  Input, Row, Col, Statistic, Typography, Empty, Tabs, DatePicker, Spin 
} from 'antd';
import { 
  CheckOutlined, CloseOutlined, EyeOutlined, CalendarOutlined,
  SearchOutlined, ClearOutlined, BarChartOutlined, EditOutlined 
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext'; 
import bookingService from '../../services/bookingService';
import BookingModal from '../../components/BookingModal';
import { Pie, Column } from '@ant-design/charts';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
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

  // Check-in Logs state
  const [logFacilityFilter, setLogFacilityFilter] = useState('ALL');
  const [logDateFilter, setLogDateFilter] = useState(null);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDateRange, setAnalyticsDateRange] = useState([]);

  // Edit booking state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

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

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      let from, to;
      if (analyticsDateRange.length === 2) {
        from = analyticsDateRange[0].format('YYYY-MM-DDTHH:mm:ss');
        to = analyticsDateRange[1].format('YYYY-MM-DDTHH:mm:ss');
      }
      const data = await bookingService.getAnalytics(from, to);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      message.error('Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    noShow: bookings.filter(b => b.status === 'NO_SHOW').length,
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

  const checkInLogs = useMemo(() => {
    return bookings.filter(b => b.checkedIn);
  }, [bookings]);

  const uniqueFacilities = useMemo(() => {
    const facilities = new Set();
    checkInLogs.forEach(b => {
        if (b.facilityName) facilities.add(b.facilityName);
    });
    return Array.from(facilities);
  }, [checkInLogs]);

  const filteredLogs = useMemo(() => {
      return checkInLogs.filter(b => {
          const matchFacility = logFacilityFilter === 'ALL' || b.facilityName === logFacilityFilter;
          let matchDate = true;
          if (logDateFilter) {
             const logTime = b.checkInTime ? new Date(b.checkInTime) : new Date(b.startTime);
             const year = logTime.getFullYear();
             const month = String(logTime.getMonth() + 1).padStart(2, '0');
             const day = String(logTime.getDate()).padStart(2, '0');
             const checkInDateStr = `${year}-${month}-${day}`;
             matchDate = checkInDateStr === logDateFilter;
          }
          return matchFacility && matchDate;
      });
  }, [checkInLogs, logFacilityFilter, logDateFilter]);

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
          {(record.status === 'PENDING' || record.status === 'APPROVED') && (
            <Button 
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingBooking(record);
                setEditModalVisible(true);
              }}
            >
              Edit
            </Button>
          )}
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

  const logColumns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-medium text-gray-500">#{text}</span>,
    },
    {
      title: 'Facility',
      dataIndex: 'facilityName',
      key: 'facility',
      render: (text) => <span className="font-semibold text-blue-600">{text || 'N/A'}</span>,
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.userName}</div>
          <div className="text-gray-400 text-xs">{record.userEmail}</div>
        </div>
      ),
    },
    {
      title: 'Scheduled Time',
      key: 'time',
      render: (_, record) => (
        <div className="text-sm">
          {record.startTime ? new Date(record.startTime).toLocaleString('en-US', {month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'}) : '-'} 
          <br/>
          to {record.endTime ? new Date(record.endTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : '-'}
        </div>
      ),
    },
    {
      title: 'Check-In Time',
      key: 'checkInTime',
      render: (_, record) => (
        <div className="text-green-600 font-bold">
           {record.checkInTime ? new Date(record.checkInTime).toLocaleString('en-US', {month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'}) : 'Verified'}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />} 
          size="small"
          onClick={() => handleView(record)}
        >
          View
        </Button>
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
          { label: 'Rejected', value: stats.rejected, color: '#f5222d' },
          { label: 'Cancelled', value: stats.cancelled, color: '#8c8c8c' },
          { label: 'No-Shows', value: stats.noShow, color: '#722ed1' },
        ].map(({ label, value, color }) => (
          <Col xs={12} sm={8} md={4} key={label}>
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

        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Booking Requests" key="1">
            <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 mt-2">
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
          </Tabs.TabPane>

          <Tabs.TabPane tab="Check-in Logs" key="2">
             <div className="flex flex-wrap gap-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
               <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-800">Filter by Facility:</span>
                  <Select 
                    value={logFacilityFilter} 
                    onChange={setLogFacilityFilter} 
                    style={{ width: 250 }}
                    showSearch
                  >
                    <Option value="ALL">All Facilities</Option>
                    {uniqueFacilities.map(facility => (
                       <Option key={facility} value={facility}>{facility}</Option>
                    ))}
                  </Select>
               </div>
               <div className="flex items-center gap-2 ml-2">
                  <span className="font-medium text-blue-800">Date:</span>
                  <DatePicker 
                    key={logDateFilter || 'cleared'}
                    onChange={(date, dateString) => setLogDateFilter(dateString)}
                    style={{ width: 150 }}
                    allowClear
                  />
               </div>
               {(logFacilityFilter !== 'ALL' || logDateFilter) && (
                 <Button icon={<ClearOutlined />} onClick={() => { setLogFacilityFilter('ALL'); setLogDateFilter(null); }}>Clear</Button>
               )}
               <Text type="secondary" className="self-center text-sm ml-auto">
                 Showing {filteredLogs.length} Check-in Record(s)
               </Text>
             </div>

             <Table 
                columns={logColumns}
                dataSource={filteredLogs}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records` }}
                locale={{
                  emptyText: logFacilityFilter !== 'ALL'
                    ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No check-in records found for ${logFacilityFilter}`}>
                        <Button onClick={() => setLogFacilityFilter('ALL')}>Clear Filter</Button>
                      </Empty>
                    : 'No check-in records have been captured yet'
                }}
              />
          </Tabs.TabPane>

          <Tabs.TabPane tab={<span><BarChartOutlined /> Analytics</span>} key="3">
            <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100 mt-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-purple-800">Date Range:</span>
                <RangePicker 
                  value={analyticsDateRange}
                  onChange={(dates) => setAnalyticsDateRange(dates || [])}
                  allowClear
                />
                <Button type="primary" icon={<BarChartOutlined />} onClick={fetchAnalytics}>
                  Load Analytics
                </Button>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex justify-center py-20">
                <Spin size="large" tip="Loading analytics..." />
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic 
                        title="Total Bookings" 
                        value={analytics.totalBookings || 0} 
                        valueStyle={{ color: '#1677ff', fontSize: 24 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic 
                        title="Approval Rate" 
                        value={analytics.approvalRate?.toFixed(1) || 0} 
                        suffix="%"
                        valueStyle={{ color: '#52c41a', fontSize: 24 }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card title="Status Breakdown" size="small">
                      {analytics.statusBreakdown && Object.keys(analytics.statusBreakdown).length > 0 ? (
                        <Pie
                          data={Object.entries(analytics.statusBreakdown).map(([key, value]) => ({
                            type: key,
                            value: Number(value)
                          }))}
                          angleField="value"
                          colorField="type"
                          radius={0.8}
                          label={{ type: 'outer', content: '{name}: {value}' }}
                          legend={{ position: 'bottom' }}
                          height={250}
                        />
                      ) : (
                        <Empty description="No status data" />
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="Most Booked Facilities" size="small">
                      {analytics.mostBookedResources && Object.keys(analytics.mostBookedResources).length > 0 ? (
                        <Column
                          data={Object.entries(analytics.mostBookedResources).map(([key, value]) => ({
                            facility: key,
                            bookings: Number(value)
                          }))}
                          xField="facility"
                          yField="bookings"
                          color="#1890ff"
                          height={250}
                          label={{ position: 'top' }}
                        />
                      ) : (
                        <Empty description="No facility data" />
                      )}
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card title="Peak Hours" size="small">
                      {analytics.peakHoursHeatmap && Object.keys(analytics.peakHoursHeatmap).length > 0 ? (
                        <Column
                          data={Object.entries(analytics.peakHoursHeatmap).map(([key, value]) => ({
                            hour: `${key}:00`,
                            count: Number(value)
                          }))}
                          xField="hour"
                          yField="count"
                          color="#722ed1"
                          height={250}
                        />
                      ) : (
                        <Empty description="No peak hour data" />
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="Avg Duration by Facility Type (minutes)" size="small">
                      {analytics.avgDurationMinutesByType && Object.keys(analytics.avgDurationMinutesByType).length > 0 ? (
                        <Column
                          data={Object.entries(analytics.avgDurationMinutesByType).map(([key, value]) => ({
                            type: key,
                            minutes: Math.round(Number(value))
                          }))}
                          xField="type"
                          yField="minutes"
                          color="#fa8c16"
                          height={250}
                          label={{ position: 'top', formatter: (v) => `${v.minutes}m` }}
                        />
                      ) : (
                        <Empty description="No duration data" />
                      )}
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <div className="py-20 text-center">
                <BarChartOutlined className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500">Click "Load Analytics" to view booking insights</p>
              </div>
            )}
          </Tabs.TabPane>
        </Tabs>
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

      {/* Edit Booking Modal */}
      <BookingModal
        visible={editModalVisible}
        facility={editingBooking ? { id: editingBooking.facilityId, name: editingBooking.facilityName } : null}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingBooking(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setEditingBooking(null);
          fetchBookings();
        }}
        editingBooking={editingBooking}
      />
    </div>
  );
};

export default BookingsPage;

