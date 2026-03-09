import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "he" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  // Sidebar
  "nav.dashboard": { he: "דף ראשי", en: "Dashboard" },
  "nav.trades": { he: "עסקאות", en: "Trades" },
  "nav.statistics": { he: "סטטיסטיקות", en: "Statistics" },
  "nav.strategies": { he: "אסטרטגיות", en: "Strategies" },
  "nav.backtesting": { he: "Gozlan Forever Model", en: "Gozlan Forever Model" },
  "nav.community": { he: "קהילה", en: "Community" },
  "nav.giveaways": { he: "הגרלות", en: "Giveaways" },
  "nav.profile": { he: "פרופיל", en: "Profile" },
  "nav.settings": { he: "הגדרות", en: "Settings" },
  "nav.mentor": { he: "מנטור", en: "Mentor" },
  "nav.mentorChat": { he: "צ'אט עם מנטור", en: "Mentor Chat" },
  "nav.admin": { he: "ניהול", en: "Admin" },
  "nav.logout": { he: "התנתקות", en: "Logout" },

  // Dashboard stat cards
  "stats.netPnl": { he: "רווח/הפסד נקי", en: "Net P&L" },
  "stats.totalTrades": { he: "סה\"כ עסקאות", en: "Total Trades" },
  "stats.tradeWin": { he: "Trade win %", en: "Trade Win %" },
  "stats.tradeWinTooltip": { he: "אחוז עסקאות מנצחות", en: "Percentage of winning trades" },
  "stats.profitFactor": { he: "Profit factor", en: "Profit Factor" },
  "stats.profitFactorTooltip": { he: "יחס רווח גולמי להפסד גולמי", en: "Gross profit to gross loss ratio" },
  "stats.dayWin": { he: "Day win %", en: "Day Win %" },
  "stats.dayWinTooltip": { he: "אחוז ימי מסחר רווחיים", en: "Percentage of profitable trading days" },
  "stats.avgWinLoss": { he: "Avg win/loss trade", en: "Avg Win/Loss Trade" },
  "stats.avgWinLossTooltip": { he: "יחס ממוצע רווח לממוצע הפסד", en: "Average win to average loss ratio" },

  // Dashboard sections
  "dashboard.cumulativePnl": { he: "רווח מצטבר", en: "Cumulative P&L" },
  "dashboard.dayOfWeek": { he: "ביצועים לפי יום", en: "Day of Week Performance" },
  "dashboard.recentTrades": { he: "עסקאות אחרונות", en: "Recent Trades" },
  "dashboard.tradingCalendar": { he: "לוח שנה", en: "Trading Calendar" },
  "dashboard.streaks": { he: "רצפים ושיאים", en: "Streaks & Records" },
  "dashboard.currentStreak": { he: "רצף נוכחי", en: "Current Streak" },
  "dashboard.longestWin": { he: "רצף ניצחונות ארוך", en: "Longest Win Streak" },
  "dashboard.longestLoss": { he: "רצף הפסדים ארוך", en: "Longest Loss Streak" },
  "dashboard.bestTrade": { he: "עסקה הכי טובה", en: "Best Trade" },
  "dashboard.worstTrade": { he: "עסקה הכי גרועה", en: "Worst Trade" },
  "dashboard.noTrades": { he: "אין עסקאות עדיין", en: "No trades yet" },
  "dashboard.addFirstTrade": { he: "הוסף את העסקה הראשונה שלך", en: "Add your first trade" },
  "dashboard.addTrade": { he: "הוסף עסקה", en: "Add Trade" },
  "dashboard.viewAll": { he: "הצג הכל", en: "View All" },

  // Display modes
  "mode.money": { he: "כסף", en: "Money" },
  "mode.points": { he: "נקודות", en: "Points" },
  "mode.percentage": { he: "אחוזים", en: "Percentage" },
  "mode.balance": { he: "יתרה", en: "Balance" },

  // Settings page
  "settings.title": { he: "הגדרות מסחר", en: "Trading Settings" },
  "settings.font": { he: "פונט", en: "Font" },
  "settings.fontDesc": { he: "בחר את הפונט המועדף עליך לכל האתר", en: "Choose your preferred font for the entire site" },
  "settings.fontChanged": { he: "הפונט שונה בהצלחה", en: "Font changed successfully" },
  "settings.sampleText": { he: "זהו טקסט לדוגמה", en: "This is sample text" },
  "settings.theme": { he: "ערכת עיצוב", en: "Design Theme" },
  "settings.themeDesc": { he: "בחר את הצבעים והסגנון המועדפים עליך", en: "Choose your preferred colors and style" },
  "settings.displayMode": { he: "מצב תצוגה", en: "Display Mode" },
  "settings.darkMode": { he: "מצב כהה", en: "Dark Mode" },
  "settings.lightMode": { he: "מצב בהיר", en: "Light Mode" },
  "settings.primaryColor": { he: "צבע ראשי", en: "Primary Color" },
  "settings.visualStyle": { he: "סגנון עיצוב", en: "Visual Style" },
  "settings.breakEven": { he: "הגדרת Break Even", en: "Break Even Settings" },
  "settings.breakEvenDesc": { he: "הגדר טווח (בדולרים) שיחשב כ\"ברייק איבן\" (0) בסטטיסטיקות", en: "Set a range (in dollars) to count as \"break even\" (0) in statistics" },
  "settings.beMin": { he: "מינימום (הפסד מותר)", en: "Minimum (allowed loss)" },
  "settings.beMax": { he: "מקסימום (רווח מותר)", en: "Maximum (allowed profit)" },
  "settings.beMinExample": { he: "לדוגמה: -20 (הפסד של עד $20 יחשב כ-0)", en: "e.g. -20 (loss up to $20 counts as 0)" },
  "settings.beMaxExample": { he: "לדוגמה: 20 (רווח של עד $20 יחשב כ-0)", en: "e.g. 20 (profit up to $20 counts as 0)" },
  "settings.privacy": { he: "פרטיות פרופיל", en: "Profile Privacy" },
  "settings.privacyDesc": { he: "קבע אם אחרים יכולים לראות את הפרופיל וצבעי הגרף שלך", en: "Set whether others can see your profile and chart colors" },
  "settings.publicProfile": { he: "פרופיל ציבורי", en: "Public Profile" },
  "settings.privateProfile": { he: "פרופיל פרטי", en: "Private Profile" },
  "settings.publicDesc": { he: "אחרים יכולים לראות את הפרופיל וצבעי הגרף שלך", en: "Others can see your profile and chart colors" },
  "settings.privateDesc": { he: "רק אתה יכול לראות את הפרופיל שלך", en: "Only you can see your profile" },
  "settings.userGuide": { he: "מדריך משתמש", en: "User Guide" },
  "settings.userGuideDesc": { he: "הצג שוב את המדריך האינטראקטיבי למערכת", en: "Show the interactive guide again" },
  "settings.showGuide": { he: "הצג מדריך שוב", en: "Show Guide Again" },
  "settings.changePassword": { he: "שינוי סיסמה", en: "Change Password" },
  "settings.changePasswordDesc": { he: "שנה את הסיסמה שלך למערכת", en: "Change your system password" },
  "settings.currentPassword": { he: "סיסמה נוכחית", en: "Current Password" },
  "settings.newPassword": { he: "סיסמה חדשה", en: "New Password" },
  "settings.confirmPassword": { he: "אימות סיסמה חדשה", en: "Confirm New Password" },
  "settings.changeBtn": { he: "שנה סיסמה", en: "Change Password" },
  "settings.language": { he: "שפה", en: "Language" },
  "settings.languageDesc": { he: "בחר את שפת הממשק", en: "Choose the interface language" },
  "settings.hebrew": { he: "עברית", en: "Hebrew" },
  "settings.english": { he: "English", en: "English" },
  "settings.colorSchemeChanged": { he: "ערכת הצבעים שונתה", en: "Color scheme changed" },
  "settings.visualStyleChanged": { he: "סגנון העיצוב שונה", en: "Visual style changed" },
  "settings.profilePublic": { he: "הפרופיל שלך כעת ציבורי", en: "Your profile is now public" },
  "settings.profilePrivate": { he: "הפרופיל שלך כעת פרטי", en: "Your profile is now private" },
  "settings.updateError": { he: "שגיאה בעדכון ההגדרות", en: "Error updating settings" },

  // Trades page
  "trades.title": { he: "עסקאות", en: "Trades" },
  "trades.addTrade": { he: "הוסף עסקה", en: "Add Trade" },
  "trades.importCSV": { he: "ייבוא CSV", en: "Import CSV" },
  "trades.deleteAll": { he: "מחק הכל", en: "Delete All" },
  "trades.symbol": { he: "סימבול", en: "Symbol" },
  "trades.type": { he: "סוג", en: "Type" },
  "trades.entryDate": { he: "תאריך כניסה", en: "Entry Date" },
  "trades.pnl": { he: "רווח/הפסד", en: "P&L" },
  "trades.status": { he: "סטטוס", en: "Status" },
  "trades.actions": { he: "פעולות", en: "Actions" },

  // General
  "general.save": { he: "שמור", en: "Save" },
  "general.cancel": { he: "ביטול", en: "Cancel" },
  "general.delete": { he: "מחק", en: "Delete" },
  "general.edit": { he: "ערוך", en: "Edit" },
  "general.close": { he: "סגור", en: "Close" },
  "general.search": { he: "חיפוש", en: "Search" },
  "general.loading": { he: "טוען...", en: "Loading..." },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = "app-language";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return (saved === "en" || saved === "he") ? saved : "he";
  });

  const isRTL = language === "he";

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, language);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", language);
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry["he"] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
