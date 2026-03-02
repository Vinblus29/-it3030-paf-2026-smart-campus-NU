import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Divider, Card } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, GoogleOutlined, IdcardOutlined } from '@ant-design/icons';
import axios from 'axios';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phone,
        studentId: values.studentId
      });
      message.success('Registration successful! Your account is pending approval by admin.');
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.message || 'Registration failed. Please try again.');
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
              <UserOutlined className="text-3xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-500">Join Smart Campus today!</p>
          </div>

          {/* Register Form */}
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="firstName"
                rules={[{ required: true, message: 'First name is required' }]}
              >
                <Input 
                  prefix={<UserOutlined className="text-gray-400" />} 
                  placeholder="First name" 
                />
              </Form.Item>

              <Form.Item
                name="lastName"
                rules={[{ required: true, message: 'Last name is required' }]}
              >
                <Input 
                  prefix={<UserOutlined className="text-gray-400" />} 
                  placeholder="Last name" 
                />
              </Form.Item>
            </div>

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
              name="phone"
              rules={[{ required: true, message: 'Please enter your phone number' }]}
            >
              <Input 
                prefix={<PhoneOutlined className="text-gray-400" />} 
                placeholder="Phone number" 
              />
            </Form.Item>

            <Form.Item name="studentId">
              <Input 
                prefix={<IdcardOutlined className="text-gray-400" />} 
                placeholder="Student/Employee ID (Optional)" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter a password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="Password" 
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="Confirm password" 
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                className="h-12 bg-gray-900 hover:bg-gray-800 border-none font-medium"
                style={{ borderRadius: 8 }}
              >
                Create Account
              </Button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <Divider plain className="text-gray-400">
            or continue with
          </Divider>

          {/* Social Login */}
          <Button
            icon={<GoogleOutlined />}
            block
            className="h-12 flex items-center justify-center gap-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            style={{ borderRadius: 8 }}
          >
            <span className="text-gray-700">Sign up with Google</span>
          </Button>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;

