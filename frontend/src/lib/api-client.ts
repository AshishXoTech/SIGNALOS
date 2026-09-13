const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("signal_token");
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    if (!skipAuth) {
      const token = this.getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${path}`;

    const res = await fetch(url, {
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

  // ============================================================
  // 1. SYSTEM & HEALTH
  // ============================================================
  getHealth = () =>
    this.request("/api/v1/health", { skipAuth: true });

  // ============================================================
  // 2. REPORTS (Citizen & Control Room)
  // ============================================================
  submitReport = (data: Record<string, unknown>) =>
    this.request("/api/v1/reports", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    });

  getReports = (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request(`/api/v1/reports${q}`, { skipAuth: true });
  };

  getReport = (id: string) =>
    this.request(`/api/v1/reports/${id}`, { skipAuth: true });

  trackReport = (id: string) =>
    this.request(`/api/v1/reports/${id}`, { skipAuth: true });

  getNearbyReports = (lat: number, lng: number, radiusKm: number = 5) =>
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

  // ============================================================
  // 3. INCIDENTS & CLUSTERING (Control Room)
  // ============================================================
  getIncidents = (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request(`/api/v1/incidents${q}`, { skipAuth: true });
  };

  getIncident = (id: string) =>
    this.request(`/api/v1/incidents/${id}`, { skipAuth: true });

  getIncidentStats = () =>
    this.request("/api/v1/incidents/stats/summary", { skipAuth: true });

  runClustering = () =>
    this.request("/api/v1/incidents/cluster/run", { method: "POST", skipAuth: true });

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

  // ============================================================
  // 4. AUTHENTICATION
  // ============================================================
  login = (phone: string, password: string) =>
    this.request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
      skipAuth: true,
    });

  // ============================================================
  // 5. TEAMS & DISPATCH
  // ============================================================
  getTeams = (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request(`/api/v1/teams${q}`);
  };

  suggestTeams = (lat: number, lng: number, hazard: string) =>
    this.request(`/api/v1/teams/suggest?latitude=${lat}&longitude=${lng}&hazard_type=${hazard}`);

  // ============================================================
  // 6. ASSIGNMENTS
  // ============================================================
  assignTeam = (incidentId: string, teamId: string) =>
    this.request(`/api/v1/assignments/incidents/${incidentId}/assign`, {
      method: "POST",
      body: JSON.stringify({ team_id: teamId }),
    });

  getMyAssignments = () =>
    this.request("/api/v1/assignments/me");

  transitionAssignment = (id: string, status: string, reason?: string) =>
    this.request(`/api/v1/assignments/${id}/transition`, {
      method: "POST",
      body: JSON.stringify({ new_status: status, reason }),
    });

  // ============================================================
  // 7. CLOSURES & EVIDENCE
  // ============================================================
  submitClosure = (incidentId: string, data: Record<string, unknown>) =>
    this.request(`/api/v1/closures/incidents/${incidentId}/closure`, {
      method: "POST",
      body: JSON.stringify(data),
    });

  getPendingClosures = () =>
    this.request("/api/v1/closures/pending");

  reviewClosure = (id: string, decision: string, notes?: string) =>
    this.request(`/api/v1/closures/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ decision, review_notes: notes }),
    });
}

export const api = new ApiClient(API_URL);