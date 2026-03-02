import axios from 'axios';

const API_URL = '/api';

const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  },

  getCurrentUser: async () => {
    const response = await axios.get(`${API_URL}/auth/me`);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await axios.post(`${API_URL}/auth/reset-password`, {
      token,
      newPassword
    });
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await axios.put(`${API_URL}/auth/profile`, userData);
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await axios.post(`${API_URL}/auth/change-password`, {
      oldPassword,
      newPassword
    });
    return response.data;
  }
};

export default authService;

