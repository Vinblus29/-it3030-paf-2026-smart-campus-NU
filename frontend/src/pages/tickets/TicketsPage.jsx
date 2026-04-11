import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Tag, Modal, message, Drawer, Descriptions,
  Select, Space, Tabs, Form, Input, List, Avatar, Popconfirm, Typography, Image
} from 'antd';
import { EyeOutlined, UserOutlined, EditOutlined, DeleteOutlined, SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import ticketService from '../../services/ticketService';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const STATUS_COLOR = { OPEN: 'blue', IN_PROGRESS: 'processing', RESOLVED: 'success', CLOSED: 'default', REJECTED: 'error' };
const PRIORITY_COLOR = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red', CRITICAL: 'magenta' };

// Statuses admin can set
const ADMIN_WORKFLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

export default function TicketsPage() {
  const { isAdmin, isTechnician } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  // Admin status modal state
  const [statusModal, setStatusModal] = useState(false);
  const [statusForm] = Form.useForm();

  // Technician status update modal state
  const [techModal, setTechModal] = useState(false);
  const [techForm] = Form.useForm();
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchTickets();
    if (isAdmin) ticketService.getTechnicians().then(setTechnicians).catch(() => {});
  }, [isAdmin]);

  const fetchTickets = async () => {
    try {
      // Technician fetches only their assigned tickets; Admin fetches all
      const data = isTechnician && !isAdmin
        ? await ticketService.getAssignedTickets()
        : await ticketService.getAllTickets();
      setTickets(data);
    } catch { message.error('Failed to load tickets'); }
    finally { setLoading(false); }
  };

  const fetchComments = async (ticketId) => {
    try { setComments(await ticketService.getComments(ticketId)); }
    catch { message.error('Failed to load comments'); }
  };

  const handleView = async (ticket) => {
    setSelected(ticket);
    setDrawerOpen(true);
    await fetchComments(ticket.id);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
    setComments([]);
    setCommentText('');
    setEditingComment(null);
  };

  // Admin: full status update
  const handleStatusUpdate = async (values) => {
    try {
      await ticketService.updateStatus(selected.id, values);
      message.success('Status updated');
      setStatusModal(false);
      statusForm.resetFields();
      const updated = await ticketService.getTicketById(selected.id);
      setSelected(updated);
      fetchTickets();
    } catch { message.error('Failed to update status'); }
  };

  // Admin: assign ticket to technician
  const handleAssign = async (assigneeId) => {
    try {
      const updated = await ticketService.assignTicket(selected.id, assigneeId);
      setSelected(updated);
      fetchTickets();
      message.success('Ticket assigned to technician');
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to assign ticket');
    }
  };

  // Technician: update status (IN_PROGRESS or RESOLVED)
  const handleTechStatusUpdate = async (values) => {
    try {
      await ticketService.updateStatus(selected.id, values);
      message.success(
        values.status === 'RESOLVED'
          ? 'Ticket resolved. Admin has been notified.'
          : 'Status updated.'
      );
      setTechModal(false);
      techForm.resetFields();
      const updated = await ticketService.getTicketById(selected.id);
      setSelected(updated);
      fetchTickets();
    } catch { message.error('Failed to update status'); }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const updated = await ticketService.updatePriority(selected.id, newPriority);
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, priority: newPriority } : t));
      message.success(`Priority updated to ${newPriority}`);
    } catch { message.error('Failed to update priority'); }
  };

  // Admin: delete ticket
  const handleDelete = (ticketId) => {
    Modal.confirm({
      title: 'Delete Ticket',
      content: 'Are you sure you want to permanently delete this ticket? This cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await ticketService.deleteTicket(ticketId);
          message.success('Ticket deleted');
          closeDrawer();
          fetchTickets();
        } catch { message.error('Failed to delete ticket'); }
      }
    });
  };

  // Admin: close ticket — sets status to CLOSED immediately
  const handleClose = async () => {
    setClosing(true);
    try {
      await ticketService.updateStatus(selected.id, { status: 'CLOSED' });
      message.success('Ticket has been closed.');
      const updated = await ticketService.getTicketById(selected.id);
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'CLOSED' } : t));
    } catch { message.error('Failed to close ticket'); }
    finally { setClosing(false); }
  };

  // Comments
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

  const filtered = (status) => status === 'ALL' ? tickets : tickets.filter(t => t.status === status);

  const columns = [
    {
      title: 'Ticket', dataIndex: 'title', key: 'title',
      render: (text, r) => (
        <div>
          <div className="font-medium">
            {text}
            {r.escalated && (
              <Tag color="volcano" style={{ marginLeft: 6, fontSize: 10 }}>ESCALATED</Tag>
            )}
          </div>
          <Text type="secondary" className="text-xs">{r.category} · {r.location}</Text>
        </div>
      )
    },
    // Reporter column only for admin
    ...(isAdmin ? [{
      title: 'Reporter', key: 'reporter',
      render: (_, r) => <span>{r.reporterName || r.reporterEmail || '—'}</span>
    }] : []),
    {
      title: 'Priority', dataIndex: 'priority', key: 'priority',
      render: p => <Tag color={PRIORITY_COLOR[p]}>{p}</Tag>,
      filters: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(v => ({ text: v, value: v })),
      onFilter: (v, r) => r.priority === v,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: s => <Tag color={STATUS_COLOR[s]}>{s?.replace('_', ' ')}</Tag>
    },
    // Assigned To only for admin
    ...(isAdmin ? [{
      title: 'Assigned To', key: 'assignee',
      render: (_, r) => r.assigneeName || <Text type="secondary">Unassigned</Text>
    }] : []),
    {
      title: 'Created', dataIndex: 'createdAt', key: 'createdAt',
      render: d => d ? new Date(d).toLocaleDateString() : '-',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: '', key: 'actions',
      render: (_, r) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(r)}>View</Button>
          {isAdmin && (
            <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(r.id)} />
          )}
        </Space>
      )
    }
  ];

  const tabStatuses = isAdmin
    ? ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
    : ['ALL', 'IN_PROGRESS', 'RESOLVED'];

  const tabItems = tabStatuses.map(s => ({
    key: s,
    label: s === 'ALL' ? 'All' : (
      <span>{s.replace('_', ' ')} <Tag color={STATUS_COLOR[s]}>{tickets.filter(t => t.status === s).length}</Tag></span>
    ),
    children: (
      <Table columns={columns} dataSource={filtered(s)} rowKey="id"
        key={s} loading={loading} pagination={{ pageSize: 10 }} />
    )
  }));

  const drawerExtra = selected && (
    isAdmin ? (
      <Space>
        {!['CLOSED', 'REJECTED'].includes(selected.status) && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={closing}
            onClick={handleClose}
          >
            Close Ticket
          </Button>
        )}
        <Button onClick={() => { setStatusModal(true); statusForm.setFieldsValue({ status: selected.status }); }}>
          Update Status
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(selected.id)}>
          Delete
        </Button>
      </Space>
    ) : (
      selected.status === 'IN_PROGRESS' && (
        <Button type="primary" icon={<CheckCircleOutlined />}
          onClick={() => { setTechModal(true); techForm.setFieldsValue({ status: selected.status }); }}>
          Update Status
        </Button>
      )
    )
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdmin ? 'Ticket Management' : 'My Assigned Tickets'}
          </h1>
          <p className="text-gray-500">
            {isAdmin ? 'View all tickets and assign to technicians' : 'Tickets assigned to you'}
          </p>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* Ticket Detail Drawer */}
      <Drawer
        title={selected ? `Ticket #${selected.id} — ${selected.title}` : 'Ticket Details'}
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={closeDrawer}
        extra={drawerExtra}
      >
        {selected && (
          <div className="space-y-6">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLOR[selected.status]}>{selected.status?.replace('_', ' ')}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                {isAdmin ? (
                  <Select
                    value={selected.priority}
                    size="small"
                    style={{ width: 130 }}
                    onChange={handlePriorityChange}
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
                      <Option key={p} value={p}>
                        <Tag color={PRIORITY_COLOR[p]}>{p}</Tag>
                      </Option>
                    ))}
                  </Select>
                ) : (
                  <Tag color={PRIORITY_COLOR[selected.priority]}>{selected.priority}</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
              <Descriptions.Item label="Location">{selected.location}</Descriptions.Item>
              <Descriptions.Item label="Description">{selected.description}</Descriptions.Item>
              <Descriptions.Item label="Contact">{selected.contactDetails || '—'}</Descriptions.Item>
              {isAdmin && (
                <Descriptions.Item label="Reporter">
                  {selected.reporterName} ({selected.reporterEmail})
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Assigned To">
                {isAdmin ? (
                  <Select
                    value={selected.assigneeId || undefined}
                    placeholder="Assign technician"
                    style={{ width: 220 }}
                    onChange={(val) => { if (val) handleAssign(val); }}
                  >
                    {technicians.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                  </Select>
                ) : (selected.assigneeName || 'Unassigned')}
              </Descriptions.Item>
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
              <Descriptions.Item label="Created">
                {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}
              </Descriptions.Item>
              {selected.escalated && (
                <Descriptions.Item label="Auto-Escalated">
                  <Tag color="volcano">Priority was automatically escalated due to inactivity</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selected.imageUrls?.length > 0 && (
              <div>
                <Text strong>Evidence Images</Text>
                <Image.PreviewGroup>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selected.imageUrls.map((url, i) => (
                      <Image
                        key={i}
                        src={url}
                        alt={`evidence-${i}`}
                        width={96}
                        height={96}
                        style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #d9d9d9', cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                </Image.PreviewGroup>
              </div>
            )}

            {/* Comments */}
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

      {/* Admin: Full Status Update Modal */}
      {isAdmin && (
        <Modal
          title="Update Ticket Status"
          open={statusModal}
          onCancel={() => { setStatusModal(false); statusForm.resetFields(); }}
          footer={null}
        >
          <Form form={statusForm} layout="vertical" onFinish={handleStatusUpdate}>
            <Form.Item name="status" label="New Status" rules={[{ required: true }]}>
              <Select>
                {ADMIN_WORKFLOW.map(s => (
                  <Option key={s} value={s}>
                    <Tag color={STATUS_COLOR[s]}>{s.replace('_', ' ')}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.status !== cur.status}>
              {({ getFieldValue }) => getFieldValue('status') === 'REJECTED' && (
                <Form.Item name="rejectionReason" label="Rejection Reason" rules={[{ required: true }]}>
                  <TextArea rows={3} placeholder="Explain why this ticket is being rejected" />
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.status !== cur.status}>
              {({ getFieldValue }) => ['RESOLVED', 'CLOSED'].includes(getFieldValue('status')) && (
                <Form.Item name="resolutionNotes" label="Resolution Notes">
                  <TextArea rows={3} placeholder="Describe how the issue was resolved" />
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">Update</Button>
                <Button onClick={() => { setStatusModal(false); statusForm.resetFields(); }}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* Technician: Status Update Modal */}
      {isTechnician && (
        <Modal
          title="Update Ticket Status"
          open={techModal}
          onCancel={() => { setTechModal(false); techForm.resetFields(); }}
          footer={null}
        >
          <Form form={techForm} layout="vertical" onFinish={handleTechStatusUpdate}>
            <Form.Item name="status" label="New Status" rules={[{ required: true }]}>
              <Select>
                <Option value="IN_PROGRESS"><Tag color="processing">IN PROGRESS</Tag></Option>
                <Option value="RESOLVED"><Tag color="success">RESOLVED</Tag></Option>
              </Select>
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.status !== cur.status}>
              {({ getFieldValue }) => getFieldValue('status') === 'RESOLVED' && (
                <Form.Item name="resolutionNotes" label="Resolution Notes" rules={[{ required: true, message: 'Please describe how the issue was resolved' }]}>
                  <TextArea rows={3} placeholder="Describe how the issue was resolved" />
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">Update</Button>
                <Button onClick={() => { setTechModal(false); techForm.resetFields(); }}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
}
