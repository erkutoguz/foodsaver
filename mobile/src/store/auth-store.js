import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      isAuthLoading: false,

      setAuthLoading: (value) => {
        set({ isAuthLoading: value });
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      }
    }
  )
);
