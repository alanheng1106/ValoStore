"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { LayoutDashboard, ShoppingCart, Backpack, Swords, User, LogOut } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const links = [
    { href: "/dashboard", label: "nav.dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/dashboard/store", label: "nav.store", icon: <ShoppingCart size={20} /> },
    { href: "/dashboard/inventory", label: "nav.inventory", icon: <Backpack size={20} /> },
    { href: "/dashboard/matches", label: "nav.matches", icon: <Swords size={20} /> },
    { href: "/dashboard/account", label: "nav.account", icon: <User size={20} /> },
  ];

  return (
    <aside className="w-64 bg-[#1A2332]/80 backdrop-blur-md border-r border-white/5 hidden md:flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-wider text-[#FF4655]">ValoStore</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? "bg-[#FF4655]/20 text-[#FF4655] border border-[#FF4655]/30" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="opacity-80 group-hover:opacity-100 transition-opacity">{link.icon}</span>
              <span className="font-medium">{t(link.label)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-[#FF4655] transition-colors group">
          <LogOut size={16} className="opacity-80 group-hover:opacity-100" />
          <span>{t("auth.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
