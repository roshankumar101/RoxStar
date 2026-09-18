import { create } from "zustand";

import {
  getCurrentUser,
  login,
  logout,
  register,
} from "@/services/authService";
import { disconnectSocket } from "@/services/socketService";
import type { User } from "@/types/user";

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  error: null,
  initialize: async () => {
    try {
      const user = await getCurrentUser();
      set({ user, initialized: true, error: null });
    } catch {
      set({ user: null, initialized: true });
    }
  },
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      set({ user: await login({ email, password }), loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to sign in",
      });
      throw error;
    }
  },
  signUp: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      set({ user: await register({ name, email, password }), loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to register",
      });
      throw error;
    }
  },
  signOut: async () => {
    set({ loading: true });
    try {
      await logout();
    } finally {
      disconnectSocket();
      set({ user: null, loading: false });
    }
  },
}));
