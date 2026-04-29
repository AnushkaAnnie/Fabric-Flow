import api from './axios';

export const dyeingAPI = {
  // Get dyeing records (legacy)
  getDyeing: async (page = 1, limit = 50, search = '') => {
    return api.get(`/dyeing?page=${page}&limit=${limit}&search=${search}`);
  },

  // New dyeing program
  createProgram: async (data) => {
    return api.post('/dyeing/program', data);
  },
};
