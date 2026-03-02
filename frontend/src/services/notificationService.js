import axios from 'axios';

const API_URL = '/api/notifications';

const notificationService = {
  getAllNotifications: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  getUnreadNotifications: async () => {
    const response = await axios.get(`${API_URL}/unread`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await axios.get(`${API_URL}/unread-count`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await axios.put(`${API_URL}/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await axios.put(`${API_URL}/mark-all-read`);
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  deleteAllNotifications: async () => {
    const response = await axios.delete(`${API_URL}/delete-all`);
    return response.data;
  },

  getNotificationsByType: async (type) => {
    const response = await axios.get(`${API_URL}/type/${type}`);
    return response.data;
  },

  subscribeToNotifications: async () => {
    const response = await axios.post(`${API_URL}/subscribe`);
    return response.data;
  }
};

export default notificationService;

