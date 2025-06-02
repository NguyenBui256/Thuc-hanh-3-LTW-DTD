/**
 * fetchModel - Fetch a model from the web server.
 *
 * @param {string} url      The URL to issue the GET request.
 *
 */
function fetchModel(url) {
  return fetch(`http://localhost:3001${url}`, {
    credentials: 'include' // Include cookies for session
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('Fetch error:', error);
      throw error;
    });
}

/**
 * postModel - Send a POST request to the web server.
 *
 * @param {string} url      The URL to issue the POST request.
 * @param {object} data     The data to send in the request body.
 *
 */
function postModel(url, data) {
  return fetch(`http://localhost:3001${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || `Request failed with status ${response.status}`);
        });
      }
      return response.json();
    })
    .catch(error => {
      console.error('Post error:', error);
      throw error;
    });
}

export { fetchModel, postModel };
export default fetchModel; 