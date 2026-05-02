import api from './axios';

export const getDyeings = () =>
  api.get('/dyeing');

export const createDyeingProgram = (data) =>
  api.post('/dyeing/program', data);

export const updateDyeing = (id, data) => api.put(`/dyeing/${id}`, data);
export const deleteDyeing = (id) => api.delete(`/dyeing/${id}`);
