"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import SkinCard from "@/components/SkinCard";
import StoreCountdown from "@/components/StoreCountdown";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

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
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      
      {/* FEATURED BUNDLE */}
      {storeData?.featuredBundle && (
        <div className="relative w-full rounded-lg overflow-hidden border border-white/10 group shadow-2xl bg-[#0f1923]">
          {/* Bundle Image */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
            {storeData.featuredBundle.icon ? (
              <img 
                src={storeData.featuredBundle.icon} 
                alt={storeData.featuredBundle.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500">No Bundle Image</span>
              </div>
            )}
            
            {/* Top Left Featured Tag & Timer */}
            <div className="absolute top-4 left-4 lg:top-6 lg:left-6 flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold tracking-widest text-sm lg:text-base">FEATURED</span>
                <div className="flex items-center gap-1.5 text-[#00ffcc] font-mono text-sm lg:text-base font-bold bg-black/40 px-2 py-0.5 rounded">
                  <Clock size={14} />
                  <StoreCountdown initialSeconds={storeData.featuredBundle.refreshIn} simple={true} />
                </div>
              </div>
              <h2 className="text-white font-black text-3xl lg:text-5xl uppercase tracking-wider mt-1 drop-shadow-md">
                {storeData.featuredBundle.name}
              </h2>
              <p className="text-white/70 tracking-widest text-xs lg:text-sm uppercase font-bold">Collection</p>
            </div>

            {/* Bottom Right Price Tag */}
            <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6">
              <div className="flex items-center gap-2 bg-black/60 px-4 py-2 border border-white/10 rounded-sm backdrop-blur-sm">
                <img 
                  src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png" 
                  alt="VP" 
                  className="w-5 h-5"
                />
                <span className="text-white font-bold text-xl lg:text-2xl">{storeData.featuredBundle.cost.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DAILY OFFERS */}
      <div className="relative mt-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
          <div className="flex items-center gap-2 text-white/70 font-bold tracking-widest uppercase text-sm">
            <span>Offers</span>
            <span>|</span>
            <span className="text-[#00ffcc] font-mono flex items-center gap-1.5">
              <Clock size={14} />
              <StoreCountdown initialSeconds={storeData.refreshIn} simple={true} />
            </span>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {storeData?.dailyOffers?.map((offer) => (
            <SkinCard key={offer.uuid} skin={offer} />
          ))}
        </div>
      </div>
      
    </div>
  );
}
