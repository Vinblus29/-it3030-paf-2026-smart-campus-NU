import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import axios from 'axios';

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const role = searchParams.get('role');
    const error = searchParams.get('error');

    if (error) {
      message.error('OAuth login failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token && userId && email) {
      // Store token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiry', Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Create user object
      const user = {
        id: userId,
        email,
        firstName,
        lastName,
        role,
        enabled: true
      };

      localStorage.setItem('user', JSON.stringify(user));

      message.success('Welcome! You have successfully signed in.');
      navigate('/dashboard');
    } else {
      message.error('Invalid OAuth callback. Please try again.');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default OAuth2Callback;

