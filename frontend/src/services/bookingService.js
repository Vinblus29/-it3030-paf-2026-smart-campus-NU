import axios from 'axios'; 

const API_URL = '/api/bookings'; 

const bookingService = { 
  getAllBookings: async () => { 
    const response = await axios.get(API_URL); 
    return response.data; 
  }, 

  getBookingById: async (id) => { 
    const response = await axios.get(`${API_URL}/${id}`); 
    return response.data; 
  }, 

  createBooking: async (bookingData) => { 
    const response = await axios.post(API_URL, bookingData); 
    return response.data; 
  }, 

  updateBooking: async (id, bookingData) => { 
    const response = await axios.put(`${API_URL}/${id}`, bookingData); 
    return response.data; 
  }, 

  cancelBooking: async (id) => { 
    const response = await axios.put(`${API_URL}/${id}/cancel`); 
    return response.data;  
  }, 

  approveBooking: async (id) => { 
    const response = await axios.put(`${API_URL}/${id}/approve`); 
    return response.data; 
  }, 

  rejectBooking: async (id, reason) => { 
    const response = await axios.put(`${API_URL}/${id}/reject`, null, { 
      params: { reason } 
    }); 
    return response.data; 
  }, 

  getMyBookings: async () => { 
    const response = await axios.get(`${API_URL}/my-bookings`); 
    return response.data; 
  }, 

  getBookingsByFacility: async (facilityId) => { 
    const response = await axios.get(`${API_URL}/facility/${facilityId}`); 
    return response.data; 
  }, 

  getBookingsByDate: async (date) => { 
    const response = await axios.get(`${API_URL}/date/${date}`); 
    return response.data; 
  }, 

  getBookingsByStatus: async (status) => { 
    const response = await axios.get(`${API_URL}/status/${status}`); 
    return response.data; 
  }, 

  getPendingBookings: async () => { 
    const response = await axios.get(`${API_URL}/pending`); 
    return response.data; 
  }, 

  getUpcomingBookings: async () => { 
    const response = await axios.get(`${API_URL}/upcoming`); 
    return response.data; 
  },

  getBookingQR: async (id) => {
    const response = await axios.get(`${API_URL}/${id}/qr`);
    return response.data;
  },

  checkInBooking: async (id) => {
    const response = await axios.put(`${API_URL}/${id}/check-in`);
    return response.data;
  },

  // Bug #7 Fix: Token-based check-in using UUID token from QR code
  checkInByToken: async (token) => {
    const response = await axios.post(`${API_URL}/check-in/token`, null, {
      params: { token }
    });
    return response.data;
  }
}; 

export default bookingService; 

