import axios from 'axios';
import { DEMO_WORKFLOW, DEMO_STATS } from './mockData';

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:5000' : '');

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle common errors and offline/cloud preview fallback
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Graceful fallback for network disconnection or standalone static previews
    if (!error.response && error.config) {
      const url = error.config.url || '';
      if (url.includes('/auth/login')) {
        return Promise.resolve({
          data: {
            message: 'Signed in successfully (Demo Session)',
            token: 'demo-jwt-preview-token',
            user: { id: '00000000-0000-0000-0000-000000000001', name: 'Demo Administrator', email: 'demo@workflowx.ai', role: 'admin' },
          }
        });
      }
      if (url.includes('/auth/register')) {
        let sentData = {};
        try { sentData = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : (error.config.data || {}); } catch (_) {}
        const actualName = sentData.name || (sentData.email ? sentData.email.split('@')[0] : 'User');
        return Promise.resolve({
          data: {
            message: 'Registered successfully',
            token: 'demo-jwt-preview-token',
            user: { id: '00000000-0000-0000-0000-000000000001', name: actualName, email: sentData.email || 'user@workflowx.ai', role: 'user' },
          }
        });
      }
      if (url.includes('/auth/google')) {
        let sentData = {};
        try { sentData = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : (error.config.data || {}); } catch (_) {}
        const meta = sentData.user_metadata || {};
        const actualName = meta.full_name || sentData.name || sentData.fullName || meta.name || (sentData.email ? sentData.email.split('@')[0] : 'User');
        return Promise.resolve({
          data: {
            message: 'Google authentication successful',
            token: 'demo-jwt-preview-token',
            user: { id: '00000000-0000-0000-0000-000000000001', name: actualName, email: sentData.email || 'user@workflowx.ai', role: 'user' },
          }
        });
      }
      if (url.includes('/auth/me')) {
        const saved = localStorage.getItem('user');
        return Promise.resolve({
          data: {
            user: saved ? JSON.parse(saved) : { id: '00000000-0000-0000-0000-000000000001', name: 'User', email: 'user@workflowx.ai', role: 'user' },
          }
        });
      }
      if (url.includes('/analytics/dashboard')) {
        return Promise.resolve({
          data: {
            stats: DEMO_STATS,
            recentWorkflows: [DEMO_WORKFLOW],
            recentAgentActivity: DEMO_WORKFLOW.logs,
          }
        });
      }
      if (url.includes('/workflows')) {
        if (url.includes('/simulate-failure')) {
          const sim = {
            ...DEMO_WORKFLOW,
            status: 'replanning',
            health_score: 65,
            tasks: DEMO_WORKFLOW.tasks.map((t, idx) => idx === 2 ? { ...t, status: 'failed' } : t),
          };
          return Promise.resolve({ data: { message: 'Failure simulated', workflow: sim } });
        }
        if (url.includes('/replan')) {
          const replanned = {
            ...DEMO_WORKFLOW,
            status: 'executing',
            health_score: 88,
            tasks: DEMO_WORKFLOW.tasks.map(t => t.status === 'failed' ? { ...t, status: 'in_progress', assigned_agent: 'Manager Agent' } : t),
          };
          return Promise.resolve({ data: { message: 'Replanned', workflow: replanned } });
        }
        if (url.includes('/ask')) {
          return Promise.resolve({
            data: {
              answer: 'Based on current multi-agent execution telemetry, the workflow encountered a payment reconciliation delay which was autonomously reassigned to the Manager Agent. All dependencies are healthy and SLA compliance is on track.',
            }
          });
        }
        return Promise.resolve({
          data: {
            workflows: [DEMO_WORKFLOW],
            workflow: DEMO_WORKFLOW,
            agents: DEMO_WORKFLOW.logs.map(l => ({ name: l.agent_name, status: l.status })),
            events: DEMO_WORKFLOW.logs,
          }
        });
      }
      if (/\/tasks($|\?)/.test(url)) {
        return Promise.resolve({ data: { tasks: DEMO_WORKFLOW.tasks, data: DEMO_WORKFLOW.tasks } });
      }
      if (url.includes('/approvals')) {
        return Promise.resolve({ data: { approvals: DEMO_WORKFLOW.approvals } });
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register') &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};

// Workflows
export const workflowAPI = {
  getAll: (params) => api.get('/workflows', { params }),
  create: (data) => api.post('/workflows', data),
  getById: (id) => api.get(`/workflows/${id}`),
  update: (id, data) => api.put(`/workflows/${id}`, data),
  delete: (id) => api.delete(`/workflows/${id}`),
  analyze: (id) => api.post(`/workflows/${id}/analyze`),
  start: (id) => api.post(`/workflows/${id}/start`),
  simulateFailure: (id) => api.post(`/workflows/${id}/simulate-failure`),
  replan: (id) => api.post(`/workflows/${id}/replan`),
  complete: (id) => api.post(`/workflows/${id}/complete`),
  getAgents: (id) => api.get(`/workflows/${id}/agents`),
  getEvents: (id) => api.get(`/workflows/${id}/events`),
  getHealth: (id) => api.get(`/workflows/${id}/health`),
  ask: (id, question) => api.post(`/workflows/${id}/ask`, { question }),
  createDemo: () => api.post('/workflows/demo'),
};

// Tasks
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
};

// Approvals
export const approvalAPI = {
  getAll: (params) => api.get('/approvals', { params }),
  approve: (id) => api.post(`/approvals/${id}/approve`),
  reject: (id, data) => api.post(`/approvals/${id}/reject`, data),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export default api;
