import { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Input, List, Avatar, Badge, Button, Tooltip, Empty, Spin, message, Modal, Form, Checkbox, Select, Upload } from 'antd';
import {
    SendOutlined, SearchOutlined, UserOutlined, TeamOutlined, PaperClipOutlined,
    InfoCircleOutlined, PlusOutlined, DeleteOutlined, FileTextOutlined,
    CloseCircleFilled
} from '@ant-design/icons';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { Sider, Content } = Layout;
const { Option } = Select;

const ChatPage = () => {
    const { user } = useAuth();
    const [stompClient, setStompClient] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const scrollRef = useRef(null);

    // Group Creation Modal
    const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [groupForm] = Form.useForm();

    // Attachment State
    const [attachmentUrl, setAttachmentUrl] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchInitialData();
        if (user?.role === 'ADMIN') fetchAllUsers();
    }, []);

    useEffect(() => {
        if (!user) return;
        const client = connectWebSocket();
        return () => {
            if (client) client.deactivate();
        };
    }, [groups.length]);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat);
        }
    }, [selectedChat]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [groupsRes] = await Promise.all([
                axios.get('/api/chat/groups'),
            ]);
            setGroups(groupsRes.data);
        } catch (err) {
            message.error('Failed to load chat data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get('/api/users/search?query=');
            setAllUsers(res.data.filter(u => u.id !== user.id));
        } catch (err) { }
    };

    const connectWebSocket = () => {
        const socket = new SockJS('http://localhost:8080/ws-chat');
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                client.subscribe(`/user/${user.email}/queue/messages`, (msg) => {
                    const newMsg = JSON.parse(msg.body);
                    handleIncomingMessage(newMsg);
                });

                groups.forEach(g => {
                    client.subscribe(`/topic/group/${g.id}`, (msg) => {
                        const newMsg = JSON.parse(msg.body);
                        handleIncomingMessage(newMsg);
                    });
                });
            }
        });
        client.activate();
        setStompClient(client);
        return client;
    };

    const handleIncomingMessage = (newMsg) => {
        // If message belongs to selected chat
        if (selectedChat) {
            const isMatch = (selectedChat.type === 'DIRECT' && newMsg.senderId === selectedChat.id) ||
                (selectedChat.type === 'GROUP' && newMsg.groupId === selectedChat.id) ||
                (newMsg.senderId === user.id);
            if (isMatch) {
                setMessages(prev => [...prev, newMsg]);
            }
        }
        // Update contacts/recent if it's a new direct chat
        if (!newMsg.groupId && newMsg.senderId !== user.id) {
            if (!contacts.find(c => c.id === newMsg.senderId)) {
                const newContact = { type: 'DIRECT', id: newMsg.senderId, name: newMsg.senderName, image: newMsg.senderImage };
                setContacts(prev => [newContact, ...prev]);
            }
        }
    };

    const fetchMessages = async (chat) => {
        try {
            setChatLoading(true);
            const url = chat.type === 'DIRECT'
                ? `/api/chat/conversation/${chat.id}`
                : `/api/chat/group/${chat.id}`;
            const res = await axios.get(url);
            setMessages(res.data);
        } catch (err) {
            message.error('Failed to load messages');
        } finally {
            setChatLoading(false);
        }
    };

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await axios.get(`/api/users/search?query=${val}`);
            setSearchResults(res.data.filter(u => u.id !== user.id));
        } catch (err) { }
    };

    const handleFileUpload = async (info) => {
        const file = info.file;
        if (file.status === 'uploading') {
            setUploading(true);
            return;
        }
        const formData = new FormData();
        formData.append('file', file.originFileObj);
        try {
            const res = await axios.post('/api/chat/upload-attachment', formData);
            setAttachmentUrl(res.data);
            message.success('File uploaded');
        } catch (err) {
            message.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const sendMessage = async () => {
        if ((!inputValue.trim() && !attachmentUrl) || !selectedChat) return;

        const payload = {
            content: inputValue,
            recipientId: selectedChat.type === 'DIRECT' ? selectedChat.id : null,
            groupId: selectedChat.type === 'GROUP' ? selectedChat.id : null,
            attachmentUrl: attachmentUrl
        };

        try {
            const url = selectedChat.type === 'DIRECT' ? '/api/chat/direct' : '/api/chat/broadcast';
            const res = await axios.post(url, payload);
            if (selectedChat.type === 'DIRECT') {
                setMessages(prev => [...prev, res.data]);
            }
            setInputValue('');
            setAttachmentUrl(null);
        } catch (err) {
            message.error('Failed to send message');
        }
    };

    const handleCreateGroup = async (values) => {
        try {
            setLoading(true);
            await axios.post('/api/chat/groups', {
                ...values,
                memberIds: [...(values.memberIds || []), user.id]
            });
            message.success('Group created successfully');
            setIsGroupModalVisible(false);
            groupForm.resetFields();
            fetchInitialData();
        } catch (err) {
            message.error('Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const startDirectChat = (recipient) => {
        const chat = { type: 'DIRECT', id: recipient.id, name: `${recipient.firstName} ${recipient.lastName}`, image: recipient.profileImageUrl };
        setSelectedChat(chat);
        setSearchResults([]);
        setSearchQuery('');
        if (!contacts.find(c => c.id === recipient.id)) {
            setContacts(prev => [chat, ...prev]);
        }
    };

    return (
        <Layout style={{ height: 'calc(100vh - 100px)', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <Sider width={320} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
                <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Messages</h2>
                        {user?.role === 'ADMIN' && (
                            <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => setIsGroupModalVisible(true)} size="small" style={{ background: '#0f3460' }} />
                        )}
                    </div>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Search people..."
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        style={{ borderRadius: 8 }}
                    />
                    {searchResults.length > 0 && (
                        <div style={{ position: 'absolute', top: 110, left: 16, right: 16, zIndex: 10, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: 8, maxHeight: 300, overflowY: 'auto' }}>
                            <List size="small" dataSource={searchResults} renderItem={u => (
                                <List.Item style={{ cursor: 'pointer' }} onClick={() => startDirectChat(u)}>
                                    <List.Item.Meta avatar={<Avatar src={u.profileImageUrl} icon={<UserOutlined />} />} title={u.firstName + ' ' + u.lastName} />
                                </List.Item>
                            )} />
                        </div>
                    )}
                </div>

                <Menu mode="inline" selectedKeys={[selectedChat ? `${selectedChat.type}-${selectedChat.id}` : '']} style={{ borderRight: 0 }}>
                    <Menu.ItemGroup key="contacts" title="Recent Chats">
                        {contacts.map(c => (
                            <Menu.Item key={`DIRECT-${c.id}`} onClick={() => setSelectedChat(c)} icon={<Badge status="success" dot><Avatar size="small" src={c.image} icon={<UserOutlined />} /></Badge>}>
                                {c.name}
                            </Menu.Item>
                        ))}
                    </Menu.ItemGroup>
                    <Menu.ItemGroup key="groups" title="Channels & Announcements">
                        {groups.map(g => (
                            <Menu.Item key={`GROUP-${g.id}`} onClick={() => setSelectedChat({ type: 'GROUP', id: g.id, name: g.name })} icon={<TeamOutlined />}>
                                {g.name}
                                {g.broadcastOnly && <Tooltip title="Admins Only"><InfoCircleOutlined style={{ marginLeft: 8, fontSize: 10, color: '#f5a623' }} /></Tooltip>}
                            </Menu.Item>
                        ))}
                    </Menu.ItemGroup>
                </Menu>
            </Sider>

            <Content style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
                {selectedChat ? (
                    <>
                        <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Avatar size="large" src={selectedChat.image} icon={selectedChat.type === 'DIRECT' ? <UserOutlined /> : <TeamOutlined />} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedChat.name}</div>
                                    <div style={{ fontSize: 12, color: '#52c41a' }}>Connected</div>
                                </div>
                            </div>
                        </div>

                        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc' }}>
                            {chatLoading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div> :
                                messages.length === 0 ? <Empty description="No messages yet" style={{ marginTop: 60 }} /> :
                                    messages.map((m, i) => {
                                        const isMe = m.senderId === user.id;
                                        return (
                                            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                                                {!isMe && (i === 0 || messages[i - 1].senderId !== m.senderId) && <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{m.senderName}</div>}
                                                <div style={{
                                                    maxWidth: '70%', padding: '8px 14px', borderRadius: 12, background: isMe ? '#0f3460' : '#fff', color: isMe ? '#fff' : '#1a1a2e',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: isMe ? 'none' : '1px solid #e2e8f0'
                                                }}>
                                                    {m.attachmentUrl && (
                                                        <div style={{ marginBottom: 8, padding: 8, background: isMe ? 'rgba(255,255,255,0.1)' : '#f1f5f9', borderRadius: 8 }}>
                                                            <a href={m.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: isMe ? '#fff' : '#0f3460', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <FileTextOutlined /> File Attachment
                                                            </a>
                                                        </div>
                                                    )}
                                                    {m.content}
                                                    <div style={{ fontSize: 9, color: isMe ? 'rgba(255,255,255,0.6)' : '#94a3b8', textAlign: 'right', marginTop: 4 }}>
                                                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
                            {attachmentUrl && (
                                <div style={{ marginBottom: 12, background: '#f8fafc', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileTextOutlined /> Attachment ready to send</div>
                                    <CloseCircleFilled style={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => setAttachmentUrl(null)} />
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Upload showUploadList={false} onChange={handleFileUpload} customRequest={({ onSuccess }) => onSuccess("ok")}>
                                    <Button icon={uploading ? <Spin size="small" /> : <PaperClipOutlined />} />
                                </Upload>
                                <Input.TextArea
                                    autoSize={{ minRows: 1, maxRows: 4 }}
                                    placeholder="Type a message..."
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    style={{ borderRadius: 8 }}
                                />
                                <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} style={{ background: '#f5a623', borderColor: '#f5a623' }} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Empty description="Select a chat to start messaging" />
                    </div>
                )}
            </Content>

            <Modal title={<b>Create New Channel</b>} open={isGroupModalVisible} onCancel={() => setIsGroupModalVisible(false)} footer={null} centered>
                <Form form={groupForm} layout="vertical" onFinish={handleCreateGroup}>
                    <Form.Item name="name" label="Group Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Faculty Announcements" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} placeholder="What is this group about?" />
                    </Form.Item>
                    <Form.Item name="includeAllUsers" valuePropName="checked" initialValue={false}>
                        <Checkbox><b>Add All Registered Users</b> (Global channel)</Checkbox>
                    </Form.Item>
                    <Form.Item
                        name="memberIds"
                        label="Add Individual Members"
                        hidden={Form.useWatch('includeAllUsers', groupForm)}
                    >
                        <Select mode="multiple" placeholder="Select users" filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                            {allUsers.map(u => (
                                <Option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="broadcastOnly" valuePropName="checked" initialValue={false}>
                        <Checkbox><b>Broadcast Only</b> (Only admins can post)</Checkbox>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading} style={{ background: '#0f3460', height: 44, borderRadius: 8 }}>
                        Create Channel
                    </Button>
                </Form>
            </Modal>
        </Layout>
    );
};

export default ChatPage;
