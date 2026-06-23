"use client";

export default function StatCard({ title, value, icon, subtitle, colorClass = "text-[#FF4655]" }) {
  return (
    <div className="bg-[#1A2332] rounded-xl border border-white/5 p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 font-medium">{title}</h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div>
        <p className={`text-4xl font-bold tracking-tight ${colorClass}`}>{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
