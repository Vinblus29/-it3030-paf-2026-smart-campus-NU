import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Steps } from 'antd';
import { MailOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

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
    padding: '40px 24px',
  },
  card: {
    width: '100%', maxWidth: 420,
    background: '#fff', borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e8ecf0',
    padding: '40px 36px',
  },
};

const { Step } = Steps;

const ForgotPassword = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState(''); // Store verified OTP
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // OTP Cooldown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setOtpCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sendOtp = async () => {
    const emailValue = form.getFieldValue('email');
    if (!emailValue) return message.warning('Enter email first');
    
    setOtpLoading(true);
    try {
      await axios.post('/api/auth/generate-otp', { email: emailValue });
      setEmail(emailValue);
      message.success('OTP sent to ' + emailValue);
      setOtpCooldown(60);
      setCurrentStep(1);
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otp = form.getFieldValue('otp');
    if (!otp) return message.error('Please enter the OTP');
    if (!/^\d{6}$/.test(otp)) return message.error('OTP must be exactly 6 digits');
    
    setOtpLoading(true);
    try {
      // Verify OTP with backend before moving to next step
      await axios.post('/api/auth/verify-otp-only', {
        email,
        otp
      });
      
      // Store the OTP only if verification is successful
      setVerifiedOtp(otp);
      message.success('OTP verified successfully! Now set your new password.');
      setCurrentStep(2);
    } catch (e) {
      const errorMsg = e.response?.data?.message || 'Failed to verify OTP';
      message.error(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  const resetPassword = async (values) => {
    setLoading(true);
    try {
      // Use the verified OTP that was stored after verification
      const response = await axios.post('/api/auth/verify-otp', {
        email,
        otp: verifiedOtp,
        newPassword: values.newPassword
      });
      
      message.success('Password reset successfully!');
      setSuccess(true);
    } catch (e) {
      // Error handling for different scenarios
      const errorMsg = e.response?.data?.message || e.response?.data || 'Failed to reset password';
      const errorString = errorMsg.toString().toLowerCase();
      
      if (errorString.includes('invalid otp')) {
        message.error('OTP validation failed. Please go back and enter the OTP again.');
        setCurrentStep(1); // Go back to OTP step
        setVerifiedOtp(''); // Clear verified OTP
        form.setFieldsValue({ otp: '' }); // Clear the OTP field
      } else if (errorString.includes('expired')) {
        message.error('OTP has expired. Please go back and request a new OTP.');
        setCurrentStep(0); // Go back to email step
        setVerifiedOtp(''); // Clear verified OTP
        form.resetFields(); // Clear all fields
      } else {
        message.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* ── Left panel ── */}
      <div style={S.left} className="auth-panel-left">
        <img 
          src="/southwestern-campus-logo.png" 
          alt="Southwestern Campus Logo" 
          style={{
            height: 50,
            objectFit: 'contain'
          }}
        />

        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 14px', lineHeight: 1.2 }}>
            Reset your password
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
            Follow the steps to verify your identity and set a new password securely.
          </p>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          © 2026 Smart Campus. All rights reserved.
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={S.right}>
        <div style={S.card}>
          {success ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#f0fff4', border: '2px solid #b7eb8f',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <svg width="32" height="32" fill="none" stroke="#52c41a" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>Password reset successful</h2>
              <p style={{ fontSize: 14, color: '#8896a4', lineHeight: 1.7, marginBottom: 28 }}>
                Your password has been changed successfully. You can now log in with your new password.
              </p>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#0f3460', color: '#fff', padding: '12px 28px',
                borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 14,
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign in
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f5a623', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                  Account Recovery
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>Reset your password</h1>
                <p style={{ fontSize: 13, color: '#8896a4', margin: 0 }}>
                  {currentStep === 0 && 'Enter your university email address'}
                  {currentStep === 1 && 'Verify the code sent to your email'}
                  {currentStep === 2 && 'Set your new password'}
                </p>
              </div>

              <Steps current={currentStep} size="small" style={{ marginBottom: 32 }}>
                <Step title="Email" />
                <Step title="Verify OTP" />
                <Step title="New Password" />
              </Steps>

              <Form form={form} layout="vertical" requiredMark={false}>
                {/* Step 0: Email */}
                {currentStep === 0 && (
                  <>
                    <Form.Item name="email" style={{ marginBottom: 20 }}
                      rules={[
                        { required: true, message: 'Email is required' },
                        { type: 'email', message: 'Enter a valid email' }
                      ]}>
                      <Input
                        prefix={<MailOutlined style={{ color: '#9aaab8' }} />}
                        placeholder="University email address"
                        style={{ height: 44, borderRadius: 7, borderColor: '#e0e5ec' }}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button 
                        type="primary" 
                        block 
                        onClick={() => form.validateFields(['email']).then(sendOtp)}
                        loading={otpLoading}
                        style={{
                          height: 46, borderRadius: 7, fontWeight: 700, fontSize: 14,
                          background: '#0f3460', borderColor: '#0f3460',
                        }}
                      >
                        Send OTP
                      </Button>
                    </Form.Item>
                  </>
                )}

                {/* Step 1: OTP Verification */}
                {currentStep === 1 && (
                  <>
                    <p style={{ fontSize: 13, color: '#8896a4', marginBottom: 16 }}>
                      We've sent a 6-digit code to <strong>{email}</strong>
                    </p>
                    <Form.Item name="otp" label="Enter OTP" style={{ marginBottom: 20 }}
                      rules={[
                        { required: true, message: 'OTP is required' },
                        {
                          pattern: /^\d{6}$/,
                          message: 'OTP must be exactly 6 digits'
                        }
                      ]}>
                      <Input 
                        maxLength={6} 
                        placeholder="000000"
                        style={{ 
                          textAlign: 'center', 
                          letterSpacing: 8, 
                          fontWeight: 700, 
                          fontSize: 18,
                          height: 44,
                          borderRadius: 7
                        }} 
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 12 }}>
                      <Button 
                        type="primary" 
                        block 
                        onClick={verifyOtp}
                        loading={otpLoading}
                        style={{
                          height: 46, borderRadius: 7, fontWeight: 700, fontSize: 14,
                          background: '#0f3460', borderColor: '#0f3460',
                        }}
                      >
                        Verify OTP
                      </Button>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button 
                        type="link" 
                        block 
                        onClick={sendOtp}
                        disabled={otpCooldown > 0}
                        style={{ height: 44 }}
                      >
                        {otpCooldown > 0 ? `Resend OTP (${otpCooldown}s)` : 'Resend OTP'}
                      </Button>
                    </Form.Item>
                  </>
                )}

                {/* Step 2: New Password */}
                {currentStep === 2 && (
                  <>
                    <div style={{ background: '#f0fff4', color: '#52c41a', padding: 12, borderRadius: 6, marginBottom: 20, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <CheckCircleOutlined /> OTP Verified! Set your new password
                    </div>
                    <Form.Item 
                      name="newPassword" 
                      label="New Password" 
                      style={{ marginBottom: 16 }}
                      rules={[
                        { required: true, message: 'Password is required' },
                        {
                          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{8,}$/,
                          message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
                        }
                      ]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined style={{ color: '#9aaab8' }} />} 
                        placeholder="••••••••"
                        style={{ height: 44, borderRadius: 7 }}
                      />
                    </Form.Item>

                    <Form.Item 
                      name="confirmPassword" 
                      label="Confirm Password" 
                      style={{ marginBottom: 20 }}
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Confirm password is required' },
                        ({ getFieldValue }) => ({
                          validator(_, val) {
                            if (!val || getFieldValue('newPassword') === val) return Promise.resolve();
                            return Promise.reject('Passwords do not match');
                          }
                        })
                      ]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined style={{ color: '#9aaab8' }} />} 
                        placeholder="••••••••"
                        style={{ height: 44, borderRadius: 7 }}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button 
                        type="primary" 
                        block 
                        onClick={() => form.validateFields(['newPassword', 'confirmPassword']).then(resetPassword)}
                        loading={loading}
                        style={{
                          height: 46, borderRadius: 7, fontWeight: 700, fontSize: 14,
                          background: '#0f3460', borderColor: '#0f3460',
                        }}
                      >
                        Reset Password
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form>

              <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f3f7' }}>
                <Link to="/login" style={{
                  fontSize: 13, fontWeight: 600, color: '#0f3460', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
