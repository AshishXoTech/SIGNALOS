const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function liveGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(typeof window !== "undefined" && localStorage.getItem("signal_token")
          ? { Authorization: `Bearer ${localStorage.getItem("signal_token")}` }
          : {}),
      },
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
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(typeof window !== "undefined" && localStorage.getItem("signal_token")
          ? { Authorization: `Bearer ${localStorage.getItem("signal_token")}` }
          : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as { detail?: string }).detail || res.statusText };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    if (fallback !== undefined) return { ok: true, data: fallback };
    return { ok: false, error: "Backend offline — using demo mode" };
  }
}

export function backendUrl() {
  return API;
}