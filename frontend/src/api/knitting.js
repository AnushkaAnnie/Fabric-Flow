import api from './axios';

export const getKnitterStock = (knitterId) =>
  api.get('/knitting/stock', { params: { knitterId } });

export const issueYarnToKnitter = (data) =>
  api.post('/knitting/issue', data);

export const getDeliveryNotes = () =>
  api.get('/knitting/delivery-notes');

export const createDeliveryNote = (data) =>
  api.post('/knitting/delivery-note', data);

export const getKnitterPrograms = (knitterId) =>
  api.get('/knitting/program', { params: { knitterId } });

export const createKnitterProgram = (data) =>
  api.post('/knitting/program', data);

export const getGreyFabricAvailable = (knitterId) =>
  api.get('/knitting/grey-fabric', {
    params: knitterId ? { knitterId } : undefined,
  });
