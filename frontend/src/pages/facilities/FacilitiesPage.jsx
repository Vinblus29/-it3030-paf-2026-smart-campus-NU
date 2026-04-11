import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, message, Row, Col, Input, Select, InputNumber, List, Typography, Badge, Tooltip, Divider, DatePicker, Form, Empty } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined,
  BarsOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import facilityService from '../../services/facilityService';
import BookingModal from '../../components/BookingModal';
import FacilityModal from '../../components/FacilityModal';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;
const { Title, Text, Paragraph } = Typography;

const FacilitiesPage = () => {
  const { isAdmin } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Search and Filters
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCapacity, setFilterCapacity] = useState(null);
  const [facilityTypes, setFacilityTypes] = useState([]);

  const [selectedFacility, setSelectedFacility] = useState(null);

  // Modals visibility
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [facilityModalVisible, setFacilityModalVisible] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);

  // Blackout Period Management
  const [blackoutModalVisible, setBlackoutModalVisible] = useState(false);
  const [blackoutPeriods, setBlackoutPeriods] = useState([]);
  const [blackoutForm] = Form.useForm();
  const [blackoutLoading, setBlackoutLoading] = useState(false);

  useEffect(() => {
    fetchFacilities();
    fetchFacilityTypes();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const data = await facilityService.getAllFacilities();
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      message.error('Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilityTypes = async () => {
    try {
      const types = await facilityService.getFacilityTypes();
      setFacilityTypes(types);
    } catch (error) {
      console.error('Error fetching facility types:', error);
    }
  };

  const fetchBlackoutPeriods = async (facilityId) => {
    try {
      const data = await facilityService.getBlackoutPeriodsByFacility(facilityId);
      setBlackoutPeriods(data);
    } catch (error) {
      console.error('Error fetching blackout periods:', error);
    }
  };

  const handleCreateBlackoutPeriod = async (values) => {
    try {
      setBlackoutLoading(true);
      const payload = {
        startTime: values.range[0].format('YYYY-MM-DDTHH:mm:ss'),
        endTime: values.range[1].format('YYYY-MM-DDTHH:mm:ss'),
        reason: values.reason
      };
      await facilityService.createBlackoutPeriod(selectedFacility.id, payload);
      message.success('Blackout period created successfully');
      setBlackoutModalVisible(false);
      blackoutForm.resetFields();
      fetchBlackoutPeriods(selectedFacility.id);
    } catch (error) {
      console.error('Error creating blackout period:', error);
      message.error('Failed to create blackout period');
    } finally {
      setBlackoutLoading(false);
    }
  };

  const handleDeleteBlackoutPeriod = (blackoutId) => {
    confirm({
      title: 'Delete this blackout period?',
      icon: <ExclamationCircleOutlined />,
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await facilityService.deleteBlackoutPeriod(blackoutId);
          message.success('Blackout period deleted');
          fetchBlackoutPeriods(selectedFacility.id);
        } catch (error) {
          message.error('Failed to delete blackout period');
        }
      }
    });
  };

  const handleView = (facility) => {
    setSelectedFacility(facility);
    if (isAdmin) {
      fetchBlackoutPeriods(facility.id);
    }
    setViewModalVisible(true);
  };

  const handleBook = (facility) => {
    setSelectedFacility(facility);
    setBookingModalVisible(true);
  };

  const handleAdd = () => {
    setEditingFacility(null);
    setFacilityModalVisible(true);
  };

  const handleEdit = (facility) => {
    setEditingFacility(facility);
    setFacilityModalVisible(true);
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Are you sure you want to delete this facility?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await facilityService.deleteFacility(id);
          message.success('Facility deleted successfully');
          fetchFacilities();
        } catch (error) {
          console.error('Error deleting facility:', error);
          message.error('Failed to delete facility');
        }
      },
    });
  };

  // Searching and Filtering Logic
  const filteredFacilities = facilities.filter(facility => {
    const matchSearch = facility.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      facility.location?.toLowerCase().includes(searchText.toLowerCase());

    const matchType = filterType === 'ALL' || facility.type === filterType;

    const matchCapacity = !filterCapacity || (facility.capacity && facility.capacity >= filterCapacity);

    return matchSearch && matchType && matchCapacity;
  });

  const columns = [
    {
      title: 'Facility',
      key: 'facility',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.imageUrl ? (
            <img src={record.imageUrl} alt={record.name} className="w-12 h-12 rounded-lg object-cover shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {record.name?.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-800">{record.name}</div>
            <div className="text-gray-400 text-xs flex items-center gap-1">
              <EnvironmentOutlined /> {record.location}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue" className="rounded-full px-3">{type || 'General'}</Tag>,
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      className: 'text-center',
      render: (capacity) => <span className="font-medium">{capacity || 'N/A'}</span>,
    },
    {
      title: 'Health',
      dataIndex: 'healthScore',
      key: 'healthScore',
      render: (health) => (
        <Tag 
          color={health === 'EXCELLENT' ? 'success' : health === 'GOOD' ? 'blue' : 'warning'} 
          icon={health === 'EXCELLENT' ? <CheckCircleOutlined /> : null}
          className="font-bold border-none px-3 py-1 rounded-full m-0"
        >
          {health || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Badge status={available ? 'success' : 'error'} text={available ? 'Active' : 'Out of Service'} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {!isAdmin && (
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              disabled={!record.available}
              onClick={() => handleBook(record)}
              className="rounded-md"
            >
              Book
            </Button>
          )}
          {isAdmin && (
            <>
              <Tooltip title="Edit">
                <Button
                  shape="circle"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  danger
                  shape="circle"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.id)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];



  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">Campus Facilities</Title>
          <Text type="secondary" className="text-lg">Discover and reserve spaces across the smart campus</Text>
        </div>
        <Space>
          {isAdmin && (
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="shadow-md hover:shadow-lg transition-all duration-300 rounded-lg bg-indigo-600 border-none h-12 px-6"
            >
              Add New Facility
            </Button>
          )}
        </Space>
      </div>

      {/* Control Bar: Filters & View Switcher */}
      <Card className="shadow-sm border-none rounded-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Input
              placeholder="Search by name or location..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-11 rounded-lg w-full md:w-64"
              allowClear
            />

            <Select
              value={filterType}
              onChange={(val) => setFilterType(val)}
              className="h-11 w-full md:w-44"
              placeholder="Select Type"
            >
              <Option value="ALL">All Categories</Option>
              {facilityTypes.map(type => (
                <Option key={type} value={type}>
                  {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </Option>
              ))}
            </Select>

            <InputNumber
              placeholder="Min Capacity"
              value={filterCapacity}
              onChange={(val) => setFilterCapacity(val)}
              min={1}
              className="h-11 w-full md:w-32 rounded-lg"
              prefix={<UsergroupAddOutlined className="text-gray-400 mr-2" />}
            />
          </div>

          <div className="bg-gray-100 p-1 rounded-lg flex items-center self-end md:self-auto">
            <Button
              type={viewMode === 'grid' ? 'primary' : 'text'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'shadow-sm rounded-md h-9' : 'text-gray-500 h-9'}
            >
              Grid
            </Button>
            <Button
              type={viewMode === 'list' ? 'primary' : 'text'}
              icon={<BarsOutlined />}
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'shadow-sm rounded-md h-9' : 'text-gray-500 h-9'}
            >
              List
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content: Grid or List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-pulse text-indigo-500 text-xl font-medium">Loading Facilities...</div>
        </div>
      ) : viewMode === 'grid' ? (
        <List
          grid={{
            gutter: 24,
            xs: 1,
            sm: 2,
            md: 2,
            lg: 3,
            xl: 3,
            xxl: 4
          }}
          dataSource={filteredFacilities}
          pagination={{ pageSize: 12, className: 'mt-8 text-center' }}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                className="group overflow-hidden rounded-2xl border-none shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full bg-white relative"
                cover={
                  <div className="h-56 relative overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        alt={item.name}
                        src={item.imageUrl}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-indigo-50 flex flex-col items-center justify-center text-indigo-300">
                        <Title level={1} className="!text-indigo-100 mb-0">{item.name?.charAt(0)}</Title>
                        <EnvironmentOutlined style={{ fontSize: '24px' }} />
                      </div>
                    )}
                    <Badge
                      color={item.available ? '#52c41a' : '#f5222d'}
                      text={item.available ? 'Active' : 'Offline'}
                      className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full shadow-sm font-semibold backdrop-blur-sm"
                    />
                    <Tag
                      color="indigo"
                      className="absolute bottom-4 left-4 rounded-lg bg-indigo-600/80 text-white border-none backdrop-blur-md px-3 py-1"
                    >
                      {item.type?.replace('_', ' ') || 'GENERAL'}
                    </Tag>
                  </div>
                }
                actions={[
                  <Tooltip title="Details" key="view">
                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(item)}>Info</Button>
                  </Tooltip>,
                  !isAdmin ? (
                    <Button
                      key="book"
                      type="primary"
                      icon={<CalendarOutlined />}
                      disabled={!item.available}
                      onClick={() => handleBook(item)}
                      className="rounded-md border-none bg-indigo-600"
                    >
                      Book
                    </Button>
                  ) : (
                    <Space key="admin" className="w-full justify-center px-4">
                      <Button icon={<EditOutlined />} onClick={() => handleEdit(item)}>Edit</Button>
                      <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
                    </Space>
                  )
                ]}
              >
                <Card.Meta
                  title={
                    <div className="flex justify-between items-start">
                      <span className="text-xl font-bold text-gray-800 line-clamp-1 truncate block">{item.name}</span>
                    </div>
                  }
                  description={
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center text-gray-500 gap-2">
                        <EnvironmentOutlined className="text-indigo-400" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <Divider className="my-2" />
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex flex-col items-center flex-1 border-r border-gray-200">
                          <Text type="secondary" className="text-[10px] uppercase tracking-wider font-bold mb-1">Capacity</Text>
                          <Text className="text-gray-800 font-bold">{item.capacity || 'N/A'}</Text>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                          <Text type="secondary" className="text-[10px] uppercase tracking-wider font-bold mb-1">Health Rate</Text>
                          <Tag 
                            color={item.healthScore === 'EXCELLENT' ? 'success' : item.healthScore === 'GOOD' ? 'blue' : 'warning'} 
                            icon={item.healthScore === 'EXCELLENT' ? <CheckCircleOutlined /> : null}
                            className="font-bold border-none px-3 py-1 rounded-full m-0 text-[10px]"
                          >
                            {item.healthScore || 'N/A'}
                          </Tag>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                          <Text type="secondary" className="text-[11px] font-medium">Resource Utilization</Text>
                          <Text className="text-[11px] font-bold text-indigo-600">{item.utilizationPercentage?.toFixed(1) || 0}%</Text>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${item.utilizationPercentage > 80 ? 'bg-emerald-500' :
                                item.utilizationPercentage > 40 ? 'bg-indigo-500' : 'bg-amber-500'
                              }`}
                            style={{ width: `${Math.min(item.utilizationPercentage || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Card className="shadow-sm border-none rounded-xl overflow-hidden p-0">
          <Table
            columns={columns}
            dataSource={filteredFacilities}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 12 }}
            className="modern-table"
          />
        </Card>
      )}

      {/* Large View Facility Modal */}
      <Modal
        title={null}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={1000}
        centered
        className="facility-details-modal overflow-hidden rounded-2xl"
        styles={{ body: { padding: 0 } }}
      >
        {selectedFacility && (
          <div className="flex flex-col lg:flex-row h-full min-h-[500px]">
            {/* Left side: Hero Image */}
            <div className="w-full lg:w-1/2 relative bg-gray-100 min-h-[300px]">
              {selectedFacility.imageUrl ? (
                <img
                  src={selectedFacility.imageUrl}
                  alt={selectedFacility.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-800 text-white">
                  <EnvironmentOutlined style={{ fontSize: '64px' }} className="mb-4 opacity-50" />
                  <Title level={2} className="!text-white mb-0">{selectedFacility.name}</Title>
                  <Text className="text-indigo-100">Smart Campus Facility</Text>
                </div>
              )}
              <div className="absolute top-6 left-6">
                <Badge
                  count={selectedFacility.available ? 'Active' : 'Offline'}
                  style={{ backgroundColor: selectedFacility.available ? '#52c41a' : '#f5222d', padding: '0 15px', height: '30px', lineHeight: '30px', borderRadius: '15px', fontWeight: 'bold' }}
                />
              </div>

            </div>

            {/* Right side: Information */}
            <div className="w-full lg:w-1/2 p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-start mb-2">
                <Tag color="indigo" className="px-4 py-1 rounded-full font-bold uppercase tracking-wider">{selectedFacility.type?.replace('_', ' ') || 'General'}</Tag>
                <div className="flex items-center">
                  <Tag 
                    color={selectedFacility.healthScore === 'EXCELLENT' || !selectedFacility.healthScore ? 'success' : 'processing'} 
                    icon={selectedFacility.healthScore === 'EXCELLENT' || !selectedFacility.healthScore ? <CheckCircleOutlined /> : null}
                    className="font-bold border-none px-3 py-1 rounded-full m-0"
                  >
                    {selectedFacility.healthScore || 'EXCELLENT'}
                  </Tag>
                </div>
              </div>

              <Title level={1} className="!mt-0 !mb-4 text-3xl font-extrabold text-gray-900">{selectedFacility.name}</Title>

              <div className="flex flex-col mb-8">
                <div className="flex items-center text-gray-500 text-lg">
                  <EnvironmentOutlined className="mr-2 text-indigo-500" />
                  <span>{selectedFacility.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center text-gray-400 text-xs mt-2 ml-1">
                  <CalendarOutlined className="mr-1 text-[10px]" />
                  <span>⏱ Last Updated: Today</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center">
                  <div className="bg-indigo-600 text-white p-3 rounded-xl mr-4">
                    <UsergroupAddOutlined style={{ fontSize: '20px' }} />
                  </div>
                  <div>
                    <div className="text-xs text-indigo-400 font-bold uppercase">Max Capacity</div>
                    <div className="text-xl font-bold text-gray-800">{selectedFacility.capacity || 'N/A'}</div>
                  </div>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center">
                  <div className="bg-emerald-600 text-white p-3 rounded-xl mr-4">
                    <DashboardOutlined style={{ fontSize: '20px' }} />
                  </div>
                  <div>
                    <div className="text-xs text-emerald-400 font-bold uppercase">Utilization</div>
                    <div className="text-xl font-bold text-gray-800">{selectedFacility.utilizationPercentage?.toFixed(1) || 0}%</div>
                    <div className="text-[10px] font-bold mt-1 uppercase tracking-tighter">
                      {selectedFacility.utilizationPercentage <= 30 || !selectedFacility.utilizationPercentage ? (
                        <span className="text-amber-500">Low Usage ⚠️</span>
                      ) : selectedFacility.utilizationPercentage <= 70 ? (
                        <span className="text-blue-500">Medium Usage</span>
                      ) : (
                        <span className="text-emerald-500">High Usage</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Recommendation Box */}
              {(selectedFacility.utilizationPercentage <= 30 || !selectedFacility.utilizationPercentage) && (
                <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-white p-2 rounded-lg">
                      <CheckCircleOutlined />
                    </div>
                    <div>
                      <div className="text-emerald-700 font-bold text-sm">Recommended Now ✅</div>
                      <div className="text-emerald-600 text-xs">Low usage – Available for booking</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <Title level={4} className="!mb-3">Overview</Title>
                <Paragraph className="text-gray-600 text-base leading-relaxed">
                  {selectedFacility.description || "This facility is fully equipped with modern infrastructure to support student learning and collaboration across the campus. It features high-speed Wi-Fi, modern seating, and advanced presentation systems."}
                </Paragraph>
              </div>

              {selectedFacility.tags && selectedFacility.tags.length > 0 && (
                <div className="mb-8">
                  <Title level={4} className="!mb-3">Amenities</Title>
                  <div className="flex flex-wrap gap-2">
                    {selectedFacility.tags.map(tag => (
                      <Tag key={tag} className="flex items-center px-4 py-1.5 rounded-xl bg-white border-gray-200 text-gray-700 font-medium hover:border-indigo-500 transition-colors">
                        <CheckCircleOutlined className="mr-2 text-emerald-500" /> {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {selectedFacility.equipment && (
                <div className="mb-8 bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
                  <div className="flex items-center mb-2">
                    <InfoCircleOutlined className="text-indigo-500 mr-2" />
                    <Title level={5} className="!mb-0">Key Equipment</Title>
                  </div>
                  <Text className="text-gray-600 italic">"{selectedFacility.equipment}"</Text>
                </div>
              )}

              {/* Blackout Periods Section (Admin Only) */}
              {isAdmin && (
                <div className="mb-6">
                  <Divider className="my-6" />
                  <div className="flex justify-between items-center mb-4">
                    <Title level={5} className="!mb-0 flex items-center gap-2">
                      <LockOutlined className="text-red-500" />
                      Blackout Periods
                    </Title>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<PlusOutlined />}
                      onClick={() => setBlackoutModalVisible(true)}
                      className="bg-red-500 border-red-500"
                    >
                      Add Blackout
                    </Button>
                  </div>
                  
                  {blackoutPeriods.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {blackoutPeriods.map(bp => {
                        const startDate = new Date(bp.startTime);
                        const endDate = new Date(bp.endTime);
                        return (
                        <div key={bp.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg">
                          <div>
                            <div className="font-medium text-red-800">
                              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-red-600">
                              {startDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})} - 
                              {endDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            {bp.reason && <div className="text-xs text-gray-500 mt-1">{bp.reason}</div>}
                          </div>
                          <Button 
                            danger 
                            size="small" 
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteBlackoutPeriod(bp.id)}
                          />
                        </div>
                      )})}
                    </div>
                  ) : (
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      description="No blackout periods scheduled"
                      className="bg-gray-50 p-4 rounded-lg"
                    />
                  )}
                </div>
              )}

              <Divider className="my-8" />

              <div className="flex gap-4">
                <Button
                  block
                  size="large"
                  onClick={() => setViewModalVisible(false)}
                  className="h-14 rounded-2xl font-bold"
                >
                  Close
                </Button>
                {!isAdmin && selectedFacility?.available && (
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<CalendarOutlined />}
                    onClick={() => {
                      setViewModalVisible(false);
                      handleBook(selectedFacility);
                    }}
                    className="h-14 rounded-2xl font-bold bg-indigo-600 border-none shadow-lg shadow-indigo-100"
                  >
                    Reserve Now
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setViewModalVisible(false);
                      handleEdit(selectedFacility);
                    }}
                    className="h-14 rounded-2xl font-bold bg-gray-800 border-none"
                  >
                    Edit Records
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>



      {/* Booking Modal */}
      <BookingModal
        visible={bookingModalVisible}
        facility={selectedFacility}
        onCancel={() => setBookingModalVisible(false)}
        onSuccess={() => {
          setBookingModalVisible(false);
          fetchFacilities();
        }}
      />

      {/* Add/Edit Facility Modal */}
      <FacilityModal
        visible={facilityModalVisible}
        facility={editingFacility}
        onCancel={() => setFacilityModalVisible(false)}
        onSuccess={() => {
          setFacilityModalVisible(false);
          fetchFacilities();
          fetchFacilityTypes(); // Refresh types after add/edit
        }}
      />

      {/* Blackout Period Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <LockOutlined className="text-red-500" />
            <span>Add Blackout Period</span>
          </div>
        }
        open={blackoutModalVisible}
        onCancel={() => {
          setBlackoutModalVisible(false);
          blackoutForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={blackoutForm}
          layout="vertical"
          onFinish={handleCreateBlackoutPeriod}
        >
          <Form.Item
            name="range"
            label="Blackout Time Range"
            rules={[{ required: true, message: 'Please select blackout period' }]}
          >
            <DatePicker.RangePicker
              showTime={{
                format: 'hh:mm A',
                use12Hours: true,
              }}
              format="YYYY-MM-DD hh:mm A"
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <Input.TextArea rows={3} placeholder="e.g., Maintenance, Exam period, Event preparation..." />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => {
              setBlackoutModalVisible(false);
              blackoutForm.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={blackoutLoading} className="bg-red-500 border-red-500">
              Create Blackout
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FacilitiesPage;
