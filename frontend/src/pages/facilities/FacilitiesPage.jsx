import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, message, Row, Col, Input } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import facilityService from '../../services/facilityService'; 
import BookingModal from '../../components/BookingModal'; // Import the new component 

const FacilitiesPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false); // Add state for booking modal

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
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

  const filteredFacilities = facilities.filter(facility => 
    facility.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    facility.location?.toLowerCase().includes(searchText.toLowerCase())
  );

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
      title: 'Available',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Tag color={getAvailabilityColor(available)}>
          {available ? 'Available' : 'Not Available'}
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
            Book Now
          </Button>
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
            <p className="text-gray-500">View and book campus facilities</p>
          </div>
          <Input
            placeholder="Search facilities..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
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
              <label className="text-gray-500">Availability:</label>
              <p>
                <Tag color={getAvailabilityColor(selectedFacility.available)}>
                  {selectedFacility.available ? 'Available' : 'Not Available'}
                </Tag>
              </p>
            </div>
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
          fetchFacilities(); // Refresh facility list or message.success is already in child
        }}
      />
    </div>
  );
};

export default FacilitiesPage;

