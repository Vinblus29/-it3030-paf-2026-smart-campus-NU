import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Tag, Modal, message, Drawer, Descriptions,
  Form, Input, Select, Upload, Space, List, Avatar, Popconfirm,
  Empty, Typography, Row, Col, Statistic
} from 'antd';
import {
  PlusOutlined, EyeOutlined, UploadOutlined, UserOutlined,
  EditOutlined, DeleteOutlined, SendOutlined, SearchOutlined, ClearOutlined
} from '@ant-design/icons';
import ticketService from '../../services/ticketService';
import facilityService from '../../services/facilityService';
import { TICKET_CATEGORIES } from '../../constants/ticketCategories';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const CATEGORIES = Object.keys(TICKET_CATEGORIES);
const STATUS_COLOR = { OPEN: 'blue', IN_PROGRESS: 'processing', RESOLVED: 'success', CLOSED: 'default', REJECTED: 'error' };
const PRIORITY_COLOR = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red', CRITICAL: 'magenta' };

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]); // unfiltered, for stats
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [form] = Form.useForm();

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    facilityService.getAllFacilities()
      .then(data => setFacilities(data))
      .catch(() => {});
  }, []);

  // Initial load and filter changes — debounce only text search
  useEffect(() => {
    if (!searchText) {
      fetchTickets();
      return;
    }
    const timer = setTimeout(() => { fetchTickets(); }, 400);
    return () => clearTimeout(timer);
  }, [searchText, filterStatus, filterCategory, filterPriority]);

  const fetchTickets = async () => {
    try {
      setSearching(true);
      const hasFilters = searchText || filterStatus || filterCategory || filterPriority;
      const data = hasFilters
        ? await ticketService.searchTickets({
            q: searchText || undefined,
            status: filterStatus || undefined,
            category: filterCategory || undefined,
            priority: filterPriority || undefined,
          })
        : await ticketService.getMyTickets();
      setTickets(data);
      // keep unfiltered copy for stats — only update when no filters active
      if (!hasFilters) setAllTickets(data);
    } catch { message.error('Failed to load tickets'); }
    finally { setLoading(false); setSearching(false); }
  };

  const filteredTickets = tickets;
  const hasActiveFilters = searchText || filterStatus || filterCategory || filterPriority;

  const clearFilters = () => {
    setSearchText('');
    setFilterStatus('');
    setFilterCategory('');
    setFilterPriority('');
  };

  const stats = {
    total: allTickets.length,
    open: allTickets.filter(t => t.status === 'OPEN').length,
    inProgress: allTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: allTickets.filter(t => t.status === 'RESOLVED').length,
  };

  const handleView = async (ticket) => {
    setSelected(ticket);
    setDrawerOpen(true);
    try {
      setComments(await ticketService.getComments(ticket.id));
    } catch { message.error('Failed to load comments'); }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
    setComments([]);
    setCommentText('');
    setEditingComment(null);
  };

  const locationOptions = facilities.map(f => ({
    value: f.name + (f.location ? ` — ${f.location}` : ''),
    label: f.name + (f.location ? ` — ${f.location}` : '') + (f.type ? ` (${f.type})` : ''),
  }));

  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      const images = fileList.map(f => f.originFileObj).filter(Boolean);
      await ticketService.createTicket(values, images);
      message.success('Ticket submitted successfully');
      setCreateOpen(false);
      form.resetFields();
      setFileList([]);
      fetchTickets();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to create ticket');
    } finally { setSubmitting(false); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const c = await ticketService.addComment(selected.id, commentText.trim());
      setComments(prev => [...prev, c]);
      setCommentText('');
    } catch { message.error('Failed to add comment'); }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const updated = await ticketService.editComment(selected.id, commentId, editText.trim());
      setComments(prev => prev.map(c => c.id === commentId ? updated : c));
      setEditingComment(null);
    } catch { message.error('Failed to edit comment'); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await ticketService.deleteComment(selected.id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch { message.error('Failed to delete comment'); }
  };

  const columns = [
    {
      title: 'Title', dataIndex: 'title', key: 'title',
      render: (text, r) => (
        <div>
          <div className="font-medium">{text}</div>
          <Text type="secondary" className="text-xs">{r.category} · {r.location}</Text>
        </div>
      )
    },
    {
      title: 'Priority', dataIndex: 'priority', key: 'priority',
      render: p => <Tag color={PRIORITY_COLOR[p]}>{p}</Tag>
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: s => <Tag color={STATUS_COLOR[s]}>{s?.replace('_', ' ')}</Tag>
    },
    {
      title: 'Assigned To', key: 'assignee',
      render: (_, r) => r.assigneeName || <Text type="secondary">Unassigned</Text>
    },
    {
      title: 'Created', dataIndex: 'createdAt', key: 'createdAt',
      render: d => d ? new Date(d).toLocaleDateString() : '-'
    },
    {
      title: '', key: 'actions',
      render: (_, r) => (
        <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(r)}>View</Button>
      )
    }
  ];

  return (
    <div className="space-y-4">

      <Row gutter={12}>
        {[
          { label: 'Total', value: stats.total, color: '#1677ff' },
          { label: 'Open', value: stats.open, color: '#1677ff' },
          { label: 'In Progress', value: stats.inProgress, color: '#fa8c16' },
          { label: 'Resolved', value: stats.resolved, color: '#52c41a' },
        ].map(({ label, value, color }) => (
          <Col xs={12} sm={6} key={label}>
            <Card size="small" style={{ borderTop: `3px solid ${color}` }}>
              <Statistic title={label} value={value} valueStyle={{ color, fontSize: 22 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Tickets</h1>
            <p className="text-gray-500">Report and track your maintenance incidents</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            New Ticket
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <Input
            placeholder="Search title, location, description..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 150 }}>
            <Option value="">All Statuses</Option>
            <Option value="OPEN"><Tag color="blue">OPEN</Tag></Option>
            <Option value="IN_PROGRESS"><Tag color="processing">IN PROGRESS</Tag></Option>
            <Option value="RESOLVED"><Tag color="success">RESOLVED</Tag></Option>
            <Option value="CLOSED"><Tag color="default">CLOSED</Tag></Option>
            <Option value="REJECTED"><Tag color="error">REJECTED</Tag></Option>
          </Select>
          <Select value={filterCategory} onChange={setFilterCategory} style={{ width: 150 }}>
            <Option value="">All Categories</Option>
            {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
          <Select value={filterPriority} onChange={setFilterPriority} style={{ width: 150 }}>
            <Option value="">All Priorities</Option>
            <Option value="LOW"><Tag color="green">LOW</Tag></Option>
            <Option value="MEDIUM"><Tag color="orange">MEDIUM</Tag></Option>
            <Option value="HIGH"><Tag color="red">HIGH</Tag></Option>
            <Option value="CRITICAL"><Tag color="magenta">CRITICAL</Tag></Option>
          </Select>
          {hasActiveFilters && <Button icon={<ClearOutlined />} onClick={clearFilters}>Clear</Button>}
          {hasActiveFilters && (
            <Text type="secondary" className="self-center text-sm">
              {filteredTickets.length} of {tickets.length} tickets
            </Text>
          )}
        </div>

        {tickets.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredTickets}
            rowKey="id"
            loading={loading || searching}
            pagination={{ pageSize: 10, showTotal: total => `${total} tickets` }}
            locale={{
              emptyText: hasActiveFilters
                ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tickets match your filters">
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </Empty>
                : 'No tickets yet'
            }}
          />
        ) : (
          <Empty description="No tickets yet">
            <Button type="primary" onClick={() => setCreateOpen(true)}>Create Your First Ticket</Button>
          </Empty>
        )}
      </Card>

      {/* Create Ticket Modal */}
      <Modal
        title="Report an Incident"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); setFileList([]); }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="Brief title of the incident" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Category is required' }]}>
              <Select placeholder="Select category">
                {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="Priority" rules={[{ required: true, message: 'Priority is required' }]}>
              <Select placeholder="Select priority">
                <Option value="LOW">Low</Option>
                <Option value="MEDIUM">Medium</Option>
                <Option value="HIGH">High</Option>
                <Option value="CRITICAL">Critical</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="location" label="Location / Resource" rules={[{ required: true, message: 'Location is required' }]}>
            <Select
              placeholder="Select a facility or location"
              showSearch
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={locationOptions}
            />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Description is required' }]}>
            <TextArea rows={4} placeholder="Describe the incident in detail" />
          </Form.Item>
          <Form.Item name="contactDetails" label="Preferred Contact Details">
            <Input placeholder="Phone or email for follow-up" />
          </Form.Item>
          <Form.Item label="Evidence Images (max 3)">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => setFileList(fl.slice(0, 3))}
              accept="image/*"
            >
              {fileList.length < 3 && <div><UploadOutlined /><div className="mt-1">Upload</div></div>}
            </Upload>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>Submit Ticket</Button>
              <Button onClick={() => { setCreateOpen(false); form.resetFields(); setFileList([]); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Ticket Detail Drawer — read-only status + comments for users */}
      <Drawer
        title={selected ? `Ticket #${selected.id} — ${selected.title}` : 'Ticket Details'}
        placement="right"
        width={560}
        open={drawerOpen}
        onClose={closeDrawer}
      >
        {selected && (
          <div className="space-y-6">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLOR[selected.status]}>{selected.status?.replace('_', ' ')}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={PRIORITY_COLOR[selected.priority]}>{selected.priority}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
              <Descriptions.Item label="Location">{selected.location}</Descriptions.Item>
              <Descriptions.Item label="Description">{selected.description}</Descriptions.Item>
              <Descriptions.Item label="Contact">{selected.contactDetails || '—'}</Descriptions.Item>
              <Descriptions.Item label="Assigned To">{selected.assigneeName || 'Unassigned'}</Descriptions.Item>
              {selected.resolutionNotes && (
                <Descriptions.Item label="Resolution Notes">{selected.resolutionNotes}</Descriptions.Item>
              )}
              {selected.rejectionReason && (
                <Descriptions.Item label="Rejection Reason">
                  <Text type="danger">{selected.rejectionReason}</Text>
                </Descriptions.Item>
              )}
              {selected.resolvedAt && (
                <Descriptions.Item label="Resolved At">
                  {new Date(selected.resolvedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selected.resolutionTimeHours != null && (
                <Descriptions.Item label="Resolution Time">
                  {selected.resolutionTimeHours < 1
                    ? 'Less than 1 hour'
                    : `${selected.resolutionTimeHours} hour${selected.resolutionTimeHours !== 1 ? 's' : ''}`
                  }
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Submitted">
                {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}
              </Descriptions.Item>
              {selected.imageUrls?.length > 0 && (
                <Descriptions.Item label="Evidence">
                  <div className="flex gap-2 flex-wrap mt-1">
                    {selected.imageUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`evidence-${i}`} className="w-20 h-20 object-cover rounded border" />
                      </a>
                    ))}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Comments — users can add/edit/delete their own */}
            <div>
              <Text strong className="text-base">Comments</Text>
              <List
                className="mt-2"
                dataSource={comments}
                locale={{ emptyText: 'No comments yet' }}
                renderItem={c => (
                  <List.Item
                    actions={[
                      c.canEdit && editingComment !== c.id && (
                        <Button key="edit" type="link" size="small" icon={<EditOutlined />}
                          onClick={() => { setEditingComment(c.id); setEditText(c.content); }}>
                          Edit
                        </Button>
                      ),
                      c.canDelete && (
                        <Popconfirm key="del" title="Delete this comment?" onConfirm={() => handleDeleteComment(c.id)}>
                          <Button type="link" size="small" danger icon={<DeleteOutlined />}>Delete</Button>
                        </Popconfirm>
                      )
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <span className="font-medium">
                          {c.userName}
                          <Text type="secondary" className="text-xs font-normal ml-1">
                            {new Date(c.createdAt).toLocaleString()}{c.updatedAt ? ' (edited)' : ''}
                          </Text>
                        </span>
                      }
                      description={
                        editingComment === c.id ? (
                          <Space.Compact style={{ width: '100%' }}>
                            <Input value={editText} onChange={e => setEditText(e.target.value)} />
                            <Button type="primary" onClick={() => handleEditComment(c.id)}>Save</Button>
                            <Button onClick={() => setEditingComment(null)}>Cancel</Button>
                          </Space.Compact>
                        ) : c.content
                      }
                    />
                  </List.Item>
                )}
              />
              <Space.Compact style={{ width: '100%', marginTop: 8 }}>
                <Input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  onPressEnter={handleAddComment}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleAddComment}>Send</Button>
              </Space.Compact>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
