/**
 * Zustand auth store — persists JWT token and user info to localStorage.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  email: string;
  plan: "free" | "pro" | "enterprise";
  full_name?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      logout: () => {
        // Clear cookie used by Edge middleware
        if (typeof document !== "undefined") {
          document.cookie = "vc_token=; path=/; max-age=0; SameSite=Lax";
        }
        set({ token: null, user: null, isAuthenticated: false });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: "viralcommerce-auth",
      // Only persist token + user, not the functions
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
