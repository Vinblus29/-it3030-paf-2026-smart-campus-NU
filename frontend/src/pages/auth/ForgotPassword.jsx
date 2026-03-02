import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import authService from '../../services/authService';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.forgotPassword(values.email);
      setSuccess(true);
      message.success('Password reset link sent to your email!');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 mb-6">
              <CheckCircleOutlined className="text-3xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 mb-6">
              We have sent a password reset link to your email address. Please check your inbox and follow the instructions.
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <ArrowLeftOutlined />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
            <p className="text-gray-500">Enter your email to reset your password.</p>
          </div>

          {/* Form */}
          <Form
            form={form}
            name="forgot-password"
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

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                className="h-12 bg-gray-900 hover:bg-gray-800 border-none font-medium"
              >
                Send Reset Link
              </Button>
            </Form.Item>
          </Form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
              <ArrowLeftOutlined />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

