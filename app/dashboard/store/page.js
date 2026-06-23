"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import SkinCard from "@/components/SkinCard";
import StoreCountdown from "@/components/StoreCountdown";
import { useRouter } from "next/navigation";

export default function StorePage() {
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch("/api/store/daily");
        if (res.status === 401) {
          router.push("/");
          return;
        }
        if (!res.ok) throw new Error(t("common.error"));
        const data = await res.json();
        setStoreData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wider mb-2">{t("store.daily_offers")}</h1>
          <div className="h-1 w-20 bg-[#FF4655] rounded-full"></div>
        </div>
        
        {storeData?.refreshIn && (
          <StoreCountdown initialSeconds={storeData.refreshIn} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        {storeData?.dailyOffers?.map((offer) => (
          <SkinCard key={offer.uuid} skin={offer} />
        ))}
      </div>
    </div>
  );
}
