import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../utils/translation.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("qx_lang") || "en");
  useEffect(() => localStorage.setItem("qx_lang", lang), [lang]);

  const value = useMemo(() => {
    const dict = translations[lang] || translations.en;
    const t = (key) => dict[key] ?? translations.en[key] ?? key;
    return {
      lang,
      setLang,
      t,
      languages: [
        { code: "en", label: "English" },
        { code: "ta", label: "தமிழ்" },
        { code: "hi", label: "हिन्दी" },
      ],
    };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext);