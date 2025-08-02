import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Session is handled by an HTTP-only cookie, so no explicit
    // Authorization header is needed on the client.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Let all 401s be handled by the specific hooks
    // Don't automatically redirect - let React handle navigation
    return Promise.reject(error);
  }
);

export default apiClient;
