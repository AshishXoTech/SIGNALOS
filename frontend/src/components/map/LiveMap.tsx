"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { api } from "@/lib/api-client";
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

export function LiveMap({
  markers = [],
  center = [78.9629, 22.5937], // India centroid [lng, lat]
  zoom = 4.5,
  onMarkerClick,
  className = "h-[360px] w-full rounded-xl border border-slate-200 overflow-hidden",
}: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const onClickRef = useRef(onMarkerClick);
  onClickRef.current = onMarkerClick;

  // --- Real-time State from Backend ---
  const [liveReports, setLiveReports] = useState<any[]>([]);
  const [liveIncidents, setLiveIncidents] = useState<any[]>([]);

  // 1. Map Initialization Effect
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    import("maplibre-gl").then((mod: any) => {
      if (cancelled || !mapContainer.current || mapRef.current) return;
      const maplibregl = mod.default || mod;

      // OpenStreetMap raster tiles
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center,
        zoom,
        attributionControl: true,
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
  }, [center[0], center[1], zoom]);

  // 2. Fetch Data & Connect WebSocket
  useEffect(() => {
    // Initial fetch from backend
    api.getReports().then((data: any) => setLiveReports(Array.isArray(data) ? data : [])).catch(() => {});
    api.getIncidents().then((data: any) => setLiveIncidents(Array.isArray(data) ? data : [])).catch(() => {});

    // Connect WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001/ws/live";
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.event === "report.new") {
            setLiveReports((prev) => [payload.data, ...prev]);
            toast(`New Report: ${payload.data.disaster_type} (AI: ${payload.data.trust_score})`, { icon: "📍" });
          }

          if (payload.event === "incident.new" || payload.event === "incident.updated") {
            setLiveIncidents((prev) => {
              const exists = prev.find((i) => i.id === payload.data.id);
              if (exists) return prev.map((i) => (i.id === payload.data.id ? payload.data : i));
              return [payload.data, ...prev];
            });
            toast.error(`Incident Alert: ${payload.data.title}`);
          }
        } catch (e) {}
      };
    } catch (e) {}

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

    import("maplibre-gl").then((mod: any) => {
      if (!mapRef.current) return;
      const maplibregl = mod.default || mod;

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
          .addTo(mapRef.current);

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