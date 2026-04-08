import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, message, Row, Col, Input, Select, InputNumber } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EyeOutlined, CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import facilityService from '../../services/facilityService'; 
import BookingModal from '../../components/BookingModal';
import FacilityModal from '../../components/FacilityModal';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;
const { confirm } = Modal;

const FacilitiesPage = () => {
  const { isAdmin } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filters
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCapacity, setFilterCapacity] = useState(null);

  const [selectedFacility, setSelectedFacility] = useState(null);
  
  // Modals visibility
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [facilityModalVisible, setFacilityModalVisible] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);

  useEffect(() => {
    fetchFacilities();
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

  const getAvailabilityColor = (available) => {
    return available ? 'green' : 'red';
  };

  const handleView = (facility) => {
    setSelectedFacility(facility);
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {record.name?.charAt(0)}
          </div>
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-gray-400 text-sm">{record.location}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type || 'General'}</Tag>,
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => capacity || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Tag color={getAvailabilityColor(available)}>
          {available ? 'Active / Available' : 'Out of Service'}
        </Tag>
      ),
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
          <Button 
            type="primary"
            icon={<CalendarOutlined />} 
            size="small"
            disabled={!record.available}
            onClick={() => handleBook(record)}
          >
            Book
          </Button>
          {isAdmin && (
            <>
              <Button 
                icon={<EditOutlined />} 
                size="small"
                onClick={() => handleEdit(record)}
              />
              <Button 
                danger
                icon={<DeleteOutlined />} 
                size="small"
                onClick={() => handleDelete(record.id)}
              />
            </>
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
            <h1 className="text-2xl font-bold text-gray-800">Facilities</h1>
            <p className="text-gray-500">View and manage campus facilities</p>
          </div>
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Facility
            </Button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            placeholder="Search by name or location..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          
          <Select 
            value={filterType} 
            onChange={(val) => setFilterType(val)} 
            style={{ width: 150 }}
          >
            <Option value="ALL">All Types</Option>
            <Option value="LAB">Laboratory</Option>
            <Option value="LECTURE_HALL">Lecture Hall</Option>
            <Option value="MEETING_ROOM">Meeting Room</Option>
            <Option value="CLASSROOM">Classroom</Option>
            <Option value="EQUIPMENT">Equipment</Option>
            <Option value="PC_ROOM">PC Room</Option>
            <Option value="SPORTS_GROUND">Sports Ground</Option>
          </Select>

          <InputNumber
            placeholder="Min Capacity"
            value={filterCapacity}
            onChange={(val) => setFilterCapacity(val)}
            min={1}
            style={{ width: 130 }}
          />
        </div>

        <Table 
          columns={columns}
          dataSource={filteredFacilities}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* View Facility Modal */}
      <Modal
        title="Facility Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          selectedFacility?.available && (
            <Button 
              key="book" 
              type="primary" 
              onClick={() => {
                setViewModalVisible(false);
                handleBook(selectedFacility);
              }}
            >
              Book Now
            </Button>
          )
        ]}
      >
        {selectedFacility && (
          <div className="space-y-4">
            <div>
              <label className="text-gray-500">Name:</label>
              <p className="font-medium text-lg">{selectedFacility.name}</p>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <label className="text-gray-500">Type:</label>
                <p className="font-medium">{selectedFacility.type || 'General'}</p>
              </Col>
              <Col span={12}>
                <label className="text-gray-500">Capacity:</label>
                <p className="font-medium">{selectedFacility.capacity || 'N/A'}</p>
              </Col>
            </Row>
            <div>
              <label className="text-gray-500">Location:</label>
              <p className="font-medium">{selectedFacility.location || 'N/A'}</p>
            </div>
            <div>
              <label className="text-gray-500">Status:</label>
              <p>
                <Tag color={getAvailabilityColor(selectedFacility.available)}>
                  {selectedFacility.available ? 'Active / Available' : 'Out of Service'}
                </Tag>
              </p>
            </div>
            {selectedFacility.equipment && (
              <div>
                <label className="text-gray-500">Equipment:</label>
                <p className="font-medium">{selectedFacility.equipment}</p>
              </div>
            )}
            {selectedFacility.availabilityWindows && (
              <div>
                <label className="text-gray-500">Availability Windows:</label>
                <p className="font-medium">{selectedFacility.availabilityWindows}</p>
              </div>
            )}
            <div>
              <label className="text-gray-500">Description:</label>
              <p className="font-medium">{selectedFacility.description || 'No description'}</p>
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
        }}
      />
    </div>
  );
};

export default FacilitiesPage;
