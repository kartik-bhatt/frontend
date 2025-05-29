// utils/apiUtils.js

/**
 * Extracts data safely from API responses
 * @param {Object} responsePromise - Promise returned by API call
 * @param {*} defaultValue - Default value if data is missing
 * @returns {Promise} - Resolved with response.data or defaultValue
 */
export const extractApiData = async (responsePromise, defaultValue = []) => {
  try {
    const response = await responsePromise;
    return response.data || defaultValue;
  } catch (error) {
    console.error('API extraction error:', error);
    return defaultValue;
  }
};

/**
 * Formats API error for display
 * @param {Error} error - Error from API call
 * @returns {String} - Formatted error message
 */
export const formatApiError = (error) => {
  if (error.userMessage) {
    return error.userMessage;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  return error.message || 'An unexpected error occurred';
};

// Example function to use in components:
// Usage: const users = await fetchData(userApi.getAll());
export const fetchData = async (apiCall, defaultValue = []) => {
  try {
    const response = await apiCall;
    // Add debugging to help identify response structure
    console.log('API Response:', response);
    return response.data || defaultValue;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
};