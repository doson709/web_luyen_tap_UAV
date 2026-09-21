// Unified API client for UAV Practice & Exam System

const BASE_URL = (import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '') + '/api';

function getAuthHeader() {
  const token = localStorage.getItem('uav_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Lỗi yêu cầu: ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth & Profile
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    ssoLogin: (ssoPayload) => request('/auth/sso-login', { method: 'POST', body: JSON.stringify(ssoPayload) }),
    getMe: () => request('/auth/me')
  },

  // Users & Roles (Admin)
  users: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/users?${q}`);
    },
    create: (user) => request('/users', { method: 'POST', body: JSON.stringify(user) }),
    update: (id, user) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
    delete: (id) => request(`/users/${id}`, { method: 'DELETE' })
  },

  // Curriculum & Structure
  curriculum: {
    getTree: () => request('/curriculum/tree'),
    getPrograms: () => request('/curriculum/programs'),
    getModules: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/curriculum/modules?${q}`);
    },
    getTopics: (moduleId) => request(`/curriculum/modules/${moduleId}/topics`)
  },

  // Questions Bank & Teacher Edit
  questions: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/questions?${q}`);
    },
    getById: (id) => request(`/questions/${id}`),
    updateExplanation: (id, explanation) => request(`/questions/${id}/explanation`, {
      method: 'PUT',
      body: JSON.stringify({ explanation })
    }),
    update: (id, questionData) => request(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(questionData)
    }),
    create: (questionData) => request('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData)
    })
  },

  // Practice & Stats
  practice: {
    submitAnswer: (payload) => request('/practice/submit', { method: 'POST', body: JSON.stringify(payload) }),
    createSession: (payload) => request('/practice/session', { method: 'POST', body: JSON.stringify(payload) }),
    getStats: () => request('/practice/stats')
  }
};
