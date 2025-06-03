// Global API configuration
// const API_BASE_URL = 'https://lpq7hx-3001.csb.app';
const API_BASE_URL = 'http://localhost:3001';

/**
 * Get JWT token from localStorage
 */
function getToken() {
  return localStorage.getItem('jwt_token');
}

/**
 * Set JWT token in localStorage
 */
function setToken(token) {
  localStorage.setItem('jwt_token', token);
}

/**
 * Remove JWT token from localStorage
 */
function removeToken() {
  localStorage.removeItem('jwt_token');
}

/**
 * fetchModel - Fetch a model from the web server.
 *
 * @param {string} url      The URL to issue the GET request.
 *
 */
async function fetchModel(url) {
  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers
    });
    
    if (!response.ok) {
      // If unauthorized, remove invalid token
      if (response.status === 401) {
        removeToken();
      }
      throw new Error(`Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * postModel - Send a POST request to the web server.
 *
 * @param {string} url      The URL to issue the POST request.
 * @param {object} data     The data to send in the request body.
 *
 */
async function postModel(url, data) {
  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      // If unauthorized, remove invalid token
      if (response.status === 401) {
        removeToken();
      }
      const err = await response.json();
      throw new Error(err.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Post error:', error);
    throw error;
  }
}

/**
 * postModelWithFile - Send a POST request with file upload.
 *
 * @param {string} url      The URL to issue the POST request.
 * @param {FormData} formData The FormData object containing the file and other data.
 *
 */
async function postModelWithFile(url, formData) {
  try {
    const token = getToken();
    const headers = {};
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData, let browser set it with boundary
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      // If unauthorized, remove invalid token
      if (response.status === 401) {
        removeToken();
      }
      const err = await response.json();
      throw new Error(err.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Post file error:', error);
    throw error;
  }
}

export { fetchModel, postModel, postModelWithFile, getToken, setToken, removeToken };
export default fetchModel; 