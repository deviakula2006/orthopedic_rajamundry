import axios from 'axios';

// Base Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 10000 // 10s timeout
});

// Interceptor to automatically append authorization tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('roh_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global errors (e.g., token expiration redirects)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    // Don't force-redirect on a failed login attempt itself — that 401 just
    // means "wrong credentials" and AuthContext.login() already surfaces it
    // as an inline form error. Redirecting here would blow away the login
    // page before the user ever sees that message.
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      // Clear credentials and force login if an existing session expires.
      // Uses BASE_URL (Vite's configured `base`) + the HashRouter's `#/`
      // prefix so this lands on the actual login route instead of a bare
      // `/login`, which 404s under a non-root base path.
      localStorage.removeItem('roh_admin_user');
      localStorage.removeItem('roh_auth_token');
      window.location.href = `${import.meta.env.BASE_URL}#/login`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
