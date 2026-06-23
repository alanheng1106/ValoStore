"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/context";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  const links = [
    { href: "/dashboard", label: "nav.dashboard" },
    { href: "/dashboard/store", label: "nav.store" },
    { href: "/dashboard/inventory", label: "nav.inventory" },
    { href: "/dashboard/matches", label: "nav.matches" },
    { href: "/dashboard/account", label: "nav.account" },
  ];

  return (
    <header className="md:hidden bg-[#1A2332]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold tracking-wider text-[#FF4655]">ValoStore</h1>
        
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-300 hover:text-white focus:outline-none"
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <nav className="px-4 pb-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-[#FF4655]/20 text-[#FF4655]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {t(link.label)}
              </Link>
            );
          })}
          <button className="w-full text-left px-4 py-3 text-gray-400 hover:text-white mt-4 border-t border-white/10">
            {t("auth.logout")}
          </button>
        </nav>
      )}
    </header>
  );
}
