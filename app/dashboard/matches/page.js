"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import MatchCard from "@/components/MatchCard";
import { useRouter } from "next/navigation";

export default function MatchesPage() {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/match/history");
        if (res.status === 401) {
          router.push("/");
          return;
        }
        if (!res.ok) throw new Error(t("common.error"));
        const data = await res.json();
        
        // Ensure name is passed down to identify the user
        const sessionRes = await fetch("/api/account/info");
        const sessionData = await sessionRes.json();
        
        const enhancedMatches = data.map(m => ({
          ...m,
          name: sessionData.username // Will be used in MatchCard to identify player
        }));
        
        setMatches(enhancedMatches);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [router, t]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#FF4655]/30 border-t-[#FF4655] rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 animate-pulse">{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#FF4655]/10 border border-[#FF4655]/20 rounded-xl text-center">
        <p className="text-[#FF4655]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-wider mb-2">{t("matches.title")}</h1>
        <div className="h-1 w-20 bg-[#FF4655] rounded-full mb-8"></div>
      </div>

      <div className="max-w-4xl mx-auto">
        {matches?.length > 0 ? (
          matches.map((match) => (
            <MatchCard key={match.metadata.matchid} match={match} />
          ))
        ) : (
          <div className="text-center py-20 text-gray-500 bg-[#1A2332] rounded-xl border border-white/5">
            No matches found or rate limit reached.
          </div>
        )}
      </div>
    </div>
  );
}
