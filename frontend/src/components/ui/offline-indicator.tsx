"use client";
import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    setOffline(!navigator.onLine);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-900/90 border-b border-red-700 px-4 py-2 flex items-center justify-center gap-2 text-sm text-red-200"
        >
          <WifiOff className="w-4 h-4" />
          <span>No connection — reports will sync when online</span>
          <button className="ml-2 flex items-center gap-1 text-xs text-red-300 hover:text-white">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}