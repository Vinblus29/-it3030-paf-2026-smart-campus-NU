import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import authService from '../../services/authService';

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

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.forgotPassword(values.email);
      setSuccess(true);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* ── Left panel ── */}
      <div style={S.left} className="auth-panel-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'linear-gradient(135deg, #f5a623, #e8920e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Smart Campus</div>
            <div style={{ fontSize: 10, color: '#f5a623', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>University Portal</div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 14px', lineHeight: 1.2 }}>
            Forgot your password?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
            No worries — enter your university email and we'll send you a secure link to reset it.
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
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>Check your inbox</h2>
              <p style={{ fontSize: 14, color: '#8896a4', lineHeight: 1.7, marginBottom: 28 }}>
                We've sent a password reset link to your email address. Check your inbox and follow the instructions.
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
                  Enter the email address linked to your account
                </p>
              </div>

              <Form form={form} name="forgot-password" onFinish={onFinish} layout="vertical" requiredMark={false}>
                <Form.Item name="email" style={{ marginBottom: 20 }}
                  rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}>
                  <Input
                    prefix={<MailOutlined style={{ color: '#9aaab8' }} />}
                    placeholder="University email address"
                    style={{ height: 44, borderRadius: 7, borderColor: '#e0e5ec' }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" loading={loading} block
                    style={{
                      height: 46, borderRadius: 7, fontWeight: 700, fontSize: 14,
                      background: '#0f3460', borderColor: '#0f3460',
                      boxShadow: '0 4px 14px rgba(15,52,96,0.3)',
                    }}>
                    Send Reset Link
                  </Button>
                </Form.Item>
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
