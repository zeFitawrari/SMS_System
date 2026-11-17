import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  accessToken: null,
  sessionToken: null,
  sessionId: null,
  user: null,
  roles: [],
  activeRole: null,
  schoolId: null,
  sessions: [],
  loading: false,
  error: null,

  setAuth: (data) =>
    set((state) => ({
      ...state,
      ...data,
      loading: false,
      error: null,
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  setSessions: (sessions) => set({ sessions }),

  logout: () =>
    set({
      accessToken: null,
      sessionToken: null,
      sessionId: null,
      user: null,
      roles: [],
      activeRole: null,
      schoolId: null,
      sessions: [],
      error: null,
    }),
}));
