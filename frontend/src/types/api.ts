export type DisasterType = "flood" | "earthquake" | "fire" | "landslide" | "cyclone" | "tsunami" | "drought" | "other";

export interface Report {
  id: string;
  user_id?: string;
  description: string;
  disaster_type: DisasterType;
  latitude: number;
  longitude: number;
  address_text?: string;
  trust_score: number;
  status: "pending" | "verifying" | "verified" | "rejected" | "duplicate";
  reported_at: string;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  disaster_type: DisasterType;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "monitoring" | "resolved" | "archived";
  latitude: number;
  longitude: number;
  radius_meters: number;
  report_count: number;
  avg_trust_score: number;
  last_updated: string;
}

export interface StatsSummary {
  total_incidents: number;
  active_incidents: number;
  critical_incidents: number;
}