"use client";

import { useI18n } from "@/i18n/context";

export default function LanguageSwitcher() {
  const { locale, changeLocale } = useI18n();

  const toggleLocale = () => {
    changeLocale(locale === "zh" ? "en" : "zh");
  };

  return (
    <button
      onClick={toggleLocale}
      className="p-2 rounded-lg bg-black/20 hover:bg-black/40 text-sm font-medium text-gray-300 transition-colors border border-white/10"
      title={locale === "zh" ? "Switch to English" : "切换到中文"}
    >
      <span className="flex items-center gap-2">
        <span>🌐</span>
        <span>{locale === "zh" ? "EN" : "中文"}</span>
      </span>
    </button>
  );
}
