import api from './axios';

export const knittingAPI = {
  // Stock
  getStock: async (knitterId = null) => {
    const params = new URLSearchParams();
    if (knitterId) params.append('knitterId', knitterId);
    return api.get(`/knitting/stock?${params}`);
  },

  issueYarn: async (data) => {
    return api.post('/knitting/issue', data);
  },

  // Delivery Notes
  getDeliveryNotes: async () => {
    return api.get('/knitting/delivery-notes');
  },

  createDeliveryNote: async (data) => {
    return api.post('/knitting/delivery-note', data);
  },

  // Knitter Programs
  getPrograms: async (knitterId = null) => {
    const params = new URLSearchParams();
    if (knitterId) params.append('knitterId', knitterId);
    return api.get(`/knitting/program?${params}`);
  },

  createProgram: async (data) => {
    return api.post('/knitting/program', data);
  },

  // Grey Fabric Lots
  getGreyFabricLots: async () => {
    return api.get('/knitting/grey-fabric');
  },
};
