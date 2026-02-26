import api from './api.js';

export const getProjects = async (params = {}) => {
  const response = await api.get('/projects', { params });
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const voteProject = async (projectId, voteType) => {
  const response = await api.post(`/projects/${projectId}/vote`, { voteType });
  return response.data;
};