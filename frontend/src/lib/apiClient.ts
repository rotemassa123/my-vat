import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useOperatorAccountContextStore } from '../store/operatorAccountContextStore';

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
    
    // If operator has selected an account, add x-account-id header
    const selectedAccountId = useOperatorAccountContextStore.getState().selectedAccountId;
    if (selectedAccountId) {
      config.headers['x-account-id'] = selectedAccountId;
    }
    
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
