import api from './api'

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
}

// Accounts
export const accountsAPI = {
  connect: (data) => api.post('/accounts', data),
  list: () => api.get('/accounts'),
  disconnect: (platform) => api.delete(`/accounts/${platform}`),
}

// Analysis
export const analysisAPI = {
  trigger: (platforms) => api.post('/analysis', { platforms }),
  jobStatus: (jobId) => api.get(`/analysis/job/${jobId}`),
  clearLock: () => api.delete('/analysis/lock'),
}

// Reports
export const reportsAPI = {
  list: (page = 1, limit = 10) => api.get(`/reports?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/reports/${id}`),
  getLatest: (userId) => api.get(`/reports/user/${userId}`),
  analytics: () => api.get('/reports/analytics'),
  compare: () => api.get('/reports/compare'),
}

// Resume
export const resumeAPI = {
  upload: (file) => {
    const form = new FormData()
    form.append('resume', file)
    return api.post('/resume/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// Notifications
export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/all/read'),
}

// Public profile (no auth)
export const publicAPI = {
  getProfile: (username) => api.get(`/u/${username}`, { headers: { Authorization: undefined } }),
}
