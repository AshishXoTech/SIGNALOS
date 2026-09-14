"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { api, WS_URL } from "@/lib/api-client";
import toast from "react-hot-toast";

export interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  severity?: "critical" | "high" | "moderate" | "low" | "catastrophic";
  type: "incident" | "report" | "team";
}

export interface LiveMapProps {
  markers?: MarkerData[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (id: string, type: "incident" | "report" | "team") => void;
  className?: string;
}

type MapLibreModule = typeof import("maplibre-gl");
type MapLibreMap = InstanceType<MapLibreModule["Map"]>;
type MapLibreMarker = InstanceType<MapLibreModule["Marker"]>;
type LiveReport = {
  id: string;
  latitude: number;
  longitude: number;
  disaster_type?: string;
  trust_score?: number;
};
type LiveIncident = {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
  severity?: MarkerData["severity"];
};

export function LiveMap({
  markers = [],
  center = [78.9629, 22.5937], // India centroid [lng, lat]
  zoom = 4.5,
  onMarkerClick,
  className = "h-[360px] w-full rounded-xl border border-slate-200 overflow-hidden",
}: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const onClickRef = useRef(onMarkerClick);
  const [centerLng, centerLat] = center;

  // --- Real-time State from Backend ---
  const [liveReports, setLiveReports] = useState<LiveReport[]>([]);
  const [liveIncidents, setLiveIncidents] = useState<LiveIncident[]>([]);

  useEffect(() => {
    onClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // 1. Map Initialization Effect
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    import("maplibre-gl").then((mod) => {
      if (cancelled || !mapContainer.current || mapRef.current) return;
      const maplibregl = mod;

      // Use a keyless OSM-compatible tile endpoint for local and demo deployments.
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            basemap: {
              type: "raster",
              tiles: [
                "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [
            {
              id: "basemap",
              type: "raster",
              source: "basemap",
              minzoom: 0,
              maxzoom: 18,
            },
          ],
        },
        center: [centerLng, centerLat],
        zoom,
        attributionControl: {},
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right"
      );

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [centerLng, centerLat, zoom]);

  // 2. Fetch Data & Connect WebSocket
  useEffect(() => {
    // Initial fetch from backend
    api.getReports().then((data) => setLiveReports(Array.isArray(data) ? data as LiveReport[] : [])).catch(() => {});
    api.getIncidents().then((data) => setLiveIncidents(Array.isArray(data) ? data as LiveIncident[] : [])).catch(() => {});

    // Connect WebSocket
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(WS_URL);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { event?: string; data?: LiveReport & LiveIncident };

          const data = payload.data;
          if (!data) return;

          if (payload.event === "report.new") {
            const report = data as LiveReport;
            setLiveReports((prev) => [report, ...prev]);
            toast(`New Report: ${report.disaster_type} (AI: ${report.trust_score})`, { icon: "📍" });
          }

          if (payload.event === "incident.new" || payload.event === "incident.updated") {
            const incident = data as LiveIncident;
            setLiveIncidents((prev) => {
              const exists = prev.find((i) => i.id === incident.id);
              if (exists) return prev.map((i) => (i.id === incident.id ? incident : i));
              return [incident, ...prev];
            });
            toast.error(`Incident Alert: ${incident.title || "New incident"}`);
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // 3. Render Markers
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    const mergedMarkers = new Map<string, MarkerData>();

    // Add API Reports
    liveReports.forEach((r) => {
      if (r && r.id && r.latitude && r.longitude) {
        mergedMarkers.set(r.id, {
          id: r.id,
          latitude: r.latitude,
          longitude: r.longitude,
          title: `Report: ${r.disaster_type || "hazard"} (AI: ${r.trust_score || 0})`,
          type: "report",
          severity: (r.trust_score || 0) > 70 ? "high" : "low",
        });
      }
    });

    // Add API Incidents
    liveIncidents.forEach((i) => {
      if (i && i.id && i.latitude && i.longitude) {
        mergedMarkers.set(i.id, {
          id: i.id,
          latitude: i.latitude,
          longitude: i.longitude,
          title: i.title || "Incident",
          type: "incident",
          severity: i.severity || "moderate",
        });
      }
    });

    // Add Explicit Prop Markers
    markers.forEach((m) => {
      if (m && m.id) mergedMarkers.set(m.id, m);
    });

    const finalMarkers = Array.from(mergedMarkers.values());

    import("maplibre-gl").then((mod) => {
      const activeMap = mapRef.current;
      if (!activeMap) return;
      const maplibregl = mod;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      finalMarkers.forEach((m) => {
        const el = document.createElement("div");
        el.style.cursor = "pointer";

        let bg = "#3B82F6"; // Blue for Reports
        if (m.type === "incident") {
          if (m.severity === "critical" || m.severity === "catastrophic") bg = "#DC2626";
          else if (m.severity === "high") bg = "#EA580C";
          else if (m.severity === "moderate") bg = "#D97706";
          else bg = "#16A34A";
        } else if (m.type === "team") {
          bg = "#16A34A";
        }

        el.innerHTML = `
          <div style="
            width:18px;height:18px;border-radius:9999px;
            background:${bg};border:3px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,.35);
          "></div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onClickRef.current?.(m.id, m.type);
        });

        const popup = new maplibregl.Popup({
          offset: 14,
          closeButton: false,
          maxWidth: "240px",
        }).setHTML(`
          <div style="font-family:Inter,system-ui,sans-serif;padding:4px 2px;">
            <div style="font-size:10px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px;">
              ${m.type}
            </div>
            <div style="font-size:12px;font-weight:600;color:#0f172a;line-height:1.3;">
              ${m.title}
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([m.longitude, m.latitude])
          .setPopup(popup)
          .addTo(activeMap);

        markersRef.current.push(marker);
      });
    });
  }, [markers, liveReports, liveIncidents]);

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
