import { create } from 'zustand';
import { authApi, type User } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; address?: string; city?: string; zipCode?: string; country?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.me();
      set({ user: res.data.user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login({ email, password });
      set({ user: res.data.user, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register({ email, password, name });
      set({ user: res.data.user, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.logout();
      set({ user: null, isLoading: false });
    } catch (err: any) {
      set({ user: null, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.updateProfile(data);
      set({ user: res.data.user, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Update failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },
}));

window.addEventListener('auth:unauthorized', () => {
  useAuthStore.getState().logout();
});
