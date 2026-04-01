import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  getCurrentUserRequest,
  loginRequest,
  registerRequest
} from "../services/auth-service";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hasHydrated: false,
      isCheckingSession: false,

      register: async ({ fullName, email, password }) => {
        const result = await registerRequest({
          fullName,
          email,
          password
        });

        set({
          token: result.token,
          user: result.user
        });

        return result;
      },

      login: async ({ email, password }) => {
        const result = await loginRequest({
          email,
          password
        });

        set({
          token: result.token,
          user: result.user
        });

        return result;
      },

      checkSession: async () => {
        const token = get().token;

        if (!token) {
          return null;
        }

        set({ isCheckingSession: true });

        try {
          const result = await getCurrentUserRequest(token);

          set({
            user: result.user
          });

          return result.user;
        } catch (error) {
          set({
            token: null,
            user: null
          });

          throw error;
        } finally {
          set({ isCheckingSession: false });
        }
      },

      setSession: ({ token, user }) => {
        set({
          token,
          user
        });
      },

      setUser: (user) => {
        set({ user });
      },

      clearSession: () => {
        set({
          token: null,
          user: null
        });
      },

      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      }
    }),
    {
      name: "foodsaver-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      }
    }
  )
);
