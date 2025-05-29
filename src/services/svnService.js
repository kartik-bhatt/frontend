import axios from 'axios';

// Use environment variables if available or fallback to localhost
const API_BASE_URL = 'http://10.226.50.201:8080';

// Define DEBUG variable - this is needed for conditional logging
const DEBUG = process.env.NODE_ENV !== 'production';
// Alternatively, you could just set it to a boolean value:
// const DEBUG = true; // Enable debug logs
// const DEBUG = false; // Disable debug logs

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


// Helper function to build query parameters
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

// Users API
export const userApi = {
  getAll: (filters = {}) => {
    const query = buildQueryParams(filters);
    return apiClient.get(`/api/svn/users${query}`);
  },
  
  getById: (id) => apiClient.get(`/api/svn/users/${id}`),
  
  create: (userData) => apiClient.post('/api/svn/users', userData),
  
  update: (id, userData) => apiClient.put(`/api/svn/users/${id}`, userData),
  
  delete: (id) => apiClient.delete(`/api/svn/users/${id}`),
  
  updateStatus: (id, status) => apiClient.patch(`/api/svn/users/${id}/status?status=${status}`)
};

// Repositories API
export const repositoryApi = {
  getAll: (filters = {}) => {
    const query = buildQueryParams(filters);
    return apiClient.get(`/api/svn/repositories${query}`);
  },
  
  getById: (id) => apiClient.get(`/api/svn/repositories/${id}`),
  
  create: (repoData, memberIds = []) => {
    const query = buildQueryParams({ memberIds });
    return apiClient.post(`/api/svn/repositories${query}`, repoData);
  },
  
  update: (id, repoData, memberIds = []) => {
    const query = buildQueryParams({ memberIds });
    return apiClient.put(`/api/svn/repositories/${id}${query}`, repoData);
  },
  
  delete: (id) => apiClient.delete(`/api/svn/repositories/${id}`),
  
  updateMembers: (id, memberIds) => apiClient.put(`/api/svn/repositories/${id}/members`, memberIds),
  
  updateMigrationStatus: (id, status, progress = null) => {
    const params = { status };
    if (progress !== null) params.progress = progress;
    return apiClient.patch(`/api/svn/repositories/${id}/migration-status`, null, { params });
  }
};

// Git Migration API
export const migrationApi = {
  getAll: (filters = {}) => {
    const query = buildQueryParams(filters);
    return apiClient.get(`/api/svn/migrations${query}`);
  },
  
  getById: (id) => apiClient.get(`/api/svn/migrations/${id}`),
  
  create: (migrationData, repositoryId = null) => {
    const params = repositoryId ? { repositoryId } : {};
    return apiClient.post('/api/svn/migrations', migrationData, { params });
  },
  
  update: (id, migrationData) => apiClient.put(`/api/svn/migrations/${id}`, migrationData),
  
  delete: (id) => apiClient.delete(`/api/svn/migrations/${id}`),
  
  start: (id) => apiClient.post(`/api/svn/migrations/${id}/start`),
  
  pause: (id) => apiClient.post(`/api/svn/migrations/${id}/pause`),
  
  complete: (id) => apiClient.post(`/api/svn/migrations/${id}/complete`),
  
  retry: (id) => apiClient.post(`/api/svn/migrations/${id}/retry`)
};

// Backup API
export const backupApi = {
  getAll: (filters = {}) => {
    const query = buildQueryParams(filters);
    return apiClient.get(`/api/svn/backups${query}`);
  },
  
  getById: (id) => apiClient.get(`/api/svn/backups/${id}`),
  
  getByBackupId: (backupId) => apiClient.get(`/api/svn/backups/backup-id/${backupId}`),
  
  getLastFullBackup: () => apiClient.get('/api/svn/backups/last-full'),
  
  create: (backupData, repositoryIds = []) => {
    const query = buildQueryParams({ repositoryIds });
    return apiClient.post(`/api/svn/backups${query}`, backupData);
  },
  
  delete: (id) => apiClient.delete(`/api/svn/backups/${id}`),
  
  retry: (id) => apiClient.post(`/api/svn/backups/${id}/retry`),
  
  getStatistics: () => apiClient.get('/api/svn/backups/statistics')
};

// Backup Schedule API
export const scheduleApi = {
  getAll: (filters = {}) => {
    const query = buildQueryParams(filters);
    return apiClient.get(`/api/svn/backup-schedules${query}`);
  },
  
  getById: (id) => apiClient.get(`/api/svn/backup-schedules/${id}`),
  
  getByScheduleId: (scheduleId) => apiClient.get(`/api/svn/backup-schedules/schedule-id/${scheduleId}`),
  
  getNextScheduled: () => apiClient.get('/api/svn/backup-schedules/next'),
  
  create: (scheduleData, repositoryIds = []) => {
    const query = buildQueryParams({ repositoryIds });
    return apiClient.post(`/api/svn/backup-schedules${query}`, scheduleData);
  },
  
  update: (id, scheduleData, repositoryIds = []) => {
    const query = buildQueryParams({ repositoryIds });
    return apiClient.put(`/api/svn/backup-schedules/${id}${query}`, scheduleData);
  },
  
  delete: (id) => apiClient.delete(`/api/svn/backup-schedules/${id}`),
  
  toggleStatus: (id) => apiClient.post(`/api/svn/backup-schedules/${id}/toggle-status`)
};

// Dashboard API
export const dashboardApi = {
  getMetrics: () => apiClient.get('/api/svn/dashboard/metrics'),
  
  getRecentActivity: () => apiClient.get('/api/svn/dashboard/recent-activity'),
  
  getMigrationProgress: () => apiClient.get('/api/svn/dashboard/migration-progress'),
  
  getBackupSummary: () => apiClient.get('/api/svn/dashboard/backup-summary')
};





