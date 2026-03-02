import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Card } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const user = await login(values.email, values.password);
      message.success('Welcome back!');
      
      // Redirect based on role
      if (user.role === 'ADMIN') {
        navigate('/dashboard');
      } else if (user.role === 'TECHNICIAN') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Login failed';
      
      // Check if it's an approval pending error
      if (errorMsg.includes('pending approval') || errorMsg.includes('pending')) {
        message.warning('Your account is pending approval. Please contact admin.');
      } else {
        message.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0" style={{ borderRadius: 16 }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <SafetyOutlined className="text-3xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Sign in to Smart Campus</p>
          </div>

          {/* Login Form */}
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<MailOutlined className="text-gray-400" />} 
                placeholder="Email address" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="Password" 
              />
            </Form.Item>

            <div className="flex justify-end mb-4">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                className="h-12 bg-gray-900 hover:bg-gray-800 border-none font-medium"
                style={{ borderRadius: 8 }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                Register here
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</p>
            <p className="text-xs text-blue-600">Admin: admin@smartuni.com / admin123</p>
            <p className="text-xs text-blue-600">Technician: technician@smartuni.com / tech123</p>
            <p className="text-xs text-blue-600">User: user@smartuni.com / user123</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;

