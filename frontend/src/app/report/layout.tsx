import GovHeader from "@/components/GovHeader";
import GovFooter from "@/components/GovFooter";

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 🇮🇳 OFFICIAL GOVERNMENT HEADER */}
      <GovHeader />
      
      {/* CITIZEN EMERGENCY PORTAL CONTENT */}
      <main className="flex-1">
        {children}
      </main>

      {/* 🇮🇳 STATUTORY LEGAL FOOTER */}
      <GovFooter />
    </div>
  );
}