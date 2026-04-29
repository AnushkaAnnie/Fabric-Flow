import api from './axios';

export const getKnitters = () => api.get('/master/knitter-names');
export const getYarns = () => api.get('/yarn/list/hf-codes');
export const getDyers = () => api.get('/master/dyer-names');
export const getColours = () => api.get('/master/colours');
