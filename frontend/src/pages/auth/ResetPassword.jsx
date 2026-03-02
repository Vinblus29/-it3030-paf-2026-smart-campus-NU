import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import authService from '../../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, values.newPassword);
      setSuccess(true);
      message.success('Password reset successful!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reset password. The token may have expired.');
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h2>
            <p className="text-gray-500 mb-6">
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Login
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-500">Enter your new password below.</p>
          </div>

          {/* Form */}
          <Form
            form={form}
            name="reset-password"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: 'Please enter a password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="New password" 
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="Confirm new password" 
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
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

