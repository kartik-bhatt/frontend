import axios from 'axios';

const API_URL = 'http://172.31.90.11:8083';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token available, logout
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
          refreshToken: refreshToken
        });
        
        // Save the new access token
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Update the authorization header and retry
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
const api = {
  // Auth endpoints
  login: async (username, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        username,
        password
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/api/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  refreshToken: async (refreshToken) => {
    try {
      const response = await axiosInstance.post('/api/auth/refresh-token', {
        refreshToken
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  logout: async (refreshToken) => {
    try {
      const response = await axiosInstance.post('/api/auth/logout', {
        refreshToken
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  validateToken: async (token) => {
    try {
      const response = await axiosInstance.post('/api/auth/validate', {
        token
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  // User endpoints
  getUsers: async () => {
    try {
      const response = await axiosInstance.get('/api/users');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getUserById: async (id) => {
    try {
      const response = await axiosInstance.get(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  updateUser: async (id, userData) => {
    try {
      const response = await axiosInstance.put(`/api/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Superset-related endpoints
  getSupersetConfig: async () => {
    try {
      const response = await fetch('/api/superset/config', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Superset config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Superset config:', error);
      throw error;
    }
  },

  getSupersetToken: async (dashboardId, accessToken) => {
    try {
      const response = await fetch(`/api/v1/dashboard/token/${dashboardId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Superset token: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Superset token:', error);
      throw error;
    }
  },

  getSupersetTokenWithRls: async (dashboardId, rlsFilters, accessToken) => {
    try {
      const response = await fetch(`/api/v1/dashboard/token/${dashboardId}/rls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rlsFilters)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Superset token with RLS: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Superset token with RLS:', error);
      throw error;
    }
  }
};

// Error handler function
const handleApiError = (error) => {
  let errorMessage = 'An unknown error occurred';

  if (error.response) {
    // The server responded with a status code outside of 2xx
    const { data, status } = error.response;

    if (data.message) {
      errorMessage = data.message;
    } else if (data.error) {
      errorMessage = data.error;
    } else {
      errorMessage = `Request failed with status code ${status}`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response received from server';
  } else {
    // Something happened in setting up the request
    errorMessage = error.message;
  }

  return {
    message: errorMessage,
    original: error
  };
};

export default api;



// import axios from 'axios';

// const API_URL = 'http://localhost:8080';

// // Create axios instance
// const axiosInstance = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// // Add a request interceptor to add auth token
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('accessToken');
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Add a response interceptor to handle token refresh
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
    
//     // If error is 401 and we haven't already tried to refresh
//     if (error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
      
//       try {
//         // Try to refresh the token
//         const refreshToken = localStorage.getItem('refreshToken');
//         if (!refreshToken) {
//           // No refresh token available, logout
//           return Promise.reject(error);
//         }
        
//         const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
//           refreshToken: refreshToken
//         });
        
//         // Save the new access token
//         const { accessToken } = response.data;
//         localStorage.setItem('accessToken', accessToken);
        
//         // Update the authorization header and retry
//         originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
//         return axiosInstance(originalRequest);
//       } catch (refreshError) {
//         // Refresh failed, redirect to login
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         window.location.href = '/login';
//         return Promise.reject(refreshError);
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

// // API methods
// const api = {
//   // Auth endpoints
//   login: async (username, password) => {
//     try {
//       const response = await axiosInstance.post('/api/auth/login', {
//         username,
//         password
//       });
//       return response.data;
//     } catch (error) {
//       throw handleApiError(error);
//     }
//   },
//   register: async (userData) => {
//     try {
//       const response = await axiosInstance.post('/api/auth/signup', userData);
//       return response.data;
//     } catch (error) {
//       throw handleApiError(error);
//     }
//   },
  
//   refreshToken: async (refreshToken) => {
//     try {
//       const response = await axiosInstance.post('/api/auth/refresh-token', {
//         refreshToken
//       });
//       return response.data;
//     } catch (error) {
//       throw handleApiError(error);
//     }
//   },
  
//   logout: async (refreshToken) => {
//     try {
//       const response = await axiosInstance.post('/api/auth/logout', {
//         refreshToken
//       });
//       return response.data;
//     } catch (error) {
//       throw handleApiError(error);
//     }
//   },
  
//   validateToken: async (token) => {
//     try {
//       const response = await axiosInstance.post('/api/auth/validate', {
//         token
//       });
//       return response.data;
//     } catch (error) {
//       throw handleApiError(error);
//     }
//   },
  
//   // User endpoints
//   getUsers: async () => {
//     try {
//       const response = await axiosInstance.get('/api/users');
//       return response.data;
//     } catch (error) {
//       throw handleApiError(error);
//     }
//   },
  
//   getUserById: async (id) => {
//     try {
//       const response = await axiosInstance.get(`/api/users/${id}`);
//       return response.data;
//     } catch (error) {
//       throw handleApiError(error);
//     }
//   },
  
//   updateUser: async (id, userData) => {
//     try {
//       const response = await axiosInstance.put(`/api/users/${id}`, userData);
//       return response.data;
//     } catch (error) {
//       throw handleApiError(error);
//     }
//   },
  
//   deleteUser: async (id) => {
//     try {
//       const response = await axiosInstance.delete(`/api/users/${id}`);
//       return response.data;
//     } catch (error) {
//       throw handleApiError(error);
//     }
//   }
// };

// // Error handler function
// const handleApiError = (error) => {
//   let errorMessage = 'An unknown error occurred';
  
//   if (error.response) {
//     // The server responded with a status code outside of 2xx
//     const { data, status } = error.response;
    
//     if (data.message) {
//       errorMessage = data.message;
//     } else if (data.error) {
//       errorMessage = data.error;
//     } else {
//       errorMessage = `Request failed with status code ${status}`;
//     }
//   } else if (error.request) {
//     // The request was made but no response was received
//     errorMessage = 'No response received from server';
//   } else {
//     // Something happened in setting up the request
//     errorMessage = error.message;
//   }
  
//   return {
//     message: errorMessage,
//     original: error
//   };
// };

// export default api;
