"use client";

export default function SkinCard({ skin }) {
  return (
    <div className="relative group bg-[#1A2332] rounded-xl overflow-hidden border border-white/5 transition-all hover:border-[#FF4655]/50 hover:shadow-[0_0_20px_rgba(255,70,85,0.15)] hover:-translate-y-1">
      {/* Rarity Bar */}
      <div 
        className="absolute top-0 left-0 w-full h-1 z-10 opacity-80"
        style={{ backgroundColor: skin.tierColor }}
      ></div>
      
      {/* Image Container */}
      <div className="h-48 w-full flex items-center justify-center p-6 relative bg-gradient-to-b from-transparent to-black/40">
        <div className="absolute inset-0 bg-[#0F1923] opacity-50 z-0"></div>
        {skin.icon ? (
          <img 
            src={skin.icon} 
            alt={skin.name} 
            className="max-h-full max-w-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
          />
        ) : (
          <span className="text-gray-500 relative z-10">No Image</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex items-center justify-between border-t border-white/5 bg-black/20">
        <h3 className="font-bold truncate text-gray-200 pr-2">{skin.name}</h3>
        <div className="flex items-center gap-1.5 shrink-0 bg-[#0F1923] px-2 py-1 rounded">
          <img 
            src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png" 
            alt="VP" 
            className="w-4 h-4"
          />
          <span className="font-bold text-[#FF4655]">{skin.cost}</span>
        </div>
      </div>
    </div>
  );
}
