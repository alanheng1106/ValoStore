"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import StatCard from "@/components/StatCard";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await fetch("/api/account/info");
        if (res.status === 401) {
          router.push("/");
          return;
        }
        if (!res.ok) throw new Error(t("common.error"));
        const data = await res.json();
        setAccount(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [router, t]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#5A9FE6]/30 border-t-[#5A9FE6] rounded-full animate-spin"></div>
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
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-wider mb-2">{t("account.title")}</h1>
        <div className="h-1 w-20 bg-[#5A9FE6] rounded-full"></div>
      </div>

      <div className="relative p-8 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center gap-8 overflow-hidden shadow-2xl">
        {/* Banner Background */}
        <div className="absolute inset-0 bg-[#1A2332]">
          {account?.card?.wide && (
            <>
              <img src={account.card.wide} alt="Banner" className="absolute inset-0 w-full h-full object-cover object-right opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A2332] via-[#1A2332]/80 to-transparent"></div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="w-32 h-32 rounded-full border-4 border-white/10 bg-black flex items-center justify-center overflow-hidden shrink-0 relative z-10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          {account?.mmr?.images?.large ? (
            <img src={account.mmr.images.large} alt="Rank" className="w-24 h-24 object-contain" />
          ) : (
            <span className="text-4xl">🎮</span>
          )}
          {account?.xp && (
            <div className="absolute bottom-0 w-full bg-black/80 text-center text-xs font-bold py-1 border-t border-white/20">
              LVL {account.xp.level}
            </div>
          )}
        </div>
        
        <div className="text-center md:text-left relative z-10">
          <h2 className="text-4xl font-bold text-white mb-2 tracking-wide drop-shadow-md">
            {account?.username} <span className="text-gray-400 font-medium text-2xl">#{account?.tag}</span>
          </h2>
          <p className="text-lg text-[#5A9FE6] font-bold drop-shadow-md">
            {account?.mmr?.currentTierName || "Unranked"} 
            {account?.mmr?.rankingInTier !== undefined ? ` • ${account.mmr.rankingInTier} RR` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t("account.vp")} 
          value={account?.wallet?.vp || 0} 
          icon={<img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png" className="w-6 h-6" alt="VP"/>}
          colorClass="text-[#FF4655]"
        />
        <StatCard 
          title={t("account.rp")} 
          value={account?.wallet?.rad || 0} 
          icon={<img src="https://media.valorant-api.com/currencies/e59aa87c-4cbf-517a-5983-6e81511be9b7/displayicon.png" className="w-6 h-6" alt="RP"/>}
          colorClass="text-[#F5955B]"
        />
        <StatCard 
          title="Kingdom Credits" 
          value={account?.wallet?.kc || 0} 
          icon={<img src="https://media.valorant-api.com/currencies/85ca954a-41f2-ce94-9b45-8ca3dd39a00d/displayicon.png" className="w-6 h-6" alt="KC"/>}
          colorClass="text-[#00D4AA]"
        />
        <StatCard 
          title={t("account.level")} 
          value={account?.xp?.level || 0} 
          icon="⭐"
          colorClass="text-[#5A9FE6]"
          subtitle={`${account?.xp?.xp || 0} XP`}
        />
      </div>
    </div>
  );
}
