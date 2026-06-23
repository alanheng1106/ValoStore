"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";

export default function WeaponAccordion({ weaponGroup }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="bg-[#1A2332] rounded-xl overflow-hidden border border-white/5 mb-4 transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-wide text-white">{weaponGroup.name}</h2>
          <span className="px-3 py-1 bg-black/40 rounded-full text-sm font-medium text-[#FF4655]">
            {weaponGroup.skins.length} {t("store.owned")}
          </span>
        </div>
        <span className={`transform transition-transform text-gray-400 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-white/5 bg-black/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {weaponGroup.skins.map(skin => (
            <div key={skin.uuid} className="bg-[#0F1923] rounded-lg overflow-hidden border border-white/5 hover:border-[#FF4655]/30 transition-colors group">
              <div className="h-40 w-full flex items-center justify-center p-4 relative bg-gradient-to-b from-transparent to-black/60">
                {skin.icon ? (
                  <img src={skin.icon} alt={skin.name} className="max-h-full max-w-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform" />
                ) : (
                  <span className="text-gray-500">No Image</span>
                )}
              </div>
              <div className="p-4 border-t border-white/5 bg-[#1A2332]">
                <h3 className="font-bold text-gray-200 truncate" title={skin.name}>{skin.name}</h3>
                
                {skin.ownedChromas?.length > 1 && (
                  <div className="flex gap-2 mt-3">
                    {skin.ownedChromas.map(chroma => (
                      <div key={chroma.uuid} className="w-6 h-6 rounded border border-white/20 overflow-hidden bg-black flex items-center justify-center" title={chroma.name}>
                        {chroma.icon ? (
                          <img src={chroma.icon} alt={chroma.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-700"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
