// import axios from 'axios';

// // Base Axios instance
// const apiClient = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
//   headers: {
//     'Content-Type': 'application/json',
//     Accept: 'application/json'
//   },
//   timeout: 10000 // 10s timeout
// });

// // Interceptor to automatically append authorization tokens
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('roh_auth_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Interceptor to handle global errors (e.g., token expiration redirects)
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       // Clear credentials and force login if session expires
//       localStorage.removeItem('roh_admin_user');
//       localStorage.removeItem('roh_auth_token');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default apiClient;
import axios from 'axios';

// Base Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 10000
});

// Automatically attach JWT token to authenticated requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('roh_auth_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired/invalid authenticated sessions globally
apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    // A 401 from /auth/login means invalid credentials.
    // AuthContext handles that error and displays it on the login page.
    //
    // Other 401 responses indicate an expired/invalid authenticated session.
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('roh_admin_user');
      localStorage.removeItem('roh_auth_token');

      window.location.href = `${import.meta.env.BASE_URL}#/login`;
    }

    return Promise.reject(error);
  }
);

export default apiClient;