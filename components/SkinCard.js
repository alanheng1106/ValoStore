"use client";

export default function SkinCard({ skin }) {
  // Extract hex color or fallback to gray
  const color = skin.tierColor || '#808080';

  return (
    <div className="relative group rounded-md overflow-hidden bg-gradient-to-b from-[#1c2534] to-[#0f1923] border border-white/10 transition-transform hover:-translate-y-1 hover:shadow-2xl cursor-pointer w-full h-[240px]">
      
      {/* Background Gradient overlay based on rarity color */}
      <div 
        className="absolute inset-0 opacity-10 mix-blend-screen transition-opacity group-hover:opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)`
        }}
      ></div>

      {/* Top Right Price Tag */}
      <div className="absolute top-0 right-0 z-20 flex items-center h-8 pr-2 pl-4 rounded-bl-xl" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <img 
          src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png" 
          alt="VP" 
          className="w-3.5 h-3.5 mr-1"
        />
        <span className="font-bold text-white text-sm mr-2">{skin.cost.toLocaleString()}</span>
        {skin.tierIcon && (
          <img 
            src={skin.tierIcon} 
            alt="tier" 
            className="w-4 h-4 object-contain drop-shadow-md"
          />
        )}
      </div>

      {/* Center Image */}
      <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
        {skin.icon ? (
          <img 
            src={skin.icon} 
            alt={skin.name} 
            className="w-full h-auto max-h-[140px] object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-gray-500">No Image</span>
        )}
      </div>

      {/* Bottom Left Name */}
      <div className="absolute bottom-3 left-4 z-20 pr-4">
        <h3 className="font-black text-white text-sm leading-tight tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: 'monospace, sans-serif' }}>
          {skin.name.split(' ').map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
        </h3>
      </div>
    </div>
  );
}
