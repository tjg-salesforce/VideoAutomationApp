import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const apiEndpoints = {
  // Health check
  health: () => api.get('/health'),
  
  // Templates
  getTemplates: () => api.get('/api/templates'),
  getTemplate: (id: string) => api.get(`/api/templates/${id}`),
  createTemplate: (data: any) => api.post('/api/templates', data),
  updateTemplate: (id: string, data: any) => api.put(`/api/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/api/templates/${id}`),
  
  // Components
  getComponents: () => api.get('/api/components'),
  getComponent: (id: string) => api.get(`/api/components/${id}`),
  createComponent: (data: any) => api.post('/api/components', data),
  updateComponent: (id: string, data: any) => api.put(`/api/components/${id}`, data),
  deleteComponent: (id: string) => api.delete(`/api/components/${id}`),
  
  // Projects
  getProjects: (ownerId: string = 'default-user') => api.get(`/api/projects?ownerId=${ownerId}`),
  getProject: (id: string) => api.get(`/api/projects/${id}`),
  createProject: (data: any) => api.post('/api/projects', { ...data, ownerId: 'default-user' }),
  updateProject: (id: string, data: any) => api.put(`/api/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/api/projects/${id}`),
};

export default api;
