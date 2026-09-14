'use client';

import GovHeader from '@/components/GovHeader';
import SessionSecurityBanner from '@/components/SessionSecurityBanner';
import GovFooter from '@/components/GovFooter';

type GovAppShellProps = {
  children: React.ReactNode;
  /** Show officer session strip for active duty roles */
  showSessionBanner?: boolean;
  /** Show legal footer for public/citizen pages */
  showFooter?: boolean;
  mainClassName?: string;
};

export default function GovAppShell({
  children,
  showSessionBanner = false,
  showFooter = false,
  mainClassName = '',
}: GovAppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500/30">
      <GovHeader />
      {showSessionBanner && <SessionSecurityBanner />}
      <main className={`flex-1 ${mainClassName}`}>{children}</main>
      {showFooter && <GovFooter />}
    </div>
  );
}