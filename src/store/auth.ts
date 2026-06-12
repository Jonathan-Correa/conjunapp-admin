import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  position: string;
  is_super_admin: boolean;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: AdminUser, token: string) => void;
  logout: () => void;
  clearError: () => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      setAuth: (user: AdminUser, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setError: (error: string) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
