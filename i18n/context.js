"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import zh from "./zh.json";
import en from "./en.json";

const translations = { zh, en };

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState("zh");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLocale = localStorage.getItem("locale");
    if (savedLocale && ["zh", "en"].includes(savedLocale)) {
      setLocale(savedLocale);
    } else {
      const browserLang = navigator.language.startsWith("zh") ? "zh" : "en";
      setLocale(browserLang);
      localStorage.setItem("locale", browserLang);
    }
  }, []);

  const changeLocale = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[locale];
    for (const k of keys) {
      if (value[k] === undefined) {
        return key;
      }
      value = value[k];
    }
    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, changeLocale, t }}>
      <div 
        style={{ visibility: mounted ? 'visible' : 'hidden' }}
        className="flex-1 flex flex-col w-full h-full"
      >
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
