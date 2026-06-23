"use client";

import { useI18n } from "@/i18n/context";
import Link from "next/link";
import { ShoppingCart, Backpack, Swords, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { t } = useI18n();
  const [account, setAccount] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/account/info")
      .then(res => {
        if (res.status === 401) {
          router.push("/");
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(data => setAccount(data))
      .catch(err => console.error(err));
  }, [router]);

  const cards = [
    { title: t("nav.store"), href: "/dashboard/store", icon: <ShoppingCart size={48} />, color: "from-[#FF4655] to-[#FF4655]/50", delay: "delay-0" },
    { title: t("nav.inventory"), href: "/dashboard/inventory", icon: <Backpack size={48} />, color: "from-[#00D4AA] to-[#00D4AA]/50", delay: "delay-100" },
    { title: t("nav.matches"), href: "/dashboard/matches", icon: <Swords size={48} />, color: "from-[#5A9FE6] to-[#5A9FE6]/50", delay: "delay-200" },
    { title: t("nav.account"), href: "/dashboard/account", icon: <User size={48} />, color: "from-[#F5955B] to-[#F5955B]/50", delay: "delay-300" },
  ];

  return (
    <div className="flex flex-col h-full justify-center space-y-12 pb-20">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold tracking-wider mb-4">
          Welcome back, <span className="text-[#FF4655]">{account?.username || "Agent"}</span>
        </h1>
        <p className="text-gray-400 text-lg">What would you like to check today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full px-4">
        {cards.map((card) => (
          <Link 
            key={card.href} 
            href={card.href}
            className={`group relative overflow-hidden rounded-2xl bg-[#1A2332] border border-white/10 p-8 hover:border-white/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-slide-up ${card.delay}`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.color} rounded-bl-full opacity-20 group-hover:scale-110 transition-transform duration-500`}></div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="text-white group-hover:scale-110 transition-transform duration-300 drop-shadow-lg mb-2">
                {card.icon}
              </div>
              <h2 className="text-2xl font-bold tracking-wide text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-colors">
                {card.title}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
