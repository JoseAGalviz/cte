const BASE_URL = 'https://98.94.185.164.nip.io/api/transferencias'

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)
  const data = await response.json()

  if (!response.ok) {
    const message = data?.error || data?.message || `Error ${response.status}`
    throw new Error(message)
  }

  return data
}

export const api = {
  get: (endpoint, options) =>
    request(endpoint, { method: 'GET', ...options }),

  post: (endpoint, body, options) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),

  put: (endpoint, body, options) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),

  delete: (endpoint, options) =>
    request(endpoint, { method: 'DELETE', ...options }),
}
