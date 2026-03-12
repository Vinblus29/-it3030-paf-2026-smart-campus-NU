import axios from 'axios';

const API_URL = '/api/tickets';

const ticketService = {
  getAllTickets: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  getTicketById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  createTicket: async (ticketData) => {
    const response = await axios.post(API_URL, ticketData);
    return response.data;
  },

  updateTicket: async (id, ticketData) => {
    const response = await axios.put(`${API_URL}/${id}`, ticketData);
    return response.data;
  },

  deleteTicket: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  assignTicket: async (ticketId, technicianId) => {
    const response = await axios.put(`${API_URL}/${ticketId}/assign`, { technicianId });
    return response.data;
  },

  updateTicketStatus: async (ticketId, status) => {
    const response = await axios.put(`${API_URL}/${ticketId}/status`, { status });
    return response.data;
  },

  updateTicketPriority: async (ticketId, priority) => {
    const response = await axios.put(`${API_URL}/${ticketId}/priority`, { priority });
    return response.data;
  },

  getMyTickets: async () => {
    const response = await axios.get(`${API_URL}/my-tickets`);
    return response.data;
  },

  getAssignedTickets: async () => {
    const response = await axios.get(`${API_URL}/assigned`);
    return response.data;
  },

  getTicketsByStatus: async (status) => {
    const response = await axios.get(`${API_URL}/status/${status}`);
    return response.data;
  },

  getTicketsByPriority: async (priority) => {
    const response = await axios.get(`${API_URL}/priority/${priority}`);
    return response.data;
  },

  getPendingTickets: async () => {
    const response = await axios.get(`${API_URL}/pending`);
    return response.data;
  },

  addComment: async (ticketId, comment) => {
    const response = await axios.post(`${API_URL}/${ticketId}/comments`, { comment });
    return response.data;
  },

  getComments: async (ticketId) => {
    const response = await axios.get(`${API_URL}/${ticketId}/comments`);
    return response.data;
  },

  uploadAttachment: async (ticketId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/${ticketId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // New Phase 1 endpoints
  getTicketsByCategory: async (category) => {
    const response = await axios.get(`${API_URL}/category/${category}`);
    return response.data;
  },

  uploadImage: async (ticketId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await axios.post(`${API_URL}/${ticketId}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default ticketService;

