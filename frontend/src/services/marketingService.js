import axios from 'axios';

const API_URL = '/api/marketing';

const marketingService = {
  getCarousel: async () => {
    const response = await axios.get(`${API_URL}/carousel`);
    return response.data;
  },

  getTestimonials: async () => {
    const response = await axios.get(`${API_URL}/testimonials`);
    return response.data;
  },

  getNews: async () => {
    const response = await axios.get(`${API_URL}/news`);
    return response.data;
  },

  getEvents: async () => {
    const response = await axios.get(`${API_URL}/events`);
    return response.data;
  },

  createCarousel: async (data) => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.subtitle) formData.append('subtitle', data.subtitle);
    if (data.ctaText) formData.append('ctaText', data.ctaText);
    if (data.ctaLink) formData.append('ctaLink', data.ctaLink);
    if (data.displayOrder) formData.append('displayOrder', data.displayOrder);
    if (data.image) formData.append('image', data.image);

    const response = await axios.post(`${API_URL}/carousel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateCarousel: async (id, data) => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.subtitle) formData.append('subtitle', data.subtitle);
    if (data.ctaText) formData.append('ctaText', data.ctaText);
    if (data.ctaLink) formData.append('ctaLink', data.ctaLink);
    if (data.displayOrder) formData.append('displayOrder', data.displayOrder);
    if (data.image) formData.append('image', data.image);

    const response = await axios.put(`${API_URL}/carousel/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteCarousel: async (id) => {
    await axios.delete(`${API_URL}/carousel/${id}`);
  },

  subscribeNewsletter: async (email) => {
    const response = await axios.post(`${API_URL}/newsletter`, { email });
    return response.data;
  }
};

export default marketingService;