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
  hydrate: () => void;
  setWsStatus: (status: "connecting" | "connected" | "disconnected") => void;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: null,
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

  hydrate: () => {
    const storedUser = localStorage.getItem("signal_user");
    const token = localStorage.getItem("signal_token");
    let user: User | null = null;

    if (storedUser) {
      try {
        user = JSON.parse(storedUser) as User;
      } catch {
        localStorage.removeItem("signal_user");
      }
    }

    set({ user, token });
  },

  setWsStatus: (wsStatus) => set({ wsStatus }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  logout: () => {
    localStorage.removeItem("signal_token");
    localStorage.removeItem("signal_user");
    document.cookie = "signal_token=; path=/; max-age=0; SameSite=Lax";
    set({ user: null, token: null });
  },
}));