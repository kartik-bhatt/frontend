
import axios from 'axios';

// Use environment variables if available or fallback to localhost
const API_BASE_URL = 'http://10.226.50.201:8080';

// Define DEBUG variable - this is needed for conditional logging
const DEBUG = process.env.NODE_ENV !== 'production';

// Create axios instance with timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Attach JWT token to every request if present
apiClient.interceptors.request.use(
    (config) => {
      if (DEBUG) console.log(`🚀 Request: ${config.method.toUpperCase()} ${config.url}`);
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      if (DEBUG) console.error('❌ Request error:', error);
      return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => {
      if (DEBUG) console.log(`✅ Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.status);
      return response;
    },
    async (error) => {
      // Enhanced error logging
      if (DEBUG) {
        console.error('❌ Response error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          message: error.message
        });
      }

      // Network errors (server not available)
      if (error.code === 'ERR_NETWORK') {
        console.error(`Network error: Could not connect to ${API_BASE_URL}. Please check if the server is running.`);
        return Promise.reject({
          ...error,
          userMessage: `Cannot connect to the server. Please ensure it's running and accessible.`
        });
      }

      const originalRequest = error.config;

      // If error is 401 and we haven't already tried to refresh
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token available, logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login'; // Redirect to login
          return Promise.reject(error);
        }

        try {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
            refreshToken: refreshToken
          });

          // Save the new access token
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Update the authorization header and retry
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Handle other common status codes
      if (error.response) {
        switch (error.response.status) {
          case 403:
            return Promise.reject({
              ...error,
              userMessage: 'You do not have permission to access this resource.'
            });
          case 404:
            return Promise.reject({
              ...error,
              userMessage: 'The requested resource was not found.'
            });
          case 500:
            return Promise.reject({
              ...error,
              userMessage: 'Server error. Please try again later or contact support.'
            });
          default:
            return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
);

// Helper function to build query parameters (from svnService)
const buildQueryParams = (filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => queryParams.append(key, item));
    } else if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  return queryParams.toString() ? `?${queryParams.toString()}` : '';
};

// Dashboard API
const dashboardApi = {
  getSummary: () => apiClient.get('/api/git/dashboard/summary'),
};

// User Management API
const userApi = {
  getAllUsers: () => apiClient.get('/api/git/users'),
  getUserById: (id) => apiClient.get(`/api/git/users/${id}`),
  getUserRoleCounts: () => apiClient.get('/api/git/users/roles'),
  createUser: (userData) => apiClient.post('/api/git/users', userData),
  updateUser: (id, userData) => apiClient.put(`/api/git/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/api/git/users/${id}`),
};

// Repository Management API
const repositoryApi = {
  getAllRepositories: () => apiClient.get('/api/git/repositories'),
  getRepositoryById: (id) => apiClient.get(`/api/git/repositories/${id}`),
  searchRepositories: (query) => apiClient.get(`/api/git/repositories/search?query=${query}`),
  getRepositoryDepartmentCounts: () => apiClient.get('/api/git/repositories/departments'),
  createRepository: (repoData) => apiClient.post('/api/git/repositories', repoData),
  updateRepository: (id, repoData) => apiClient.put(`/api/git/repositories/${id}`, repoData),
  deleteRepository: (id) => apiClient.delete(`/api/git/repositories/${id}`),
};

// Backup Management API
const backupApi = {
  getAllBackups: () => apiClient.get('/api/git/backups'),
  getBackupById: (id) => apiClient.get(`/api/git/backups/${id}`),
  getBackupByRepositoryId: (repoId) => apiClient.get(`/api/git/backups/repository/${repoId}`),
  getBackupsByStatus: (status) => apiClient.get(`/api/git/backups/status/${status}`),
  getBackupStatusCounts: () => apiClient.get('/api/git/backups/count'),
  createBackup: (backupData) => apiClient.post('/api/git/backups', backupData),
  updateBackup: (id, backupData) => apiClient.put(`/api/git/backups/${id}`, backupData),
  runBackup: (repositoryId) => apiClient.post(`/api/git/backups/run/${repositoryId}`),
};

// Export all APIs
export {
  apiClient, // Export the base client for custom calls
  dashboardApi,
  userApi,
  repositoryApi,
  backupApi,
};
 