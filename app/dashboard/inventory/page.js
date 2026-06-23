"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import WeaponAccordion from "@/components/WeaponAccordion";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory/skins");
        if (res.status === 401) {
          router.push("/");
          return;
        }
        if (!res.ok) throw new Error(t("common.error"));
        const data = await res.json();
        setInventory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [router, t]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#00D4AA]/30 border-t-[#00D4AA] rounded-full animate-spin"></div>
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

  const totalSkins = inventory?.reduce((acc, group) => acc + group.skins.length, 0) || 0;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-end gap-4 mb-2">
          <h1 className="text-3xl font-bold tracking-wider">{t("inventory.title")}</h1>
          <span className="text-gray-400 mb-1">({totalSkins} Skins)</span>
        </div>
        <div className="h-1 w-20 bg-[#00D4AA] rounded-full"></div>
      </div>

      <div className="mt-8">
        {inventory?.length > 0 ? (
          inventory.map((group) => (
            <WeaponAccordion key={group.uuid} weaponGroup={group} />
          ))
        ) : (
          <div className="text-center py-20 text-gray-500 bg-[#1A2332] rounded-xl border border-white/5">
            No skins found.
          </div>
        )}
      </div>
    </div>
  );
}
