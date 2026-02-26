import api from './api.js';

export const getArguments = async (projectId) => {
  const response = await api.get(`/tasks/${projectId}`);
  return response.data;
};

export const postArgument = async (argumentData) => {
  const response = await api.post('/tasks', argumentData);
  return response.data;
};