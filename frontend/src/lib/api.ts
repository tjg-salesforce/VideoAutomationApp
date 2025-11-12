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
  getTemplates: (lightweight: boolean = true) => api.get(`/api/templates?lightweight=${lightweight}`),
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
  getProjects: (ownerId: string = 'default-user', folderId?: string | null, lightweight: boolean = true) => {
    const params = new URLSearchParams({ ownerId, lightweight: lightweight.toString() });
    if (folderId !== undefined) {
      params.append('folderId', folderId === null ? 'null' : folderId);
    }
    return api.get(`/api/projects?${params.toString()}`);
  },
  getProject: (id: string) => api.get(`/api/projects/${id}`),
  createProject: (data: any) => api.post('/api/projects', { ...data, ownerId: 'default-user' }),
  updateProject: (id: string, data: any) => api.put(`/api/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/api/projects/${id}`),
  moveProject: (id: string, folderId: string | null) => api.patch(`/api/projects/${id}/move`, { folderId }),
  
  // Folders
  getFolders: (ownerId: string = 'default-user', tree: boolean = false) => 
    api.get(`/api/folders?ownerId=${ownerId}&tree=${tree}`),
  getFolder: (id: string) => api.get(`/api/folders/${id}`),
  createFolder: (data: any) => api.post('/api/folders', { ...data, ownerId: 'default-user' }),
  updateFolder: (id: string, data: any) => api.put(`/api/folders/${id}`, data),
  deleteFolder: (id: string, cascadeToParent: boolean = true) => 
    api.delete(`/api/folders/${id}?cascadeToParent=${cascadeToParent}`),
  moveFolder: (id: string, parentId: string | null) => api.patch(`/api/folders/${id}/move`, { parentId }),
};

export default api;
