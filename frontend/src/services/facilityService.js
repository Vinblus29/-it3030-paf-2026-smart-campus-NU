import axios from 'axios';

const API_URL = '/api/facilities';

const facilityService = {
  getAllFacilities: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  getFacilityById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  createFacility: async (facilityData, image) => {
    const formData = new FormData();
    formData.append('facility', JSON.stringify(facilityData));
    if (image) {
      formData.append('image', image);
    }
    const response = await axios.post(API_URL, formData);
    return response.data;
  },

  updateFacility: async (id, facilityData, image) => {
    const formData = new FormData();
    formData.append('facility', JSON.stringify(facilityData));
    if (image) {
      formData.append('image', image);
    }
    const response = await axios.put(`${API_URL}/${id}`, formData);
    return response.data;
  },

  deleteFacility: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  getAvailableFacilities: async (date, startTime, endTime) => {
    const response = await axios.get(`${API_URL}/available`, {
      params: { date, startTime, endTime }
    });
    return response.data;
  },

  searchFacilities: async (query) => {
    const response = await axios.get(`${API_URL}/search`, {
      params: { q: query }
    });
    return response.data;
  },

  getFacilitiesByCategory: async (category) => {
    const response = await axios.get(`${API_URL}/category/${category}`);
    return response.data;
  },

  uploadFacilityImage: async (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await axios.post(`${API_URL}/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getFacilityAvailability: async (id, date) => {
    const response = await axios.get(`${API_URL}/${id}/availability`, {
      params: { date }
    });
    return response.data;
  },

  getFacilityQRCodeUrl: (id) => {
    return `${API_URL}/${id}/qr`;
  },

  getFacilitiesByTags: async (tags) => {
    const response = await axios.get(`${API_URL}/tags`, {
      params: { tags: tags.join(',') }
    });
    return response.data;
  }
};

export default facilityService;

