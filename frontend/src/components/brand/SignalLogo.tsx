import { cn } from "@/lib/utils";

interface SignalLogoProps {
  className?: string;
  markClassName?: string;
}

export function SignalLogo({ className, markClassName }: SignalLogoProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-orange-500/20 ring-1 ring-slate-200/80",
        className
      )}
      aria-label="Signal OS logo"
      role="img"
    >
      <svg
        viewBox="0 0 96 96"
        className={cn("h-4/5 w-4/5", markClassName)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M48 7.5 78 18.8v22.6c0 20.5-12.5 38.9-30 46.9-17.5-8-30-26.4-30-46.9V18.8L48 7.5Z"
          fill="#0F172A"
        />
        <path
          d="M48 13.2 72.7 22.5v18.9c0 17-10 32.9-24.7 40.2-14.7-7.3-24.7-23.2-24.7-40.2V22.5L48 13.2Z"
          fill="white"
        />
        <path d="M27.9 24.9 48 17.3l20.1 7.6v13.3H27.9V24.9Z" fill="#FF671F" />
        <path d="M27.9 38.2h40.2v10.9H27.9V38.2Z" fill="#F8FAFC" />
        <path
          d="M27.9 49.1h40.2c-2 12.1-9.4 22.8-20.1 28.6-10.7-5.8-18.1-16.5-20.1-28.6Z"
          fill="#046A38"
        />
        <circle cx="48" cy="43.7" r="13" fill="white" stroke="#1E3A8A" strokeWidth="2.6" />
        {Array.from({ length: 24 }).map((_, index) => {
          const angle = index * 15;
          return (
            <path
              key={angle}
              d="M48 32.4v5.3"
              stroke="#1E3A8A"
              strokeWidth="1.2"
              strokeLinecap="round"
              transform={`rotate(${angle} 48 43.7)`}
            />
          );
        })}
        <circle cx="48" cy="43.7" r="3.2" fill="#1E3A8A" />
        <path
          d="M33 58.8c4.8 4.8 9.8 8.3 15 10.8 5.2-2.5 10.2-6 15-10.8"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M17.5 31.8c-4.5 4.5-7 10.4-7 16.7s2.5 12.2 7 16.7M78.5 31.8c4.5 4.5 7 10.4 7 16.7s-2.5 12.2-7 16.7"
          stroke="#FF671F"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M23.5 37.2a16 16 0 0 0 0 22.6M72.5 37.2a16 16 0 0 1 0 22.6"
          stroke="#046A38"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
