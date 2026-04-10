import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Card, Tabs, Badge, Form, Input, Select } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const handleCreateUser = async (values) => {
    setCreating(true);
    try {
      await axios.post('/api/admin/users', values);
      message.success('User created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      message.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users/pending');
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.put(`/api/admin/users/${userId}/approve`);
      message.success('User approved successfully');
      fetchUsers();
      fetchPendingUsers();
    } catch (error) {
      message.error('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    Modal.confirm({
      title: 'Reject User',
      content: 'Are you sure you want to reject this user? This action cannot be undone.',
      okText: 'Yes, Reject',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`/api/admin/users/${userId}/reject`);
          message.success('User rejected and removed');
          fetchUsers();
          fetchPendingUsers();
        } catch (error) {
          message.error('Failed to reject user');
        }
      }
    });
  };

  const handleEnable = async (userId) => {
    try {
      await axios.put(`/api/admin/users/${userId}/enable`);
      message.success('User enabled successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to enable user');
    }
  };

  const handleDisable = async (userId) => {
    Modal.confirm({
      title: 'Disable User',
      content: 'Are you sure you want to disable this user? They will not be able to login.',
      okText: 'Yes, Disable',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.put(`/api/admin/users/${userId}/disable`);
          message.success('User disabled successfully');
          fetchUsers();
        } catch (error) {
          message.error('Failed to disable user');
        }
      }
    });
  };

  const handleDelete = async (userId) => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`/api/admin/users/${userId}`);
          message.success('User deleted successfully');
          fetchUsers();
        } catch (error) {
          message.error('Failed to delete user');
        }
      }
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: 'red',
      TECHNICIAN: 'purple',
      USER: 'blue'
    };
    return colors[role] || 'default';
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.profileImageUrl ? (
            <img src={record.profileImageUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {record.firstName?.charAt(0)}{record.lastName?.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-medium">{record.firstName} {record.lastName}</div>
            <div className="text-gray-400 text-sm">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color={getRoleColor(role)}>{role}</Tag>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.enabled ? 'green' : 'orange'}>
          {record.enabled ? 'Active' : 'Disabled'}
        </Tag>
      ),
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
          {record.enabled ? (
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleDisable(record.id)}
            >
              Disable
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleEnable(record.id)}
            >
              Enable
            </Button>
          )}
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const pendingColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.profileImageUrl ? (
            <img src={record.profileImageUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold">
              {record.firstName?.charAt(0)}{record.lastName?.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-medium">{record.firstName} {record.lastName}</div>
            <div className="text-gray-400 text-sm">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phone',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color={getRoleColor(role)}>{role}</Tag>,
    },
    {
      title: 'Registered',
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
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.id)}
            className="bg-green-500 border-green-500 hover:bg-green-600"
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record.id)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const items = [
    {
      key: 'all',
      label: (
        <span>
          All Users <Tag>{users.length}</Tag>
        </span>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'pending',
      label: (
        <span>
          Pending Approval
          {pendingUsers.length > 0 && <Badge count={pendingUsers.length} offset={[10, 0]} />}
        </span>
      ),
      children: (
        pendingUsers.length > 0 ? (
          <Table
            columns={pendingColumns}
            dataSource={pendingUsers}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <div className="text-center py-12 text-gray-400">
            <UserOutlined className="text-4xl mb-4" />
            <p>No pending users awaiting approval</p>
          </div>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-500">Manage user accounts and approvals</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Add Technician
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => { fetchUsers(); fetchPendingUsers(); }}
            >
              Refresh
            </Button>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
        />
      </Card>

      <Modal
        title="Add New User (Technician/Admin)"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={creating}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="John" />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="Doe" />
            </Form.Item>
          </div>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
            <Input placeholder="john.doe@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6, message: 'Min 6 chars expected' }]}>
            <Input.Password placeholder="Enter initial password" />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="+1234567890" />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="TECHNICIAN" rules={[{ required: true, message: 'Required' }]}>
            <Select>
              <Select.Option value="TECHNICIAN">Technician</Select.Option>
              <Select.Option value="ADMIN">Admin</Select.Option>
              <Select.Option value="USER">User</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;

