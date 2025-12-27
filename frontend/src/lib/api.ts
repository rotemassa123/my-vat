import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000, // 60 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: include cookies in requests
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      // Note: We don't remove localStorage token since we're using cookies
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 