import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Create context
const AuthContext = createContext(null);

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Superset specific state
  const [supersetConfig, setSupersetConfig] = useState(null);
  const [supersetToken, setSupersetToken] = useState(null);
  const [supersetTokenExpiry, setSupersetTokenExpiry] = useState(null);
  const [supersetTokenLoading, setSupersetTokenLoading] = useState(false);
  const [supersetError, setSupersetError] = useState(null);
  
  const navigate = useNavigate();

  // Check if token exists on app load
  useEffect(() => {
    const initAuth = async () => {
      if (accessToken) {
        try {
          // Validate token with backend
          const response = await api.validateToken(accessToken);
          if (response.valid) {
            setCurrentUser(response.user);
            
            // Fetch Superset config if available
            try {
              const supersetConfigResponse = await api.getSupersetConfig();
              if (supersetConfigResponse) {
                setSupersetConfig(supersetConfigResponse);
              }
            } catch (supersetErr) {
              console.error('Failed to load Superset configuration:', supersetErr);
              setSupersetError('Failed to load Superset configuration');
            }
          } else {
            // Token invalid, try refresh
            if (refreshToken) {
              await refreshAccessToken();
            } else {
              // No refresh token, logout
              logout();
            }
          }
        } catch (err) {
          console.error('Token validation error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Save tokens to localStorage when they change
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [accessToken, refreshToken]);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await api.login(username, password);
      
      // Store tokens
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      
      // Create a user object from the response
      const user = {
        id: response.id,
        username: response.username,
        email: response.email,
        roles: response.roles // Roles are directly in the response, not in a 'user' property
      };
      
      setCurrentUser(user);
      
      // Fetch Superset config after successful login
      try {
        const supersetConfigResponse = await api.getSupersetConfig();
        if (supersetConfigResponse) {
          setSupersetConfig(supersetConfigResponse);
        }
      } catch (supersetErr) {
        console.error('Failed to load Superset configuration:', supersetErr);
        setSupersetError('Failed to load Superset configuration');
      }
      
      // Redirect based on role
      if (response.roles && response.roles.includes('ROLE_ADMIN')) {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/user');
      }
      
      return response;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.register(userData);
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.refreshToken(refreshToken);
      setAccessToken(response.accessToken);
      
      // Optionally update refresh token if the API returns a new one
      if (response.refreshToken) {
        setRefreshToken(response.refreshToken);
      }
      
      return response;
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        // Send logout request to invalidate the token on server
        await api.logout(refreshToken);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local state regardless of server response
      setCurrentUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setSupersetToken(null);
      setSupersetTokenExpiry(null);
      setSupersetConfig(null);
      navigate('/login');
    }
  };

  // Superset specific methods
  const getSupersetGuestToken = async (dashboardId, rlsFilters = null) => {
    try {
      setSupersetError(null);
      setSupersetTokenLoading(true);
      
      if (!accessToken) {
        throw new Error('Authentication required');
      }
      
      if (!supersetConfig) {
        throw new Error('Superset configuration not available');
      }
      
      // Check if we already have a valid token that isn't near expiration
      const now = Date.now();
      if (supersetToken && supersetTokenExpiry && (supersetTokenExpiry - now > 60000)) {
        setSupersetTokenLoading(false);
        return supersetToken;
      }
      
      let response;
      
      // Use different endpoints based on whether RLS filters are provided
      if (rlsFilters && Object.keys(rlsFilters).length > 0) {
        response = await api.getSupersetTokenWithRls(dashboardId, rlsFilters, accessToken);
      } else {
        response = await api.getSupersetToken(dashboardId, accessToken);
      }
      
      if (!response || !response.token) {
        throw new Error('Failed to get Superset guest token');
      }
      
      setSupersetToken(response.token);
      setSupersetTokenExpiry(response.expiresAt);
      setSupersetTokenLoading(false);
      
      // Schedule token refresh 1 minute before expiry
      const refreshTime = response.expiresAt - Date.now() - (60 * 1000);
      if (refreshTime > 0) {
        setTimeout(() => {
          getSupersetGuestToken(dashboardId, rlsFilters);
        }, refreshTime);
      }
      
      return response.token;
    } catch (err) {
      setSupersetError(err.message || 'Failed to get Superset token');
      setSupersetTokenLoading(false);
      
      // Check if the error is due to authentication issues
      if (err.status === 401 || err.status === 403) {
        // Try to refresh the access token
        try {
          await refreshAccessToken();
          // Retry getting the Superset token
          return getSupersetGuestToken(dashboardId, rlsFilters);
        } catch (refreshErr) {
          // If refresh fails, propagate the error
          throw err;
        }
      }
      
      throw err;
    }
  };

  const refreshSupersetConfig = async () => {
    try {
      setSupersetError(null);
      
      if (!accessToken) {
        throw new Error('Authentication required');
      }
      
      const response = await api.getSupersetConfig();
      if (response) {
        setSupersetConfig(response);
      }
      
      return response;
    } catch (err) {
      setSupersetError(err.message || 'Failed to refresh Superset configuration');
      throw err;
    }
  };

  const value = {
    currentUser,
    accessToken,
    loading,
    error,
    login,
    register,
    logout,
    refreshAccessToken,
    
    // Superset related values and methods
    supersetConfig,
    supersetToken,
    supersetTokenExpiry,
    supersetTokenLoading,
    supersetError,
    getSupersetGuestToken,
    refreshSupersetConfig
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;


// import React, { createContext, useState, useEffect, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '../services/api';

// // Create context
// const AuthContext = createContext(null);

// // Hook to use the auth context
// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
//   const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  
//   const navigate = useNavigate();

//   // Check if token exists on app load
//   useEffect(() => {
//     const initAuth = async () => {
//       if (accessToken) {
//         try {
//           // Validate token with backend
//           const response = await api.validateToken(accessToken);
//           if (response.valid) {
//             setCurrentUser(response.user);
//           } else {
//             // Token invalid, try refresh
//             if (refreshToken) {
//               await refreshAccessToken();
//             } else {
//               // No refresh token, logout
//               logout();
//             }
//           }
//         } catch (err) {
//           console.error('Token validation error:', err);
//           logout();
//         }
//       }
//       setLoading(false);
//     };

//     initAuth();
//   }, []);

//   // Save tokens to localStorage when they change
//   useEffect(() => {
//     if (accessToken) {
//       localStorage.setItem('accessToken', accessToken);
//     } else {
//       localStorage.removeItem('accessToken');
//     }
    
//     if (refreshToken) {
//       localStorage.setItem('refreshToken', refreshToken);
//     } else {
//       localStorage.removeItem('refreshToken');
//     }
//   }, [accessToken, refreshToken]);

//   const login = async (username, password) => {
//     try {
//       setError(null);
//       const response = await api.login(username, password);
      
//       // Store tokens
//       setAccessToken(response.accessToken);
//       setRefreshToken(response.refreshToken);
      
//       // Create a user object from the response
//       const user = {
//         id: response.id,
//         username: response.username,
//         email: response.email,
//         roles: response.roles // Roles are directly in the response, not in a 'user' property
//       };
      
//       setCurrentUser(user);
      
//       // Redirect based on role
//       if (response.roles && response.roles.includes('ROLE_ADMIN')) {
//         navigate('/dashboard/admin');
//       } else {
//         navigate('/dashboard/user');
//       }
      
//       return response;
//     } catch (err) {
//       setError(err.message || 'Login failed');
//       throw err;
//     }
//   };
//   const register = async (userData) => {
//     try {
//       setError(null);
//       const response = await api.register(userData);
//       return response;
//     } catch (err) {
//       setError(err.message || 'Registration failed');
//       throw err;
//     }
//   };

//   const refreshAccessToken = async () => {
//     try {
//       if (!refreshToken) {
//         throw new Error('No refresh token available');
//       }
      
//       const response = await api.refreshToken(refreshToken);
//       setAccessToken(response.accessToken);
      
//       // Optionally update refresh token if the API returns a new one
//       if (response.refreshToken) {
//         setRefreshToken(response.refreshToken);
//       }
      
//       return response;
//     } catch (err) {
//       console.error('Token refresh failed:', err);
//       logout();
//       throw err;
//     }
//   };

//   const logout = async () => {
//     try {
//       if (refreshToken) {
//         // Send logout request to invalidate the token on server
//         await api.logout(refreshToken);
//       }
//     } catch (err) {
//       console.error('Logout error:', err);
//     } finally {
//       // Clear local state regardless of server response
//       setCurrentUser(null);
//       setAccessToken(null);
//       setRefreshToken(null);
//       navigate('/login');
//     }
//   };

//   const value = {
//     currentUser,
//     accessToken,
//     loading,
//     error,
//     login,
//     register,
//     logout,
//     refreshAccessToken
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// export default AuthContext;