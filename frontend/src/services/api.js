import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

export const predictFailure = (data) => API.post('/predict/failure', data);
export const predictRUL = (data) => API.post('/predict/rul', data);
export const runSimulation = (data) => API.post('/simulate', data);
export const getMachines = () => API.get('/machines');
export const getMachineDetails = (id) => API.get(`/machines/${id}`);
export const getPredictions = () => API.get('/predictions');
export const getScenarios = () => API.get('/scenarios');
export const getMaintenance = () => API.get('/maintenance');
export const getMetrics = () => API.get('/metrics');
export const getHealth = () => API.get('/health');
export const runVisualInspection = (data) => API.post('/inspect/visual', data);
export const explainPrediction = (data) => API.post('/explain', data);

export default API;
