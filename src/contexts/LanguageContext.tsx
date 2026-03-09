import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "he" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  // Sidebar Navigation
  "nav.dashboard": { he: "דף ראשי", en: "Dashboard" },
  "nav.trades": { he: "עסקאות", en: "Trades" },
  "nav.statistics": { he: "סטטיסטיקות", en: "Statistics" },
  "nav.strategies": { he: "אסטרטגיות", en: "Strategies" },
  "nav.backtesting": { he: "Gozlan Forever Model", en: "Gozlan Forever Model" },
  "nav.community": { he: "קהילה", en: "Community" },
  "nav.giveaways": { he: "הגרלות", en: "Giveaways" },
  "nav.profile": { he: "פרופיל", en: "Profile" },
  "nav.settings": { he: "הגדרות", en: "Settings" },
  "nav.mentor": { he: "לוח מנטור", en: "Mentor Board" },
  "nav.mentorChat": { he: "צ'אט עם המנטור", en: "Mentor Chat" },
  "nav.admin": { he: "ניהול מערכת", en: "Admin" },
  "nav.logout": { he: "התנתק", en: "Sign Out" },
  "nav.navigation": { he: "ניווט", en: "Navigation" },
  "nav.account": { he: "חשבון", en: "Account" },

  // Dashboard
  "dashboard.title": { he: "דשבורד", en: "Dashboard" },
  "dashboard.subtitle": { he: "ניתוח ביצועים", en: "Performance Analysis" },
  "dashboard.addTrade": { he: "הוסף עסקה", en: "Add Trade" },
  "dashboard.addTradeShort": { he: "הוסף", en: "Add" },
  "dashboard.addFirstTrade": { he: "הוסף עסקה ראשונה", en: "Add First Trade" },
  "dashboard.noTrades": { he: "אין עסקאות להצגה", en: "No trades to display" },
  "dashboard.firstTrade": { he: "הוסף את העסקה הראשונה שלך", en: "Add your first trade" },

  // Dashboard stat cards
  "stats.netPnl": { he: "Net P&L", en: "Net P&L" },
  "stats.netPnlTooltip": { he: "רווח/הפסד נקי מצטבר", en: "Cumulative net profit/loss" },
  "stats.tradeWin": { he: "Trade win %", en: "Trade Win %" },
  "stats.tradeWinTooltip": { he: "אחוז עסקאות מנצחות", en: "Percentage of winning trades" },
  "stats.profitFactor": { he: "Profit factor", en: "Profit Factor" },
  "stats.profitFactorTooltip": { he: "יחס רווח גולמי להפסד גולמי", en: "Gross profit to gross loss ratio" },
  "stats.dayWin": { he: "Day win %", en: "Day Win %" },
  "stats.dayWinTooltip": { he: "אחוז ימי מסחר רווחיים", en: "Percentage of profitable trading days" },
  "stats.avgWinLoss": { he: "Avg win/loss trade", en: "Avg Win/Loss Trade" },
  "stats.avgWinLossTooltip": { he: "יחס ממוצע רווח לממוצע הפסד", en: "Average win to average loss ratio" },

  // Dashboard sections
  "dashboard.streaks": { he: "רצפים ושיאים", en: "Streaks & Records" },
  "dashboard.currentStreak": { he: "רצף נוכחי", en: "Current Streak" },
  "dashboard.winsInRow": { he: "זכיות ברצף", en: "Wins in a row" },
  "dashboard.lossesInRow": { he: "הפסדים ברצף", en: "Losses in a row" },
  "dashboard.streakRecords": { he: "שיאי רצפים", en: "Streak Records" },
  "dashboard.bestTrade": { he: "עסקה הכי טובה", en: "Best Trade" },
  "dashboard.worstTrade": { he: "עסקה הכי גרועה", en: "Worst Trade" },
  "dashboard.weeklyPerf": { he: "ביצועים שבועיים", en: "Weekly Performance" },
  "dashboard.recentTrades": { he: "עסקאות אחרונות", en: "Recent Trades" },
  "dashboard.dayPerformance": { he: "ביצועים לפי יום", en: "Day of Week Performance" },
  "dashboard.equityCurve": { he: "עקומת הון", en: "Equity Curve" },
  "dashboard.notEnoughData": { he: "אין מספיק נתונים", en: "Not enough data" },
  "dashboard.monthlyBreakdown": { he: "פירוט חודשי", en: "Monthly Breakdown" },
  "dashboard.day": { he: "יום", en: "Day" },
  "dashboard.trade": { he: "עסקה", en: "Trade" },
  "dashboard.total": { he: "סה\"כ", en: "Total" },
  "dashboard.trades": { he: "עסקאות", en: "trades" },
  "dashboard.success": { he: "הצלחה", en: "success" },
  "dashboard.times": { he: "פעמים", en: "times" },

  // Display modes
  "mode.money": { he: "כסף", en: "Money" },
  "mode.points": { he: "נקודות", en: "Points" },
  "mode.percentage": { he: "אחוזים", en: "Percentage" },
  "mode.balance": { he: "מצב תיק", en: "Portfolio" },

  // Monthly view modes
  "monthly.pnl": { he: "רווח/הפסד", en: "P&L" },
  "monthly.trades": { he: "עסקאות", en: "Trades" },
  "monthly.winrate": { he: "הצלחה", en: "Win Rate" },
  "monthly.points": { he: "נקודות", en: "Points" },

  // Day names
  "day.sunday": { he: "ראשון", en: "Sun" },
  "day.monday": { he: "שני", en: "Mon" },
  "day.tuesday": { he: "שלישי", en: "Tue" },
  "day.wednesday": { he: "רביעי", en: "Wed" },
  "day.thursday": { he: "חמישי", en: "Thu" },
  "day.friday": { he: "שישי", en: "Fri" },
  "day.saturday": { he: "שבת", en: "Sat" },

  // Short day names (for weekly chart)
  "day.short.sun": { he: "א׳", en: "Sun" },
  "day.short.mon": { he: "ב׳", en: "Mon" },
  "day.short.tue": { he: "ג׳", en: "Tue" },
  "day.short.wed": { he: "ד׳", en: "Wed" },
  "day.short.thu": { he: "ה׳", en: "Thu" },
  "day.short.fri": { he: "ו׳", en: "Fri" },
  "day.short.sat": { he: "ש׳", en: "Sat" },

  // Trades page
  "trades.title": { he: "עסקאות", en: "Trades" },
  "trades.addTrade": { he: "הוסף עסקה", en: "Add Trade" },
  "trades.addTradeShort": { he: "הוסף", en: "Add" },
  "trades.importCSV": { he: "יבוא CSV", en: "Import CSV" },
  "trades.deleteAll": { he: "מחק הכל", en: "Delete All" },
  "trades.noTrades": { he: "אין עסקאות להצגה", en: "No trades to display" },
  "trades.addFirst": { he: "הוסף עסקה ראשונה", en: "Add your first trade" },
  "trades.allDeleted": { he: "כל העסקאות נמחקו", en: "All trades deleted" },
  "trades.allDeletedDesc": { he: "כל העסקאות הוסרו מהמערכת", en: "All trades have been removed" },
  "trades.deleted": { he: "העסקה נמחקה", en: "Trade deleted" },
  "trades.deletedDesc": { he: "העסקה הוסרה בהצלחה", en: "Trade removed successfully" },
  "trades.deleteConfirm": { he: "האם אתה בטוח?", en: "Are you sure?" },
  "trades.deleteConfirmDesc": { he: "פעולה זו תמחק את כל העסקאות שלך לצמיתות. לא ניתן לבטל פעולה זו.", en: "This action will permanently delete all your trades. This cannot be undone." },
  "trades.netPnl": { he: "רווח/הפסד נטו", en: "Net P&L" },
  "trades.winRate": { he: "אחוז הצלחה", en: "Win Rate" },
  "trades.avgTime": { he: "זמן ממוצע", en: "Avg Duration" },
  "trades.loss": { he: "הפסד", en: "Loss" },
  "trades.profit": { he: "רווח", en: "Profit" },
  "trades.fromDate": { he: "מתאריך", en: "From" },
  "trades.toDate": { he: "עד תאריך", en: "To" },
  "trades.filters": { he: "מסננים", en: "Filters" },
  "trades.moneyBtn": { he: "כסף $", en: "Money $" },
  "trades.pointsBtn": { he: "נקודות", en: "Points" },
  "trades.count": { he: "עסקאות", en: "trades" },

  // Table headers
  "table.image": { he: "תמונה", en: "Image" },
  "table.date": { he: "תאריך", en: "Date" },
  "table.symbol": { he: "סימול", en: "Symbol" },
  "table.type": { he: "סוג", en: "Type" },
  "table.strategy": { he: "אסטרטגיה", en: "Strategy" },
  "table.confirmations": { he: "אישורים", en: "Confirmations" },
  "table.tags": { he: "תגיות", en: "Tags" },
  "table.rr": { he: "RR", en: "RR" },
  "table.pnl": { he: "רווח/הפסד", en: "P&L" },
  "table.rating": { he: "דירוג", en: "Rating" },
  "table.actions": { he: "פעולות", en: "Actions" },

  // Strategies page
  "strategies.title": { he: "אסטרטגיות", en: "Strategies" },
  "strategies.new": { he: "אסטרטגיה חדשה", en: "New Strategy" },
  "strategies.count": { he: "אסטרטגיות", en: "strategies" },
  "strategies.noStrategies": { he: "אין אסטרטגיות עדיין", en: "No strategies yet" },
  "strategies.createFirst": { he: "צור אסטרטגיה ראשונה", en: "Create your first strategy" },
  "strategies.created": { he: "האסטרטגיה נוצרה!", en: "Strategy created!" },
  "strategies.updated": { he: "האסטרטגיה עודכנה!", en: "Strategy updated!" },
  "strategies.deleteConfirm": { he: "מחק אסטרטגיה?", en: "Delete strategy?" },
  "strategies.deleteDesc": { he: "פעולה זו תמחק את האסטרטגיה לצמיתות.", en: "This will permanently delete the strategy." },
  "strategies.deleted": { he: "האסטרטגיה נמחקה", en: "Strategy deleted" },
  "strategies.entryRules": { he: "כללי כניסה:", en: "Entry Rules:" },
  "strategies.exitRules": { he: "כללי יציאה:", en: "Exit Rules:" },
  "strategies.risk": { he: "סיכון:", en: "Risk:" },
  "strategies.nameError": { he: "יש למלא שם אסטרטגיה", en: "Strategy name is required" },
  "strategies.saveError": { he: "לא ניתן לשמור את האסטרטגיה", en: "Could not save the strategy" },
  "strategies.deleteError": { he: "לא ניתן למחוק את האסטרטגיה", en: "Could not delete the strategy" },

  // Confirmation related
  "confirmation.added": { he: "אישור נוסף", en: "Confirmation added" },
  "confirmation.deleted": { he: "אישור נמחק", en: "Confirmation deleted" },
  "confirmation.deleteError": { he: "לא ניתן למחוק את האישור", en: "Could not delete confirmation" },
  "confirmation.addError": { he: "לא ניתן להוסיף את האישור", en: "Could not add confirmation" },

  // Header
  "header.install": { he: "התקן", en: "Install" },
  "header.installApp": { he: "התקנת האפליקציה", en: "Install App" },
  "header.installDesc": { he: "האם ברצונך להתקין את GozlanJournal כאפליקציה על המכשיר שלך?", en: "Would you like to install GozlanJournal as an app on your device?" },
  "header.installBtn": { he: "התקן", en: "Install" },
  "header.installSuccess": { he: "האפליקציה הותקנה בהצלחה!", en: "App installed successfully!" },
  "header.notifications": { he: "התראות", en: "Notifications" },
  "header.toggleTheme": { he: "החלף מצב תצוגה", en: "Toggle theme" },

  // Layout
  "layout.openMenu": { he: "פתח תפריט", en: "Open menu" },

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

  // Profile page
  "profile.title": { he: "פרופיל", en: "Profile" },
  "profile.firstName": { he: "שם פרטי", en: "First Name" },
  "profile.lastName": { he: "שם משפחה", en: "Last Name" },
  "profile.username": { he: "שם משתמש", en: "Username" },
  "profile.favoriteAsset": { he: "נכס מועדף", en: "Favorite Asset" },
  "profile.save": { he: "שמור שינויים", en: "Save Changes" },
  "profile.saving": { he: "שומר...", en: "Saving..." },
  "profile.saved": { he: "הפרופיל עודכן בהצלחה", en: "Profile updated successfully" },
  "profile.saveError": { he: "שגיאה בעדכון הפרופיל", en: "Error updating profile" },
  "profile.chartColors": { he: "צבעי גרף", en: "Chart Colors" },

  // General
  "general.save": { he: "שמור", en: "Save" },
  "general.cancel": { he: "ביטול", en: "Cancel" },
  "general.delete": { he: "מחק", en: "Delete" },
  "general.edit": { he: "ערוך", en: "Edit" },
  "general.close": { he: "סגור", en: "Close" },
  "general.search": { he: "חיפוש", en: "Search" },
  "general.loading": { he: "טוען...", en: "Loading..." },
  "general.error": { he: "שגיאה", en: "Error" },
  "general.errorGeneric": { he: "לא ניתן לבצע את הפעולה", en: "Could not perform the action" },
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
