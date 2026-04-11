import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Checkbox } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

/* ── Shared auth panel styles ── */
const S = {
  page: {
    minHeight: '100vh', display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif",
  },
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

const OAuthBtn = ({ icon, label, onClick, href }) => {
  const props = href
    ? { as: 'a', href }
    : { as: 'button', type: 'button', onClick };
  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      {...(href ? { href } : { type: 'button', onClick })}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '10px 16px', background: '#fff',
        border: '1px solid #e0e5ec', borderRadius: 7, cursor: 'pointer',
        fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#0f3460'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e5ec'; }}
    >
      {icon}
      {label}
    </Tag>
  );
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) { form.setFieldsValue({ email: remembered }); setRememberMe(true); }
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password, rememberMe);
      if (rememberMe) localStorage.setItem('rememberedEmail', values.email);
      else localStorage.removeItem('rememberedEmail');
      message.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      if (msg.includes('pending')) message.warning('Your account is pending admin approval.');
      else message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* ── Left panel ── */}
      <div style={S.left} className="auth-panel-left">
        {/* Logo */}
<img 
            src="/southwestern-campus-logo.png" 
            alt="Southwestern Campus Logo" 
            style={{
              height: 50,
              objectFit: 'contain'
            }}
          />

        {/* Hero text */}
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 14px', lineHeight: 1.2 }}>
            Welcome back to Smart Campus
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
            Your unified portal for managing facilities, booking resources, and raising support tickets.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
            {['Facility Bookings', 'Support Tickets', 'Notifications', 'Room Management'].map(f => (
              <span key={f} style={{
                padding: '5px 12px', background: 'rgba(255,255,255,0.08)',
                borderRadius: 20, fontSize: 11, color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.12)', fontWeight: 500,
              }}>{f}</span>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          © 2026 Smart Campus. All rights reserved.
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={S.right}>
        <div style={S.card}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f5a623', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              Student & Staff Portal
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>Sign in to your account</h1>
            <p style={{ fontSize: 13, color: '#8896a4', margin: 0 }}>Use your university credentials or SSO</p>
          </div>

          {/* OAuth */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            <OAuthBtn icon={<MicrosoftIcon />} label="Continue with Microsoft" href="http://localhost:8080/oauth2/authorization/microsoft" />
            <OAuthBtn icon={<GoogleIcon />} label="Continue with Google" href="http://localhost:8080/oauth2/authorization/google" />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: '#e8ecf0' }} />
            <span style={{ fontSize: 11, color: '#b0bcca', fontWeight: 600, letterSpacing: 0.5 }}>OR SIGN IN WITH EMAIL</span>
            <div style={{ flex: 1, height: 1, background: '#e8ecf0' }} />
          </div>

          {/* Form */}
          <Form form={form} name="login" onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item name="email" style={{ marginBottom: 14 }}
              rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}>
              <Input prefix={<MailOutlined style={{ color: '#9aaab8' }} />}
                placeholder="Email address"
                style={{ height: 44, borderRadius: 7, borderColor: '#e0e5ec' }}
              />
            </Form.Item>

            <Form.Item name="password" style={{ marginBottom: 8 }}
              rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password prefix={<LockOutlined style={{ color: '#9aaab8' }} />}
                placeholder="Password"
                style={{ height: 44, borderRadius: 7, borderColor: '#e0e5ec' }}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Checkbox checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                style={{ fontSize: 13, color: '#555' }}>
                Remember me
              </Checkbox>
              <Link to="/forgot-password" style={{ fontSize: 13, color: '#0f3460', fontWeight: 600, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary" htmlType="submit" loading={loading} block
                style={{
                  height: 46, borderRadius: 7, fontWeight: 700, fontSize: 14,
                  background: '#0f3460', borderColor: '#0f3460',
                  boxShadow: '0 4px 14px rgba(15,52,96,0.3)',
                }}
              >
                Sign in
              </Button>
            </Form.Item>
          </Form>

          {/* Register link */}
          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f3f7' }}>
            <span style={{ fontSize: 13, color: '#8896a4' }}>Don't have an account? </span>
            <Link to="/register" style={{ fontSize: 13, fontWeight: 700, color: '#f5a623', textDecoration: 'none' }}>
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
