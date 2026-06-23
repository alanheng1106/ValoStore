"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";

export default function StoreCountdown({ initialSeconds, simple = false }) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const { t } = useI18n();

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00:00";
    
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (d > 0) {
      return `${d.toString().padStart(2, '0')}:${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (simple) {
    return <span>{formatTime(timeLeft)}</span>;
  }

  return (
    <div className="flex items-center gap-3 bg-[#1A2332]/80 px-4 py-2 rounded-lg border border-white/5">
      <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{t("store.refreshes_in")}</span>
      <span className="font-mono text-xl font-bold text-[#00D4AA] tracking-widest">{formatTime(timeLeft)}</span>
    </div>
  );
}
