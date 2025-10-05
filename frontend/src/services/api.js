import axios from 'axios';

// Get the API URL from environment variables or use the default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the full URL for debugging
    console.log('Full request URL:', API_BASE_URL + config.url);
    console.log('Request headers:', config.headers);
    console.log('Making request to:', config.url, 'with method:', config.method);
    if (config.data) {
      console.log('Request data:', config.data);
    }
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  response => {
    console.log('Response received from:', response.config.url, 'with status:', response.status);
    return response;
  },
  error => {
    console.error('Response error:', error);
    
    // Log detailed error information
    if (error.response) {
      console.log('Error response data:', JSON.stringify(error.response.data, null, 2));
      console.log('Error response status:', error.response.status);
      console.log('Error response headers:', error.response.headers);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;