import axios from 'axios';

// Same origin in development (CRA proxy) and Docker (nginx). When the API runs on another host
// (e.g. Render), set REACT_APP_API_HOST at build time: "my-api.onrender.com" or a full URL.
const apiHost = process.env.REACT_APP_API_HOST || '';
const apiOrigin = apiHost && !/^https?:\/\//.test(apiHost) ? `https://${apiHost}` : apiHost;

const api = axios.create({ baseURL: `${apiOrigin}/api` });

// Attach JWT token to every request if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('deutsch_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired or invalid session: clear it and reload so the login screen shows
api.interceptors.response.use(undefined, error => {
  const msg = error.response?.data?.error;
  // Only when a session existed: on public pages (verify email, reset password) there is nothing to clear
  if (error.response?.status === 401 && (msg === 'No token' || msg === 'Invalid token') && localStorage.getItem('deutsch_token')) {
    localStorage.removeItem('deutsch_token');
    localStorage.removeItem('deutsch_user');
    window.location.reload();
  }
  return Promise.reject(error);
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login    = (data) => api.post('/auth/login', data);
export const getMe    = ()     => api.get('/auth/me');
export const updateProfile  = (data) => api.put('/auth/profile', data);
export const updatePassword = (data) => api.put('/auth/password', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword  = (data) => api.post('/auth/reset-password', data);
export const verifyEmail    = (data) => api.post('/auth/verify-email', data);
export const resendVerification = (data) => api.post('/auth/resend-verification', data);
export const checkUsername  = (username) => api.get('/auth/check-username', { params: { username } });
export const sendContact    = (data) => api.post('/contact', data);

// Translator
export const translateText = (data) => api.post('/translate', data);

// Lessons
export const getLessons    = (params) => api.get('/lessons', { params });
export const getAILessons  = ()       => api.get('/lessons/ai');
export const getLesson     = (slug)   => api.get(`/lessons/${slug}`);
export const generateLesson= (data)   => api.post('/lessons/generate', data);
export const deleteLesson  = (slug)   => api.delete(`/lessons/${slug}`);

// Progress
export const getProgress    = ()     => api.get('/progress');
export const updateProgress = (data) => api.post('/progress', data);

// Exams
export const generateExam = (data) => api.post('/exams/generate', data);
export const getExam      = (id)   => api.get(`/exams/${id}`);
export const getExams     = (params) => api.get('/exams', { params });
export const deleteExam   = (id)   => api.delete(`/exams/${id}`);

// Comments
export const getComments   = (slug)       => api.get(`/lessons/${slug}/comments`);
export const postComment   = (slug, data) => api.post(`/lessons/${slug}/comments`, data);
export const deleteComment = (slug, id)   => api.delete(`/lessons/${slug}/comments/${id}`);

// Admin
export const adminGetAnalytics  = ()           => api.get('/admin/analytics');
export const adminGetUsers      = ()           => api.get('/admin/users');
export const adminUpdateRole    = (id, role)   => api.put(`/admin/users/${id}/role`, { role });
export const adminDeleteUser    = (id)         => api.delete(`/admin/users/${id}`);
export const adminGetContacts   = ()           => api.get('/admin/contacts');
export const adminMarkRead      = (id)         => api.patch(`/admin/contacts/${id}/read`);
export const adminDeleteContact = (id)         => api.delete(`/admin/contacts/${id}`);
export const adminBroadcast     = (data)       => api.post('/admin/broadcast', data);

// Resources
export const uploadResource = (slug, formData) => api.post(`/lessons/${slug}/resources`, formData);

export default api;
