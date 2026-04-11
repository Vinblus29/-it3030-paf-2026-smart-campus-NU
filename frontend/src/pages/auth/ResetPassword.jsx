import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h2>
            <p className="text-gray-500 mb-6">
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
            >
              Go to Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex-col justify-between p-12">
        <div>
          <img 
            src="/southwestern-campus-logo.png" 
            alt="Southwestern Campus Logo" 
            style={{
              height: 45,
              objectFit: 'contain'
            }}
          />
        </div>
        
        <div className="text-white/80">
          <h2 className="text-4xl font-bold text-white mb-4">New Password</h2>
          <p className="text-lg text-white/70">Create a strong password to secure your account.</p>
        </div>

        <div className="text-white/60 text-sm">
          © 2026 Smart Campus. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">Smart Campus</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h1>
            <p className="text-gray-500 mb-8">Enter your new password below</p>

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
                  placeholder="New password" 
                  className="h-12"
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
                  placeholder="Confirm new password" 
                  className="h-12"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                  className="h-12 bg-blue-600 hover:bg-blue-700 border-none font-medium"
                  style={{ borderRadius: 6 }}
                >
                  Reset password
                </Button>
              </Form.Item>
            </Form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
