const DEFAULT_BASE_URLS = {
  films: import.meta.env.VITE_API_FILMS ?? 'http://localhost:5000',
  sessions: import.meta.env.VITE_API_SEANCES ?? 'http://localhost:5001',
  accounts: import.meta.env.VITE_API_COMPTES ?? 'http://localhost:5002',
}

const buildUrl = (baseUrl, path = '') => {
  if (!path) return baseUrl.replace(/\/+$/, '')
  if (/^https?:\/\//i.test(path)) return path
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') ?? ''
  let payload = null

  if (contentType.includes('application/json')) {
    payload = await response.json()
  } else if (contentType.includes('text/')) {
    payload = await response.text()
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && payload.message) ||
      (typeof payload === 'string' && payload) ||
      `HTTP ${response.status}`
    throw new Error(message)
  }

  return payload
}

const request = async (baseUrl, path, options = {}) => {
  const { method = 'GET', body, headers = {}, token, ...rest } = options
  const requestHeaders = { Accept: 'application/json', ...headers }

  let requestBody = body
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] ?? 'application/json'
    requestBody = JSON.stringify(body)
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(baseUrl, path), {
    method,
    headers: requestHeaders,
    ...(requestBody ? { body: requestBody } : {}),
    ...rest,
  })

  return parseResponse(response)
}

const createClient = (baseUrl) => ({
  get: (path, options) => request(baseUrl, path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(baseUrl, path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(baseUrl, path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(baseUrl, path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(baseUrl, path, { ...options, method: 'DELETE' }),
})

export const apiFilms = createClient(DEFAULT_BASE_URLS.films)
export const apiSessions = createClient(DEFAULT_BASE_URLS.sessions)
export const apiAccounts = createClient(DEFAULT_BASE_URLS.accounts)

export { createClient }
