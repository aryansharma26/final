import axios from 'axios';
import { clearAllPageStates } from '../utils/pageCache.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

if (import.meta.env.PROD && (!import.meta.env.VITE_API_URL || /localhost|127\.0\.0\.1/i.test(API_BASE_URL))) {
  throw new Error('VITE_API_URL must be configured to the production API URL before deployment.');
}

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

API.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      const url = response.config.url;
      const isReadPost = ['/coupons/validate', '/b2b-coupons/validate', '/auth/login', '/auth/logout', '/admin/login', '/admin/logout', '/auth/refresh'].some(p => url?.startsWith(p));
      if (!isReadPost) {
        clearAllPageStates();
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh'].some((path) => originalRequest?.url?.startsWith(path));
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const isAdminRoute = originalRequest._admin || originalRequest.url?.startsWith('/admin');
      if (isAdminRoute) {
        const onAdminLogin = window.location.pathname.startsWith('/admin/login');
        if (!onAdminLogin) {
          window.location.replace('/admin/login');
        }
        return Promise.reject(error);
      }

      try {
        await API.post('/auth/refresh');
        return API(originalRequest);
      } catch (refreshError) {
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          const currentPath = window.location.pathname;
          const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some((p) => currentPath.startsWith(p));
          const isAdminPath = currentPath.startsWith('/admin');
          const isProtectedRoute = ['/profile', '/orders', '/checkout', '/wishlist'].some((p) => currentPath.startsWith(p));
          if (isProtectedRoute && !isAuthPage && !isAdminPath) {
            window.location.replace('/register');
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
