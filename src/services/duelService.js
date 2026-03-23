import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/duels` : 'http://localhost:5000/api/duels';

axios.defaults.withCredentials = true;

const getToken = () => localStorage.getItem('token');

const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getDuels = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getDuelHistory = async () => {
  const response = await axios.get(`${API_URL}/history`, { headers: authHeaders() });
  return response.data;
};

export const getDuelById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createDuel = async (topic) => {
  const response = await axios.post(API_URL, { topic }, { headers: authHeaders() });
  return response.data;
};

export const joinDuel = async (id) => {
  const response = await axios.post(`${API_URL}/${id}/join`, {}, { headers: authHeaders() });
  return response.data;
};

export const submitDuelPoint = async (id, text) => {
  const response = await axios.post(`${API_URL}/${id}/points`, { text }, { headers: authHeaders() });
  return response.data;
};

export const castDuelVote = async (id, voteFor) => {
  const response = await axios.post(`${API_URL}/${id}/vote`, { voteFor }, { headers: authHeaders() });
  return response.data;
};
