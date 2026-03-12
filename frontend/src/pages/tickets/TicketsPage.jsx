import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Card, Select, Drawer, Descriptions, Tabs, Image } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import ticketService from '../../services/ticketService';
import { getCategoryOptions, getCategoryDisplay } from '../../constants/ticketCategories';

const { Option } = Select;

const TicketsPage = () => {
  const { isAdmin, isTechnician } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      let data;
      if (filter === 'ALL') {
        data = await ticketService.getAllTickets();
      } else if (['ELECTRICAL', 'PLUMBING', 'NETWORK', 'EQUIPMENT', 'CLEANING', 'SECURITY', 'HVAC', 'FURNITURE', 'LIGHTING', 'OTHER'].includes(filter)) {
        // Check if filter is a category
        data = await ticketService.getTicketsByCategory(filter);
      } else {
        data = await ticketService.getTicketsByStatus(filter);
      }
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      message.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await ticketService.updateTicketStatus(id, status);
      message.success('Ticket status updated successfully');
      fetchTickets();
    } catch (error) {
      message.error('Failed to update ticket status');
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
      filters: [
        { text: 'High', value: 'HIGH' },
        { text: 'Medium', value: 'MEDIUM' },
        { text: 'Low', value: 'LOW' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Created By',
      key: 'user',
      render: (_, record) => record.user?.firstName + ' ' + record.user?.lastName || record.reportedBy || 'N/A',
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
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {(isAdmin || isTechnician) && (
            <Select
              value={record.status}
              onChange={(value) => handleUpdateStatus(record.id, value)}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="OPEN">Open</Option>
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="RESOLVED">Resolved</Option>
              <Option value="CLOSED">Closed</Option>
            </Select>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'ALL',
      label: 'All Tickets',
      children: (
        <Table 
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'OPEN',
      label: (
        <span>Open <Tag>{tickets.filter(t => t.status === 'OPEN').length}</Tag></span>
      ),
      children: (
        <Table 
          columns={columns}
          dataSource={tickets.filter(t => t.status === 'OPEN')}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'IN_PROGRESS',
      label: (
        <span>In Progress <Tag color="processing">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</Tag></span>
      ),
      children: (
        <Table 
          columns={columns}
          dataSource={tickets.filter(t => t.status === 'IN_PROGRESS')}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'RESOLVED',
      label: (
        <span>Resolved <Tag color="success">{tickets.filter(t => t.status === 'RESOLVED').length}</Tag></span>
      ),
      children: (
        <Table 
          columns={columns}
          dataSource={tickets.filter(t => t.status === 'RESOLVED')}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    // Category tabs
    ...getCategoryOptions().slice(0, 5).map(category => ({
      key: category.value,
      label: (
        <span>{category.icon} {category.label} <Tag color={category.color}>{tickets.filter(t => t.category === category.value).length}</Tag></span>
      ),
      children: (
        <Table 
          columns={columns}
          dataSource={tickets.filter(t => t.category === category.value)}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    })),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tickets Management</h1>
            <p className="text-gray-500">Manage support tickets</p>
          </div>
        </div>

        <Tabs 
          activeKey={filter} 
          onChange={setFilter}
          items={tabItems}
        />
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
            <Descriptions.Item label="Created By">
              {selectedTicket.user?.firstName} {selectedTicket.user?.lastName || selectedTicket.reportedBy}
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
    </div>
  );
};

export default TicketsPage;

