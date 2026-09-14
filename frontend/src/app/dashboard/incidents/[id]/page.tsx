"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, ShieldAlert, Navigation,
  CheckCircle2, Activity, Crosshair,
  Truck, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import { formatTimeAgo } from "@/lib/utils";

// Mock Data for Hackathon
const INCIDENT = {
  id: "INC-1042",
  hazard: "landslide",
  title: "Debris blocking road, vehicle trapped underneath",
  location: "Bridge Road, Munnar, Kerala",
  lat: 10.0889,
  lng: 77.0595,
  severity: "critical",
  status: "response_active",
  created_at: new Date(Date.now() - 18 * 60000).toISOString(),
  description: "A massive landslide has blocked the primary access road. Citizen reports indicate a pickup truck is partially buried. High risk of further sliding due to ongoing rain.",
};

const SUGGESTED_TEAMS = [
  { id: "t1", name: "SDRF Unit Alpha", type: "State Disaster Response", distance: "2.3 km", match: 98, status: "Available", capabilities: ["Landslide", "Heavy Rescue"] },
  { id: "t2", name: "Fire & Rescue Stn 4", type: "Local Fire Dept", distance: "4.1 km", match: 75, status: "Available", capabilities: ["Extrication", "Medical"] },
  { id: "t3", name: "NDRF Battalion 6", type: "National Disaster Response", distance: "45.0 km", match: 100, status: "Deployed", capabilities: ["All-Hazard", "K9 Search"] },
];

const TIMELINE = [
  { id: 1, action: "Incident Created", actor: "Operator Priya", time: new Date(Date.now() - 18 * 60000).toISOString(), type: "system" },
  { id: 2, action: "Report Linked", actor: "System", time: new Date(Date.now() - 17 * 60000).toISOString(), type: "info" },
  { id: 3, action: "Severity Escalated to Critical", actor: "Operator Priya", time: new Date(Date.now() - 16 * 60000).toISOString(), type: "alert" },
];

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const incidentId = params?.id || INCIDENT.id;
  
  const [assignedTeam, setAssignedTeam] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatch = (teamId: string) => {
    setIsDispatching(true);
    setTimeout(() => {
      setAssignedTeam(teamId);
      setIsDispatching(false);
      toast.success("Team dispatched successfully!");
    }, 800);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {INCIDENT.title}
              </h1>
              <span className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {INCIDENT.severity}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500 font-mono">
              <span>{incidentId}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {INCIDENT.location}</span>
            </div>
          </div>
        </div>
        
        {assignedTeam ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg font-bold text-sm shadow-sm">
            <CheckCircle2 className="w-5 h-5" /> Team Responding
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg font-bold text-sm shadow-sm animate-pulse">
            <AlertTriangle className="w-5 h-5" /> Requires Dispatch
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Details & Timeline */}
        <div className="xl:col-span-2 space-y-6">
          {/* Situation Report */}
          <div className="card-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-800">Situation Report</h2>
            </div>
            <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
              {INCIDENT.description}
            </p>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="p-3 border border-slate-100 rounded-xl bg-white">
                <span className="data-label block mb-1">Time Elapsed</span>
                <span className="text-lg font-black text-slate-800 font-mono">18m 24s</span>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-white">
                <span className="data-label block mb-1">Verified Reports</span>
                <span className="text-lg font-black text-slate-800 font-mono">4</span>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-white">
                <span className="data-label block mb-1">Coordinates</span>
                <span className="text-sm font-black text-slate-800 font-mono mt-1 block">
                  {INCIDENT.lat.toFixed(4)}, {INCIDENT.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="card-surface p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-800">Operational Timeline</h2>
            </div>
            <div className="space-y-6 pl-2">
              {TIMELINE.map((event, idx) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Line connector */}
                  {idx !== TIMELINE.length - 1 && (
                    <div className="absolute left-2 top-8 bottom-[-24px] w-0.5 bg-slate-100"></div>
                  )}
                  {/* Dot */}
                  <div className={`relative z-10 w-4 h-4 rounded-full border-2 border-white mt-1 shrink-0 ${
                    event.type === "alert" ? "bg-red-500" : event.type === "system" ? "bg-slate-400" : "bg-blue-500"
                  }`} />
                  <div>
                    <div className="text-sm font-bold text-slate-800">{event.action}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                      By {event.actor} • <span className="font-mono">{formatTimeAgo(event.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {assignedTeam && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative flex gap-4">
                  <div className="relative z-10 w-4 h-4 rounded-full border-2 border-white bg-green-500 mt-1 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-slate-800">Team Dispatched</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                      By You • <span className="font-mono">just now</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dispatch Panel */}
        <div className="space-y-6">
          <div className="card-surface flex flex-col h-full bg-white">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-1">
                <Crosshair className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-slate-900">Dispatch Team</h2>
              </div>
              <p className="text-xs font-medium text-slate-500">
                System matched closest available units based on hazard type and equipment.
              </p>
            </div>

            <div className="p-5 flex-1 space-y-4">
              {assignedTeam ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Truck className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Team En Route</h3>
                  <p className="text-sm font-medium text-slate-500 mb-6">
                    {SUGGESTED_TEAMS.find(t => t.id === assignedTeam)?.name} has acknowledged the assignment and is moving to the location.
                  </p>
                  <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                    Track Live Location
                  </button>
                </div>
              ) : (
                SUGGESTED_TEAMS.map((team) => (
                  <div key={team.id} className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all bg-white group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{team.name}</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{team.type}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-orange-600 font-mono leading-none">{team.match}%</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Match</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 mb-4 bg-slate-50 p-2 rounded-lg">
                      <span className="flex items-center gap-1 font-mono"><Navigation className="w-3.5 h-3.5 text-slate-400"/> {team.distance}</span>
                      <span>•</span>
                      <span className={team.status === "Available" ? "text-green-600" : "text-amber-600"}>{team.status}</span>
                    </div>

                    <div className="flex gap-2 flex-wrap mb-4">
                      {team.capabilities.map(cap => (
                        <span key={cap} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide">
                          {cap}
                        </span>
                      ))}
                    </div>

                    <button 
                      disabled={team.status !== "Available" || isDispatching}
                      onClick={() => handleDispatch(team.id)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-orange-600 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isDispatching ? "Dispatching..." : "Assign & Dispatch"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
