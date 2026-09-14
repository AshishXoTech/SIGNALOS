const DEFAULT_API_ORIGIN = "http://localhost:8001";

function normalizeApiOrigin(value?: string): string {
  const raw = (value || DEFAULT_API_ORIGIN).replace(/\/+$/, "");
  return raw.replace(/\/api\/v1$/, "");
}

export const API_ORIGIN = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);
export const API_V1_URL = `${API_ORIGIN}/api/v1`;
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  API_ORIGIN.replace(/^http/, "ws") + "/ws/live";

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("signal_token");
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers);
    if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (!skipAuth) {
      const token = this.getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...fetchOptions,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `HTTP ${res.status}`);
    }

    if (res.status === 204) return {} as T;
    return res.json();
  }

  getHealth = () => this.request("/api/v1/health", { skipAuth: true });

  submitReport = <T = { id: string; trust_score?: number }>(data: Record<string, unknown>) =>
    this.request<T>("/api/v1/reports", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    });

  getReports = (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params).toString()}` : "";
    return this.request(`/api/v1/reports${q}`, { skipAuth: true });
  };

  getReport = (id: string) =>
    this.request(`/api/v1/reports/${id}`, { skipAuth: true });

  trackReport = (id: string) => this.getReport(id);

  getNearbyReports = (lat: number, lng: number, radiusKm = 5) =>
    this.request(`/api/v1/reports/nearby/${lat}/${lng}?radius_km=${radiusKm}`, {
      skipAuth: true,
    });

  reviewReport = (id: string, data: { evidence_review: string; review_notes?: string }) =>
    this.request(`/api/v1/reports/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    });

  batchSync = (reports: Record<string, unknown>[]) =>
    this.request("/api/v1/reports/batch-sync", {
      method: "POST",
      body: JSON.stringify({ reports }),
      skipAuth: true,
    });

  getIncidents = (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params).toString()}` : "";
    return this.request(`/api/v1/incidents${q}`, { skipAuth: true });
  };

  getIncident = (id: string) =>
    this.request(`/api/v1/incidents/${id}`, { skipAuth: true });

  getIncidentStats = () =>
    this.request("/api/v1/incidents/stats/summary", { skipAuth: true });

  runClustering = () =>
    this.request("/api/v1/incidents/cluster/run", {
      method: "POST",
      skipAuth: true,
    });

  getIncidentTimeline = (id: string) =>
    this.request(`/api/v1/incidents/${id}/timeline`, { skipAuth: true });

  createIncident = (data: Record<string, unknown>) =>
    this.request("/api/v1/incidents", {
      method: "POST",
      body: JSON.stringify(data),
    });

  linkReport = (incidentId: string, reportId: string) =>
    this.request(`/api/v1/incidents/${incidentId}/reports`, {
      method: "POST",
      body: JSON.stringify({ report_id: reportId }),
    });

  login = (username: string, password: string) =>
    this.request<{
      access_token: string;
      token_type: string;
      user: {
        id: string;
        full_name: string | null;
        role: string;
        [key: string]: unknown;
      };
    }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });

  getMe = () => this.request("/api/v1/auth/me");

  getTeams = (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params).toString()}` : "";
    return this.request(`/api/v1/teams${q}`);
  };

  suggestTeams = (lat: number, lng: number, hazard: string) =>
    this.request(`/api/v1/teams/suggest?latitude=${lat}&longitude=${lng}&hazard_type=${hazard}`);

  assignTeam = (incidentId: string, teamId: string) =>
    this.request(`/api/v1/assignments/incidents/${incidentId}/assign`, {
      method: "POST",
      body: JSON.stringify({ team_id: teamId }),
    });

  getMyAssignments = () => this.request("/api/v1/assignments/me");

  transitionAssignment = (id: string, status: string, reason?: string) =>
    this.request(`/api/v1/assignments/${id}/transition`, {
      method: "POST",
      body: JSON.stringify({ new_status: status, reason }),
    });

  submitClosure = (incidentId: string, data: Record<string, unknown>) =>
    this.request(`/api/v1/closures/incidents/${incidentId}/closure`, {
      method: "POST",
      body: JSON.stringify(data),
    });

  getPendingClosures = () => this.request("/api/v1/closures/pending");

  reviewClosure = (id: string, decision: string, notes?: string) =>
    this.request(`/api/v1/closures/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ decision, review_notes: notes }),
    });
}

export const api = new ApiClient(API_ORIGIN);
