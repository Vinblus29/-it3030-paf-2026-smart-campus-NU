import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Checkbox, Steps, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, IdcardOutlined, CameraOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import axios from 'axios';

const { Step } = Steps;

const S = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif" },
  left: {
    width: 420, flexShrink: 0,
    background: 'linear-gradient(165deg, #0f3460 0%, #16213e 55%, #1a1a2e 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '48px 44px',
  },
  right: {
    flex: 1, background: '#f7f9fc',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 24px', overflowY: 'auto',
  },
  card: {
    width: '100%', maxWidth: 500,
    background: '#fff', borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e8ecf0',
    padding: '36px 36px',
  },
};

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const OAuthBtn = ({ icon, label, href }) => (
  <a href={href} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: '10px 16px', background: '#fff',
    border: '1px solid #e0e5ec', borderRadius: 7, cursor: 'pointer',
    fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none',
    transition: 'all 0.15s',
  }}
    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#0f3460'; }}
    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e5ec'; }}
  >
    {icon}{label}
  </a>
);

const Register = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Verification States
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileObject, setFileObject] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  // Timer logic for cooldowns
  useEffect(() => {
    const timer = setInterval(() => {
      setEmailCooldown(prev => (prev > 0 ? prev - 1 : 0));
      setPhoneCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleProfileUpload = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Please upload an image file (JPG, PNG, WEBP, etc.)');
      return false;
    }

    // Generate instant local preview using FileReader
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    // Save for later upload
    setFileObject(file);
    return false; // Prevent antd auto-upload
  };

  const sendEmailOtp = async () => {
    const email = form.getFieldValue('email');
    if (!email) return message.warning('Enter email first');
    setOtpLoading(true);
    try {
      await axios.post('/api/auth/register/send-otp-email', { email });
      message.success('OTP sent to ' + email);
      setEmailCooldown(60);
    } catch (e) {
      message.error('Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    const email = form.getFieldValue('email');
    const otp = form.getFieldValue('emailOtp');
    if (!otp) return message.warning('Enter OTP');
    setOtpLoading(true);
    try {
      await axios.post('/api/auth/register/verify-otp-email', { email, otp });
      setEmailVerified(true);
      message.success('Email verified!');
      next();
    } catch (e) {
      message.error(e.response?.data || 'Invalid verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const sendPhoneOtp = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone) return message.warning('Enter phone first');
    setOtpLoading(true);
    try {
      await axios.post('/api/auth/register/send-otp-phone', { phone });
      message.success('OTP sent to ' + phone);
      setPhoneCooldown(60);
    } catch (e) {
      message.error('Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyPhoneOtp = async () => {
    const phone = form.getFieldValue('phone');
    const otp = form.getFieldValue('phoneOtp');
    if (!otp) return message.warning('Enter OTP');
    setOtpLoading(true);
    try {
      await axios.post('/api/auth/register/verify-otp-phone', { phone, otp });
      setPhoneVerified(true);
      message.success('Phone verified!');
      next();
    } catch (e) {
      message.error(e.response?.data || 'Invalid verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const next = () => setCurrentStep(currentStep + 1);
  const prev = () => setCurrentStep(currentStep - 1);

  const onFinish = async (values) => {
    if (!emailVerified || !phoneVerified) return message.error('Please verify email and phone first');
    console.log('Form Values collected:', values);
    setLoading(true);
    try {
      let finalImageUrl = imageUrl;

      // Only upload if a file was selected during registration
      if (fileObject) {
        const formData = new FormData();
        formData.append('file', fileObject);
        const uploadResp = await axios.post('/api/auth/upload-profile-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadResp.data;
      }

      await axios.post('/api/auth/register', {
        ...values,
        phoneNumber: values.phone,
        profileImageUrl: finalImageUrl
      });
      message.success('Registration successful! Awaiting admin approval.');
      navigate('/login');
    } catch (e) {
      console.error('Registration/Upload Error:', e.response?.data || e.message);
      message.error(e.response?.data?.message || 'Registration or Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.left} className="auth-panel-left">
        <div>
          <img 
            src="/southwestern-campus-logo.png" 
            alt="Southwestern Campus Logo" 
            style={{
              height: 45,
              objectFit: 'contain',
              marginBottom: 40
            }}
          />
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>Complete Secure Registration</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 16 }}>Follow the 4-step process to verify your identity and secure your university account.</p>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>© 2026 Smart Campus Univ.</div>
      </div>

      <div style={S.right}>
        <div style={S.card}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>Signup</h1>
            <p style={{ fontSize: 13, color: '#8896a4', margin: 0 }}>Register with university email or social login</p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <div style={{ flex: 1 }}><OAuthBtn icon={<MicrosoftIcon />} label="Microsoft" href="http://localhost:8080/oauth2/authorization/microsoft" /></div>
            <div style={{ flex: 1 }}><OAuthBtn icon={<GoogleIcon />} label="Google" href="http://localhost:8080/oauth2/authorization/google" /></div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
            <span style={{ fontSize: 10, color: '#b0bcca', fontWeight: 700, letterSpacing: 0.5 }}>OR USE EMAIL FORM</span>
            <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
          </div>

          <Steps current={currentStep} size="small" style={{ marginBottom: 32 }}>
            <Step title="Profile" />
            <Step title="Email" />
            <Step title="Phone" />
            <Step title="Security" />
          </Steps>

          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} preserve={true}>
            {/* Step 0: Profile */}
            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Basic Information</h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <Upload listType="picture-circle" showUploadList={false} beforeUpload={handleProfileUpload}>
                  {previewUrl ? <img src={previewUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> :
                    <div>{uploading ? <LoadingOutlined /> : <CameraOutlined />}<div style={{ marginTop: 8, fontSize: 12 }}>Photo</div></div>}
                </Upload>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input prefix={<UserOutlined />} placeholder="e.g. John" /></Form.Item>
                <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input prefix={<UserOutlined />} placeholder="e.g. Doe" /></Form.Item>
              </div>
              <Form.Item 
                name="studentId" 
                label="Student/Staff ID" 
                rules={[
                  { required: true, message: 'Student/Staff ID is required' },
                  {
                    pattern: /^it\d{8}$/i,
                    message: 'Student/Staff ID must start with "it" followed by 8 digits (e.g., it23203112)'
                  }
                ]}
              >
                <Input prefix={<IdcardOutlined />} placeholder="e.g. it23203112" maxLength={10} />
              </Form.Item>
              <Button type="primary" block onClick={() => form.validateFields(['firstName', 'lastName', 'studentId']).then(next)} style={{ height: 44, borderRadius: 6, marginTop: 10 }}>Next Step</Button>
            </div>

            {/* Step 1: Email */}
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Email Verification</h3>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>We'll send a 6-digit code to your university email.</p>
              <Form.Item name="email" label="University Email" rules={[{ required: true, type: 'email' }]}>
                <Input disabled={emailVerified} prefix={<MailOutlined />} placeholder="name@univ.edu" suffix={
                  <Button
                    type="link"
                    size="small"
                    onClick={sendEmailOtp}
                    disabled={otpLoading || emailVerified || emailCooldown > 0}
                  >
                    {emailCooldown > 0 ? `Resend (${emailCooldown}s)` : 'Send Code'}
                  </Button>
                } />
              </Form.Item>
              {!emailVerified && (
                <Form.Item name="emailOtp" label="Enter 6-digit OTP">
                  <Input maxLength={6} style={{ textAlign: 'center', letterSpacing: 8, fontWeight: 700, fontSize: 18 }} />
                </Form.Item>
              )}
              {emailVerified ? (
                <div style={{ background: '#f6ffed', color: '#52c41a', padding: 12, borderRadius: 6, marginBottom: 20, textAlign: 'center' }}>
                  <CheckCircleOutlined /> Email Verified Successfully
                </div>
              ) : (
                <Button type="primary" block onClick={verifyEmailOtp} loading={otpLoading} style={{ height: 44, borderRadius: 6 }}>Verify Email</Button>
              )}
              <Button type="link" block onClick={prev} style={{ marginTop: 10 }}>Back</Button>
            </div>

            {/* Step 2: Phone */}
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Phone Verification</h3>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Protect your account with SMS verification.</p>
              <Form.Item 
                name="phone" 
                label="Phone Number" 
                rules={[
                  { required: true, message: 'Phone number is required' },
                  { 
                    pattern: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 
                    message: 'Please enter a valid phone number' 
                  },
                  { 
                    min: 10, 
                    message: 'Phone number must be at least 10 digits' 
                  }
                ]}
              >
                <Input disabled={phoneVerified} prefix={<PhoneOutlined />} placeholder="+94 XX XXX XXXX" suffix={
                  <Button
                    type="link"
                    size="small"
                    onClick={sendPhoneOtp}
                    disabled={otpLoading || phoneVerified || phoneCooldown > 0}
                  >
                    {phoneCooldown > 0 ? `Resend (${phoneCooldown}s)` : 'Send SMS'}
                  </Button>
                } />
              </Form.Item>
              {!phoneVerified && (
                <Form.Item name="phoneOtp" label="Enter SMS Code">
                  <Input maxLength={6} style={{ textAlign: 'center', letterSpacing: 8, fontWeight: 700, fontSize: 18 }} />
                </Form.Item>
              )}
              {phoneVerified ? (
                <div style={{ background: '#f6ffed', color: '#52c41a', padding: 12, borderRadius: 6, marginBottom: 20, textAlign: 'center' }}>
                  <CheckCircleOutlined /> Phone Verified Successfully
                </div>
              ) : (
                <Button type="primary" block onClick={verifyPhoneOtp} loading={otpLoading} style={{ height: 44, borderRadius: 6 }}>Verify Phone</Button>
              )}
              <Button type="link" block onClick={prev} style={{ marginTop: 10 }}>Back</Button>
            </div>

            {/* Step 3: Password */}
            <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Security Setup</h3>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Set a strong password for your university portal.</p>
              <Form.Item 
                name="password" 
                label="Password" 
                rules={[
                  { required: true, message: 'Password is required' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{8,}$/,
                    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
                  }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
              </Form.Item>
              <Form.Item name="confirmPassword" label="Confirm Password" dependencies={['password']} rules={[
                { required: true },
                ({ getFieldValue }) => ({ validator(_, val) { if (!val || getFieldValue('password') === val) return Promise.resolve(); return Promise.reject('Passwords do not match'); } })
              ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
              </Form.Item>
              <Form.Item name="terms" valuePropName="checked" rules={[{ validator: (_, v) => v ? Promise.resolve() : Promise.reject('Accept terms') }]}>
                <Checkbox style={{ fontSize: 12 }}>
                  I agree to the <Link to="/portal-terms" target="_blank" style={{ color: '#0f3460', fontWeight: 600 }}>Portal Terms of Use</Link>
                </Checkbox>
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 46, borderRadius: 6, fontSize: 15, fontWeight: 700, background: '#0f3460' }}>Complete Registration</Button>
              <Button type="link" block onClick={prev} style={{ marginTop: 10 }}>Back</Button>
            </div>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
            Already have an account? <Link to="/login" style={{ color: '#f5a623', fontWeight: 700 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
