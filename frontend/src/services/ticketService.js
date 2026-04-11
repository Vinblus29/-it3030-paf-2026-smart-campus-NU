import axios from 'axios';

const API_URL = '/api/tickets';

const ALLOWED_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

const ticketService = {
  getAllTickets: () => axios.get(API_URL).then(r => r.data),

  getStats: () => axios.get(`${API_URL}/stats`).then(r => r.data),

  searchTickets: (params) => axios.get(`${API_URL}/search`, { params }).then(r => r.data),

  getTicketById: (id) => {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw new Error(`Invalid ticket id: ${id}`);
    return axios.get(`${API_URL}/${id}`).then(r => r.data);
  },

  getMyTickets: () => axios.get(`${API_URL}/my-tickets`).then(r => r.data),

  getAssignedTickets: () => axios.get(`${API_URL}/assigned`).then(r => r.data),

  getTicketsByStatus: (status) => {
    if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
    return axios.get(`${API_URL}/status/${status}`).then(r => r.data);
  },

  getTechnicians: () => axios.get(`${API_URL}/technicians`).then(r => r.data),

  createTicket: (ticketData, images = []) => {
    const formData = new FormData();
    formData.append('ticket', new Blob([JSON.stringify(ticketData)], { type: 'application/json' }));
    images.forEach(img => formData.append('images', img));
    return axios.post(API_URL, formData).then(r => r.data);
  },

  updatePriority: (id, priority) => {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw new Error(`Invalid ticket id: ${id}`);
    return axios.put(`${API_URL}/${id}/priority`, { priority }).then(r => r.data);
  },

  updateStatus: (id, payload) => {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw new Error(`Invalid ticket id: ${id}`);
    return axios.put(`${API_URL}/${id}/status`, payload).then(r => r.data);
  },

  assignTicket: (id, assigneeId) => {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw new Error(`Invalid ticket id: ${id}`);
    return axios.put(`${API_URL}/${id}/assign`, { assigneeId }).then(r => r.data);
  },

  deleteTicket: (id) => {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw new Error(`Invalid ticket id: ${id}`);
    return axios.delete(`${API_URL}/${id}`);
  },

  getComments: (ticketId) => {
    if (!Number.isInteger(Number(ticketId)) || Number(ticketId) <= 0) throw new Error(`Invalid ticket id: ${ticketId}`);
    return axios.get(`${API_URL}/${ticketId}/comments`).then(r => r.data);
  },

  addComment: (ticketId, content) => {
    if (!Number.isInteger(Number(ticketId)) || Number(ticketId) <= 0) throw new Error(`Invalid ticket id: ${ticketId}`);
    return axios.post(`${API_URL}/${ticketId}/comments`, { content }).then(r => r.data);
  },

  editComment: (ticketId, commentId, content) => {
    if (!Number.isInteger(Number(ticketId)) || Number(ticketId) <= 0) throw new Error(`Invalid ticket id: ${ticketId}`);
    if (!Number.isInteger(Number(commentId)) || Number(commentId) <= 0) throw new Error(`Invalid comment id: ${commentId}`);
    return axios.put(`${API_URL}/${ticketId}/comments/${commentId}`, { content }).then(r => r.data);
  },

  deleteComment: (ticketId, commentId) => {
    if (!Number.isInteger(Number(ticketId)) || Number(ticketId) <= 0) throw new Error(`Invalid ticket id: ${ticketId}`);
    if (!Number.isInteger(Number(commentId)) || Number(commentId) <= 0) throw new Error(`Invalid comment id: ${commentId}`);
    return axios.delete(`${API_URL}/${ticketId}/comments/${commentId}`);
  },
};

export default ticketService;

