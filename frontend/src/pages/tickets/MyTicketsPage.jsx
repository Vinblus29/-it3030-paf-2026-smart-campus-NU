import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Modal, message, Empty, Drawer, Descriptions, Form, Input, Select, Image } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import ticketService from '../../services/ticketService';
import ImageUpload from '../../components/ImageUpload';
import { getCategoryOptions, getCategoryDisplay } from '../../constants/ticketCategories';

const { Option } = Select;
const { TextArea } = Input;

const MyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await ticketService.getMyTickets();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      message.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (values) => {
    setSubmitting(true);
    try {
      // Convert uploaded images to URLs for backend
      const imageAttachments = values.imageAttachments?.map(img => img.url) || [];
      
      const ticketData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        category: values.category,
        location: values.location,
        imageAttachments
      };

      await ticketService.createTicket(ticketData);
      message.success('Ticket created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      message.error('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'blue',
      IN_PROGRESS: 'processing',
      RESOLVED: 'success',
      CLOSED: 'default'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      HIGH: 'red',
      MEDIUM: 'orange',
      LOW: 'blue'
    };
    return colors[priority] || 'default';
  };

  const handleView = (ticket) => {
    setSelectedTicket(ticket);
    setDrawerVisible(true);
  };

  const columns = [
    {
      title: 'Ticket',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-400 text-sm">{record.description?.substring(0, 50)}...</div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const config = getCategoryDisplay(category);
        return (
          <Tag color={config.color}>
            {config.icon} {config.label}
          </Tag>
        );
      },
      filters: getCategoryOptions().map(option => ({
        text: option.label,
        value: option.value
      })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
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
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Tickets</h1>
            <p className="text-gray-500">View and create support tickets</p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            New Ticket
          </Button>
        </div>

        {tickets.length > 0 ? (
          <Table 
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty 
            description="You haven't created any tickets yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => setCreateModalVisible(true)}>
              Create Ticket
            </Button>
          </Empty>
        )}
      </Card>

      {/* Ticket Details Drawer */}
      <Drawer
        title="Ticket Details"
        placement="right"
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedTicket && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Title">{selectedTicket.title}</Descriptions.Item>
            <Descriptions.Item label="Description">{selectedTicket.description}</Descriptions.Item>
            <Descriptions.Item label="Location">{selectedTicket.location || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Category">
              {(() => {
                const config = getCategoryDisplay(selectedTicket.category);
                return (
                  <Tag color={config.color}>
                    {config.icon} {config.label}
                  </Tag>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Tag>
            </Descriptions.Item>
            
            {/* Image Attachments */}
            {selectedTicket.imageAttachments && selectedTicket.imageAttachments.length > 0 && (
              <Descriptions.Item label="Images">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedTicket.imageAttachments.map((image, index) => (
                    <Image
                      key={index}
                      width={80}
                      height={80}
                      src={image}
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                  ))}
                </div>
              </Descriptions.Item>
            )}
            
            <Descriptions.Item label="Created At">
              {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'N/A'}
            </Descriptions.Item>
            {selectedTicket.updatedAt && (
              <Descriptions.Item label="Updated At">
                {new Date(selectedTicket.updatedAt).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>

      {/* Create Ticket Modal */}
      <Modal
        title="Create New Ticket"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTicket}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter ticket title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <TextArea rows={4} placeholder="Describe your issue" />
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please enter a location' }]}
          >
            <Input placeholder="Where is the issue located?" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              {getCategoryOptions().map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select placeholder="Select priority">
              <Option value="LOW">Low</Option>
              <Option value="MEDIUM">Medium</Option>
              <Option value="HIGH">High</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="imageAttachments"
            label="Images (Optional)"
          >
            <ImageUpload 
              maxCount={3}
              maxSize={5 * 1024 * 1024} // 5MB
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Create Ticket
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyTicketsPage;

