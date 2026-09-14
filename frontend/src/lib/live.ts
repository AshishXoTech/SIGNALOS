import { API_ORIGIN } from "@/lib/api-client";

function normalizePath(path: string): string {
  if (path.startsWith("/api/v1/")) return path;
  if (path === "/api/health") return "/api/v1/health";
  if (path.startsWith("/api/")) return `/api/v1/${path.slice(5)}`;
  return path;
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("signal_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function liveGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_ORIGIN}${normalizePath(path)}`, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function livePost<T>(
  path: string,
  body: unknown,
  fallback?: T
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_ORIGIN}${normalizePath(path)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: (err as { detail?: string }).detail || res.statusText,
      };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    if (fallback !== undefined) return { ok: true, data: fallback };
    return { ok: false, error: "Backend offline — using demo mode" };
  }
}

export function backendUrl() {
  return API_ORIGIN;
}
