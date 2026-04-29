import api from './axios';

export const getDyeings = () =>
  api.get('/dyeing');

export const createDyeingProgram = (data) =>
  api.post('/dyeing/program', data);
