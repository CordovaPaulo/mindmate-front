import axios, { AxiosInstance } from 'axios';

const API_HOST = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const BASE_URL = API_HOST; 

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try { localStorage.removeItem('token'); } catch {}
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

export function setAuthToken(token: string) { try { localStorage.setItem('token', token); } catch {} }
export function clearAuthToken() { try { localStorage.removeItem('token'); } catch {} }

export default api;