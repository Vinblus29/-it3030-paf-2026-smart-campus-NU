import { useState, useRef, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, message, Avatar, Divider, Tag, Modal, Steps } from 'antd';
import {
    UserOutlined, MailOutlined, PhoneOutlined, CameraOutlined,
    LockOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
    MobileOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const { Step } = Steps;

const ProfilePage = () => {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [imageUrl, setImageUrl] = useState(user?.profileImageUrl);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user?.profileImageUrl);

    // Modals States
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [isPhoneModalVisible, setIsPhoneModalVisible] = useState(false);
    const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);

    const [passwordStep, setPasswordStep] = useState(0);
    const [phoneStep, setPhoneStep] = useState(0);
    const [emailStep, setEmailStep] = useState(0);

    const [otpLoading, setOtpLoading] = useState(false);
    const [passwordForm] = Form.useForm();
    const [phoneForm] = Form.useForm();
    const [emailForm] = Form.useForm();

    const [passwordCooldown, setPasswordCooldown] = useState(0);
    const [phoneCooldown, setPhoneCooldown] = useState(0);
    const [emailCooldown, setEmailCooldown] = useState(0);

    // Timer logic for cooldowns
    useEffect(() => {
        const timer = setInterval(() => {
            setPasswordCooldown(prev => (prev > 0 ? prev - 1 : 0));
            setPhoneCooldown(prev => (prev > 0 ? prev - 1 : 0));
            setEmailCooldown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Sync preview URL when user data changes
    useEffect(() => {
        if (user) {
            setImageUrl(user.profileImageUrl);
            setPreviewUrl(user.profileImageUrl);
            form.setFieldsValue({
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                email: user.email
            });
        }
    }, [user, form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            let finalImageUrl = imageUrl;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                try {
                    const uploadRes = await axios.post('/api/auth/upload-profile-image', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    finalImageUrl = uploadRes.data;
                } catch (err) {
                    console.error('Upload Error:', err);
                    message.error('File upload failed. The image might be too large or incompatible.');
                    setLoading(false);
                    return;
                }
            }

            const response = await axios.put('/api/auth/profile', {
                firstName: values.firstName,
                lastName: values.lastName,
                phoneNumber: user.phoneNumber, // Use existing phone, change via dedicated modal
                profileImageUrl: finalImageUrl
            });

            setUser(response.data);
            setImageUrl(finalImageUrl);
            setSelectedFile(null);
            message.success('Profile information updated');
        } catch (error) {
            console.error('Profile update failed:', error);
            message.error(error.response?.data || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBeforeUpload = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG files!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
            return false;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
        return false;
    };

    // Password Handlers
    const handleSendPasswordOtp = async () => {
        setOtpLoading(true);
        try {
            await axios.post('/api/auth/generate-otp', { email: user.email });
            message.success('Code sent to ' + user.email);
            setPasswordStep(1);
            setPasswordCooldown(60);
        } catch (error) {
            message.error('Failed to send code');
        } finally {
            setOtpLoading(false);
        }
    };

    const handlePasswordChange = async (values) => {
        setLoading(true);
        try {
            await axios.post('/api/auth/verify-otp', {
                email: user.email,
                otp: values.otp,
                newPassword: values.newPassword
            });
            message.success('Password updated');
            setIsPasswordModalVisible(false);
        } catch (error) {
            message.error(error.response?.data || 'Incorrect code');
        } finally {
            setLoading(false);
        }
    };

    // Phone Handlers
    const handleSendPhoneOtp = async () => {
        const newPhone = phoneForm.getFieldValue('newPhoneNumber');
        if (!newPhone) return message.warning('Enter new phone number first');

        setOtpLoading(true);
        try {
            await axios.post('/api/auth/phone/generate-otp', { phoneNumber: newPhone });
            message.success('Code sent to ' + newPhone);
            setPhoneStep(1);
            setPhoneCooldown(60);
        } catch (error) {
            message.error('Failed to send code');
        } finally {
            setOtpLoading(false);
        }
    };

    const handlePhoneVerify = async (values) => {
        setLoading(true);
        try {
            await axios.post('/api/auth/phone/verify-otp', {
                phoneNumber: values.newPhoneNumber,
                otp: values.otp
            });
            message.success('Phone number updated');

            // Refresh user context
            const meRes = await axios.get('/api/auth/me');
            setUser(meRes.data);

            setIsPhoneModalVisible(false);
            setPhoneStep(0);
            phoneForm.resetFields();
        } catch (error) {
            message.error(error.response?.data || 'Incorrect code');
        } finally {
            setLoading(false);
        }
    };

    // Email Handlers
    const handleSendEmailOtp = async () => {
        const newEmail = emailForm.getFieldValue('newEmail');
        if (!newEmail) return message.warning('Enter new email first');

        setOtpLoading(true);
        try {
            await axios.post('/api/auth/email/generate-otp', { email: newEmail });
            message.success('Code sent to ' + newEmail);
            setEmailStep(1);
            setEmailCooldown(60);
        } catch (error) {
            message.error('Failed to send code');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleEmailVerify = async (values) => {
        setLoading(true);
        try {
            await axios.post('/api/auth/email/verify-otp', {
                email: values.newEmail,
                otp: values.otp
            });
            message.success('Email updated');

            // Refresh user context
            const meRes = await axios.get('/api/auth/me');
            setUser(meRes.data);

            setIsEmailModalVisible(false);
            setEmailStep(0);
            emailForm.resetFields();
        } catch (error) {
            message.error(error.response?.data || 'Incorrect code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 0' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#1a1a2e' }}>Account Settings</h1>
                <p style={{ color: '#64748b', marginTop: 4 }}>Security and Personal Details</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
                {/* Left Side: Photo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <Card style={{ textAlign: 'center', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                            <Avatar size={140} src={previewUrl} icon={<UserOutlined />} style={{ border: '4px solid #f8fafc', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Upload name="file" showUploadList={false} beforeUpload={handleBeforeUpload}>
                                <Button shape="circle" icon={<CameraOutlined />} style={{ position: 'absolute', bottom: 4, right: 4, background: '#0f3460', color: '#fff' }} />
                            </Upload>
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{user?.firstName} {user?.lastName}</h2>
                        <Tag color="cyan" style={{ marginBottom: 16, borderRadius: 12 }}>{user?.role}</Tag>

                        <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Joined Campus</div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Join Date N/A'}</div>
                        </div>
                    </Card>
                </div>

                {/* Right Side: Form */}
                <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: 24, paddingBottom: 16 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Identity Details</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                                <Input style={{ height: 44, borderRadius: 8 }} />
                            </Form.Item>
                            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                                <Input style={{ height: 44, borderRadius: 8 }} />
                            </Form.Item>
                        </div>

                        <Form.Item name="phoneNumber" label="Phone (requires verification to change)">
                            <Input
                                prefix={<PhoneOutlined />}
                                disabled
                                suffix={<Button type="link" onClick={() => { setIsPhoneModalVisible(true); setPhoneStep(0); }} style={{ padding: 0 }}>Change Number</Button>}
                                style={{ height: 44, borderRadius: 8, background: '#f8fafc' }}
                            />
                        </Form.Item>

                        <Form.Item name="email" label="Email (requires verification to change)">
                            <Input 
                                prefix={<MailOutlined />} 
                                disabled 
                                value={user?.email}
                                suffix={<Button type="link" onClick={() => { setIsEmailModalVisible(true); setEmailStep(0); }} style={{ padding: 0 }}>Change Email</Button>}
                                style={{ height: 44, borderRadius: 8, background: '#f8fafc' }} 
                            />
                        </Form.Item>

                        <Divider />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button type="ghost" icon={<LockOutlined />} onClick={() => { setIsPasswordModalVisible(true); setPasswordStep(0); }} style={{ borderRadius: 8 }}>
                                Change Password
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#0f3460', height: 44, padding: '0 32px', borderRadius: 8 }}>
                                Save Basic Profile
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>

            {/* Password Modal */}
            <Modal title="Secure Password Change" open={isPasswordModalVisible} footer={null} onCancel={() => setIsPasswordModalVisible(false)} centered>
                <Steps current={passwordStep} size="small" style={{ marginBottom: 24 }}>
                    <Step title="Verify" />
                    <Step title="New Password" />
                </Steps>
                {passwordStep === 0 ? (
                    <div style={{ textAlign: 'center' }}>
                        <p>Code will be sent to <b>{user?.email}</b></p>
                        <Button
                            type="primary"
                            onClick={handleSendPasswordOtp}
                            loading={otpLoading}
                            disabled={passwordCooldown > 0}
                            block
                            style={{ background: '#0f3460' }}
                        >
                            {passwordCooldown > 0 ? `Resend Code (${passwordCooldown}s)` : 'Send OTP'}
                        </Button>
                    </div>
                ) : (
                    <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
                        <Form.Item name="otp" label="Code" rules={[{ required: true }]}>
                            <Input placeholder="123456" maxLength={6} />
                        </Form.Item>
                        <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 8 }]}>
                            <Input.Password />
                        </Form.Item>
                        <Form.Item name="confirm" label="Confirm" dependencies={['newPassword']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator(_, val) { if (!val || getFieldValue('newPassword') === val) return Promise.resolve(); return Promise.reject(new Error('Mismatch')); } })]}>
                            <Input.Password />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#22c55e', border: 'none' }}>Update Password</Button>
                    </Form>
                )}
            </Modal>

            {/* Phone Modal */}
            <Modal title="Verify Phone Number" open={isPhoneModalVisible} footer={null} onCancel={() => setIsPhoneModalVisible(false)} centered>
                <Steps current={phoneStep} size="small" style={{ marginBottom: 24 }}>
                    <Step title="New Number" />
                    <Step title="Verify" />
                </Steps>
                <Form form={phoneForm} layout="vertical" onFinish={handlePhoneVerify}>
                    {phoneStep === 0 ? (
                        <>
                            <Form.Item name="newPhoneNumber" label="New Phone Number" rules={[{ required: true }]}>
                                <Input prefix={<MobileOutlined />} placeholder="9876543210" maxLength={10} />
                            </Form.Item>
                            <Button
                                type="primary"
                                onClick={handleSendPhoneOtp}
                                loading={otpLoading}
                                disabled={phoneCooldown > 0}
                                block
                                style={{ background: '#0f3460' }}
                            >
                                {phoneCooldown > 0 ? `Resend SMS (${phoneCooldown}s)` : 'Send OTP'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <p style={{ textAlign: 'center' }}>Verification code sent to <b>{phoneForm.getFieldValue('newPhoneNumber')}</b></p>
                            <Button
                                type="link"
                                onClick={handleSendPhoneOtp}
                                disabled={otpLoading || phoneCooldown > 0}
                                block
                                style={{ marginBottom: 16 }}
                            >
                                {phoneCooldown > 0 ? `Resend in ${phoneCooldown}s` : 'Resend Code'}
                            </Button>
                            <Form.Item name="otp" label="Code" rules={[{ required: true }]}>
                                <Input placeholder="123456" maxLength={6} />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#22c55e', border: 'none' }}>Verify & Update Phone</Button>
                            <Button type="link" onClick={() => setPhoneStep(0)} block style={{ marginTop: 8 }}>Change Number</Button>
                        </>
                    )}
                </Form>
            </Modal>

            {/* Email Modal */}
            <Modal title="Verify Email Address" open={isEmailModalVisible} footer={null} onCancel={() => setIsEmailModalVisible(false)} centered>
                <Steps current={emailStep} size="small" style={{ marginBottom: 24 }}>
                    <Step title="New Email" />
                    <Step title="Verify" />
                </Steps>
                <Form form={emailForm} layout="vertical" onFinish={handleEmailVerify}>
                    {emailStep === 0 ? (
                        <>
                            <Form.Item name="newEmail" label="New Email Address" rules={[{ required: true, type: 'email' }]}>
                                <Input prefix={<MailOutlined />} placeholder="newemail@example.com" />
                            </Form.Item>
                            <Button
                                type="primary"
                                onClick={handleSendEmailOtp}
                                loading={otpLoading}
                                disabled={emailCooldown > 0}
                                block
                                style={{ background: '#0f3460' }}
                            >
                                {emailCooldown > 0 ? `Resend Code (${emailCooldown}s)` : 'Send OTP'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <p style={{ textAlign: 'center' }}>Verification code sent to <b>{emailForm.getFieldValue('newEmail')}</b></p>
                            <Button
                                type="link"
                                onClick={handleSendEmailOtp}
                                disabled={otpLoading || emailCooldown > 0}
                                block
                                style={{ marginBottom: 16 }}
                            >
                                {emailCooldown > 0 ? `Resend in ${emailCooldown}s` : 'Resend Code'}
                            </Button>
                            <Form.Item name="otp" label="Code" rules={[{ required: true }]}>
                                <Input placeholder="123456" maxLength={6} />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#22c55e', border: 'none' }}>Verify & Update Email</Button>
                            <Button type="link" onClick={() => setEmailStep(0)} block style={{ marginTop: 8 }}>Change Email</Button>
                        </>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default ProfilePage;
