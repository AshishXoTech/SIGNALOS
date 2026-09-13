import { create } from "zustand";

interface User {
  id: string;
  role: string;
  full_name: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  wsStatus: "connecting" | "connected" | "disconnected";
  sidebarOpen: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setWsStatus: (status: "connecting" | "connected" | "disconnected") => void;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("signal_token") : null,
  wsStatus: "disconnected",
  sidebarOpen: true,

  setUser: (user) => {
    if (user) localStorage.setItem("signal_user", JSON.stringify(user));
    else localStorage.removeItem("signal_user");
    set({ user });
  },

  setToken: (token) => {
    if (token) localStorage.setItem("signal_token", token);
    else localStorage.removeItem("signal_token");
    set({ token });
  },

  setWsStatus: (wsStatus) => set({ wsStatus }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  logout: () => {
    localStorage.removeItem("signal_token");
    localStorage.removeItem("signal_user");
    set({ user: null, token: null });
  },
}));