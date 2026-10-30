import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  fetchMe: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.get('/auth/me');
      set({
        user: res.data?.data?.user || null,
        isAuthenticated: true,
        isLoading: false,
      });
      return res.data?.data?.user;
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user), isLoading: false });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// Listen for global session expiration events emitted by apiClient interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('ips:session-expired', () => {
    useAuthStore.getState().setUser(null);
  });
}

