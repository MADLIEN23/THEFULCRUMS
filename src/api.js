// Central API Client for ToolTrack
// Handles JWT storage, authorization headers, and unified HTTP requests

const API_BASE = '/api';

export const api = {
  getToken() {
    return localStorage.getItem('tooltrack_token');
  },

  setAuth(token, user) {
    localStorage.setItem('tooltrack_token', token);
    localStorage.setItem('tooltrack_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('tooltrack_token');
    localStorage.removeItem('tooltrack_user');
  },

  getUser() {
    const raw = localStorage.getItem('tooltrack_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { ...options.headers };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set Content-Type if sending FormData (browser sets boundary automatically)
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401) {
      this.clearAuth();
      window.dispatchEvent(new Event('auth-expired'));
      throw new Error('Your session has expired. Please sign in again.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  },

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setAuth(data.token, data.user);
    return data;
  },

  async getMe() {
    return this.request('/auth/me');
  },

  async getTools(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') {
        query.set(k, v);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/tools${qs}`);
  },

  async getTool(id) {
    return this.request(`/tools/${id}`);
  },

  async registerTool(toolData) {
    return this.request('/tools', {
      method: 'POST',
      body: JSON.stringify(toolData)
    });
  },

  async addEvent(toolId, eventData) {
    let body;
    let headers = {};

    if (eventData instanceof FormData) {
      body = eventData;
    } else {
      body = JSON.stringify(eventData);
      headers['Content-Type'] = 'application/json';
    }

    return this.request(`/tools/${toolId}/events`, {
      method: 'POST',
      headers,
      body
    });
  },

  async getAlerts() {
    return this.request('/alerts');
  },

  async getReportsSummary() {
    return this.request('/reports/summary');
  }
};
