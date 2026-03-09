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
  "dashboard.total": { he: 'סה"כ', en: "Total" },
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

  // Short day names
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
  "trades.deleteTrade": { he: "מחק עסקה", en: "Delete Trade" },
  "trades.deleteTradeConfirm": { he: "האם אתה בטוח שברצונך למחוק את העסקה על", en: "Are you sure you want to delete the trade on" },
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
  "trades.errorDelete": { he: "לא ניתן למחוק את העסקאות", en: "Could not delete trades" },
  "trades.errorDeleteTrade": { he: "לא ניתן למחוק את העסקה", en: "Could not delete the trade" },
  "trades.addConfirmation": { he: "הוסף אישור", en: "Add Confirmation" },
  "trades.selectStrategy": { he: "בחר מאסטרטגיה קיימת", en: "Select from existing strategy" },
  "trades.selectConfirmation": { he: "בחר אישור מאסטרטגיה...", en: "Select confirmation from strategy..." },
  "trades.enterManually": { he: "הזן ידנית", en: "Enter manually" },
  "trades.confirmationName": { he: "שם האישור", en: "Confirmation name" },
  "trades.enterConfirmation": { he: "הזן שם אישור...", en: "Enter confirmation name..." },

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
  "strategies.editStrategy": { he: "ערוך אסטרטגיה", en: "Edit Strategy" },
  "strategies.newStrategy": { he: "אסטרטגיה חדשה", en: "New Strategy" },
  "strategies.strategyName": { he: "שם האסטרטגיה *", en: "Strategy Name *" },
  "strategies.description": { he: "תיאור", en: "Description" },
  "strategies.describeStrategy": { he: "תאר את האסטרטגיה...", en: "Describe the strategy..." },
  "strategies.entryRulesLabel": { he: "כללי כניסה", en: "Entry Rules" },
  "strategies.exitRulesLabel": { he: "כללי יציאה", en: "Exit Rules" },
  "strategies.whenEnter": { he: "מתי נכנסים?", en: "When to enter?" },
  "strategies.whenExit": { he: "מתי יוצאים?", en: "When to exit?" },
  "strategies.riskPerTrade": { he: "סיכון לעסקה", en: "Risk Per Trade" },
  "strategies.riskExample": { he: "למשל: 1% מהחשבון", en: "e.g. 1% of account" },
  "strategies.confirmationsLabel": { he: "אישורים (Confirmations)", en: "Confirmations" },
  "strategies.addConfirmation": { he: "הוסף אישור...", en: "Add confirmation..." },
  "strategies.createStrategy": { he: "צור אסטרטגיה", en: "Create Strategy" },

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
  "settings.breakEvenDesc": { he: 'הגדר טווח (בדולרים) שיחשב כ"ברייק איבן" (0) בסטטיסטיקות', en: 'Set a range (in dollars) to count as "break even" (0) in statistics' },
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
  "profile.personalInfo": { he: "פרטים אישיים", en: "Personal Information" },
  "profile.editProfile": { he: "ערוך את הפרופיל שלך", en: "Edit your profile" },
  "profile.email": { he: "אימייל", en: "Email" },
  "profile.firstName": { he: "שם פרטי", en: "First Name" },
  "profile.lastName": { he: "שם משפחה", en: "Last Name" },
  "profile.username": { he: "שם משתמש", en: "Username" },
  "profile.favoriteAsset": { he: "נכס מועדף", en: "Favorite Asset" },
  "profile.selectAsset": { he: "בחר נכס מועדף", en: "Select favorite asset" },
  "profile.save": { he: "שמור שינויים", en: "Save Changes" },
  "profile.saving": { he: "שומר...", en: "Saving..." },
  "profile.saved": { he: "הפרטים נשמרו בהצלחה", en: "Details saved successfully" },
  "profile.saveError": { he: "שגיאה בשמירת הפרטים", en: "Error saving details" },
  "profile.chartColors": { he: "צבעי גרף", en: "Chart Colors" },
  "profile.chartColorsDesc": { he: "התאם את צבעי הגרף שלך כדי שאחרים יוכלו להעתיק", en: "Customize your chart colors so others can copy them" },
  "profile.background": { he: "רקע", en: "Background" },
  "profile.candleBody": { he: "גוף הנר (Body)", en: "Candle Body" },
  "profile.borders": { he: "גבול (Borders)", en: "Borders" },
  "profile.wick": { he: "פתיל (Wick)", en: "Wick" },
  "profile.up": { he: "עלייה", en: "Up" },
  "profile.down": { he: "ירידה", en: "Down" },
  "profile.preview": { he: "תצוגה מקדימה", en: "Preview" },
  "profile.saveColors": { he: "שמור צבעים", en: "Save Colors" },
  "profile.imageOnly": { he: "יש להעלות קובץ תמונה בלבד", en: "Please upload an image file only" },
  "profile.maxSize": { he: "גודל הקובץ המקסימלי הוא 2MB", en: "Maximum file size is 2MB" },
  "profile.uploaded": { he: "התמונה הועלתה בהצלחה", en: "Image uploaded successfully" },
  "profile.uploadError": { he: "שגיאה בהעלאת התמונה", en: "Error uploading image" },

  // Statistics page
  "statistics.title": { he: "סטטיסטיקות מתקדמות", en: "Advanced Statistics" },
  "statistics.noData": { he: "אין נתונים להצגה", en: "No data to display" },
  "statistics.addTrades": { he: "הוסף עסקאות כדי לראות סטטיסטיקות", en: "Add trades to see statistics" },
  "statistics.overview": { he: "סקירה", en: "Overview" },
  "statistics.aiSummary": { he: "סיכום AI", en: "AI Summary" },
  "statistics.reports": { he: "דוחות", en: "Reports" },
  "statistics.risks": { he: "סיכונים", en: "Risks" },
  "statistics.compare": { he: "השוואה", en: "Compare" },
  "statistics.ai": { he: "AI", en: "AI" },
  "statistics.avgProfit": { he: "ממוצע רווח", en: "Avg Profit" },
  "statistics.avgLoss": { he: "ממוצע הפסד", en: "Avg Loss" },
  "statistics.winRate": { he: "אחוז הצלחה", en: "Win Rate" },
  "statistics.avgPerTrade": { he: "ממוצע לעסקה", en: "Avg Per Trade" },
  "statistics.outOf": { he: "מתוך", en: "out of" },
  "statistics.pnlClassification": { he: "סיווג רווח/הפסד", en: "P&L Classification" },
  "statistics.maxProfit": { he: "רווח מקס׳", en: "Max Profit" },
  "statistics.maxLoss": { he: "הפסד מקס׳", en: "Max Loss" },
  "statistics.longShortRatio": { he: "יחס לונג/שורט", en: "Long/Short Ratio" },
  "statistics.long": { he: "לונג:", en: "Long:" },
  "statistics.short": { he: "שורט:", en: "Short:" },
  "statistics.longPercent": { he: "לונג", en: "Long" },
  "statistics.shortPercent": { he: "שורט", en: "Short" },
  "statistics.confirmationAnalysis": { he: "ניתוח אישורי אסטרטגיה", en: "Strategy Confirmation Analysis" },
  "statistics.confirmationDesc": { he: "אילו אישורים מהאסטרטגיות שלך מובילים להצלחה גבוהה יותר?", en: "Which confirmations from your strategies lead to higher success?" },
  "statistics.topWinner": { he: "הכי מנצח", en: "Top Winner" },
  "statistics.tradesCount": { he: "עסקאות", en: "trades" },
  "statistics.successRate": { he: "הצלחה", en: "success" },
  "statistics.average": { he: "ממוצע", en: "Avg" },
  "statistics.totalLabel": { he: "סה״כ", en: "Total" },
  "statistics.insightConfirmation": { he: "רוב העסקאות המנצחות שלך כוללות את האישור", en: "Most of your winning trades include the confirmation" },
  "statistics.withSuccess": { he: "עם", en: "with" },
  "statistics.mentalAnalysis": { he: "ניתוח לפי מצב מנטלי", en: "Mental State Analysis" },
  "statistics.mentalDesc": { he: "איך המצב הרגשי שלך משפיע על הביצועים?", en: "How does your emotional state affect performance?" },
  "statistics.insightMental": { he: "כשאתה", en: "When you are" },
  "statistics.youHave": { he: "יש לך", en: "you have" },
  "statistics.setupAnalysis": { he: "ניתוח לפי סוג Setup", en: "Setup Type Analysis" },
  "statistics.mistakeAnalysis": { he: "ניתוח טעויות", en: "Mistake Analysis" },
  "statistics.mistakeDesc": { he: "הטעויות הנפוצות ביותר והעלות שלהן", en: "Most common mistakes and their cost" },
  "statistics.timesCount": { he: "פעמים", en: "times" },
  "statistics.attentionMistake": { he: "שים לב: הטעות", en: "Attention: The mistake" },
  "statistics.costYou": { he: "עלתה לך", en: "cost you" },
  "statistics.inTrades": { he: "ב-", en: "in " },
  "statistics.sessionAnalysis": { he: "ניתוח לפי סשן מסחר", en: "Trading Session Analysis" },
  "statistics.sessionSuccess": { he: "אחוז הצלחה:", en: "Win Rate:" },
  "statistics.sessionPnl": { he: "רווח/הפסד:", en: "P&L:" },
  "statistics.sessionInsight": { he: "הסשן הרווחי ביותר שלך הוא", en: "Your most profitable session is" },
  "statistics.withProfit": { he: "עם", en: "with" },
  "statistics.profitWord": { he: "רווח", en: "profit" },
  "statistics.profitableAsset": { he: "הנכס הרווחי", en: "Most Profitable" },
  "statistics.losingAsset": { he: "הנכס המפסיד", en: "Most Losing" },
  "statistics.bestDayName": { he: "היום הרווחי", en: "Best Day" },
  "statistics.worstDayName": { he: "היום המפסיד", en: "Worst Day" },
  "statistics.maxWinStreak": { he: "רצף ניצחונות", en: "Win Streak" },
  "statistics.maxLossStreak": { he: "רצף הפסדים", en: "Loss Streak" },
  "statistics.maxDrawdown": { he: "ירידה מקסימלית", en: "Max Drawdown" },
  "statistics.avgContracts": { he: "ממוצע חוזים", en: "Avg Contracts" },
  "statistics.bestDayPnl": { he: "יום הכי טוב", en: "Best Day" },
  "statistics.worstDayPnl": { he: "יום הכי גרוע", en: "Worst Day" },
  "statistics.grossProfit": { he: "רווח גולמי", en: "Gross Profit" },
  "statistics.grossLoss": { he: "הפסד גולמי", en: "Gross Loss" },
  "statistics.longStats": { he: "סטטיסטיקות לונג", en: "Long Statistics" },
  "statistics.shortStats": { he: "סטטיסטיקות שורט", en: "Short Statistics" },
  "statistics.avgWin": { he: "ממוצע רווח:", en: "Avg Win:" },
  "statistics.avgLossLabel": { he: "ממוצע הפסד:", en: "Avg Loss:" },
  "statistics.avgDuration": { he: "זמן ממוצע", en: "Avg Duration" },

  // Session names
  "session.asia": { he: "אסיה", en: "Asia" },
  "session.london": { he: "לונדון", en: "London" },
  "session.new_york": { he: "ניו יורק", en: "New York" },

  // Day names full
  "dayFull.0": { he: "ראשון", en: "Sunday" },
  "dayFull.1": { he: "שני", en: "Monday" },
  "dayFull.2": { he: "שלישי", en: "Tuesday" },
  "dayFull.3": { he: "רביעי", en: "Wednesday" },
  "dayFull.4": { he: "חמישי", en: "Thursday" },
  "dayFull.5": { he: "שישי", en: "Friday" },
  "dayFull.6": { he: "שבת", en: "Saturday" },

  // Giveaways page
  "giveaways.title": { he: "הגרלות", en: "Giveaways" },
  "giveaways.comingSoon": { he: "בקרוב...", en: "Coming Soon..." },
  "giveaways.workingOn": { he: "אנחנו עובדים על משהו מיוחד!", en: "We're working on something special!" },
  "giveaways.exclusive": { he: "הגרלות ופרסים בלעדיים לחברי הקהילה", en: "Exclusive giveaways and prizes for community members" },
  "giveaways.notify": { he: "עדכנו אותי כשזה מוכן", en: "Notify me when it's ready" },

  // Community
  "community.title": { he: "קהילה", en: "Community" },

  // Mentor Dashboard
  "mentor.title": { he: "לוח מנטור", en: "Mentor Board" },
  "mentor.students": { he: "תלמידים", en: "Students" },
  "mentor.pending": { he: "ממתינות", en: "Pending" },
  "mentor.noStudents": { he: "אין לך תלמידים עדיין", en: "You have no students yet" },
  "mentor.noStudentsDesc": { he: "תלמידים יכולים להוסיף אותך כמנטור דרך עמוד ההגדרות שלהם באמצעות שם המשתמש שלך", en: "Students can add you as a mentor through their settings page using your username" },
  "mentor.noteAdded": { he: "ההערה נוספה בהצלחה", en: "Note added successfully" },
  "mentor.noteError": { he: "שגיאה בהוספת ההערה", en: "Error adding note" },
  "mentor.feedbackAdded": { he: "המשוב נוסף בהצלחה", en: "Feedback added successfully" },
  "mentor.feedbackError": { he: "שגיאה בהוספת המשוב", en: "Error adding feedback" },
  "mentor.studentRemoved": { he: "התלמיד הוסר בהצלחה", en: "Student removed successfully" },
  "mentor.studentRemoveError": { he: "שגיאה בהסרת התלמיד", en: "Error removing student" },
  "mentor.loadError": { he: "שגיאה בטעינת נתוני התלמיד", en: "Error loading student data" },
  "mentor.messageError": { he: "שגיאה בשליחת ההודעה", en: "Error sending message" },
  "mentor.authError": { he: "שגיאה באימות המשתמש", en: "Authentication error" },

  // Mentor Chat
  "mentorChat.title": { he: "צ'אט עם המנטור", en: "Mentor Chat" },
  "mentorChat.subtitle": { he: "התכתב עם המנטור שלך בזמן אמת", en: "Chat with your mentor in real-time" },
  "mentorChat.noMentor": { he: "אין לך מנטור מאושר", en: "You don't have an approved mentor" },
  "mentorChat.noMentorDesc": { he: "כדי לשלוח הודעות למנטור, עליך להיות מחובר למנטור מאושר.", en: "To send messages to your mentor, you need to be connected to an approved mentor." },
  "mentorChat.goSettings": { he: "עבור להגדרות", en: "Go to Settings" },
  "mentorChat.myMentor": { he: "המנטור שלי", en: "My Mentor" },
  "mentorChat.noMessages": { he: "אין הודעות עדיין. התחל את השיחה!", en: "No messages yet. Start the conversation!" },
  "mentorChat.writeMessage": { he: "כתוב הודעה...", en: "Write a message..." },
  "mentorChat.shareTrade": { he: "שתף עסקה", en: "Share Trade" },
  "mentorChat.sharedTrade": { he: "שיתפתי עסקה:", en: "Shared a trade:" },
  "mentorChat.selectTrade": { he: "בחר עסקה לשיתוף", en: "Select a trade to share" },
  "mentorChat.noTrades": { he: "אין לך עסקאות עדיין", en: "You have no trades yet" },

  // Admin page
  "admin.title": { he: "ניהול מערכת", en: "System Admin" },
  "admin.dashboard": { he: "לוח בקרה", en: "Control Panel" },
  "admin.exportCSV": { he: "ייצוא CSV", en: "Export CSV" },
  "admin.refresh": { he: "רענן", en: "Refresh" },
  "admin.users": { he: "משתמשים", en: "Users" },
  "admin.thisWeek": { he: "השבוע", en: "this week" },
  "admin.tradesLabel": { he: "עסקאות", en: "Trades" },
  "admin.avgLabel": { he: "ממוצע", en: "average" },
  "admin.posts": { he: "פוסטים", en: "Posts" },
  "admin.comments": { he: "תגובות", en: "comments" },
  "admin.likes": { he: "לייקים", en: "Likes" },
  "admin.interactions": { he: "אינטראקציות", en: "interactions" },
  "admin.dataRefreshed": { he: "הנתונים עודכנו", en: "Data refreshed" },
  "admin.roleAdded": { he: "התפקיד נוסף בהצלחה", en: "Role added successfully" },
  "admin.roleExists": { he: "למשתמש כבר יש את התפקיד הזה", en: "User already has this role" },
  "admin.roleAddError": { he: "שגיאה בהוספת התפקיד", en: "Error adding role" },
  "admin.roleRemoved": { he: "התפקיד הוסר בהצלחה", en: "Role removed successfully" },
  "admin.roleRemoveError": { he: "שגיאה בהסרת התפקיד", en: "Error removing role" },
  "admin.postDeleted": { he: "הפוסט נמחק בהצלחה", en: "Post deleted successfully" },
  "admin.postDeleteError": { he: "שגיאה במחיקת הפוסט", en: "Error deleting post" },
  "admin.fileDownloaded": { he: "הקובץ הורד בהצלחה", en: "File downloaded successfully" },
  "admin.quoteUpdated": { he: "הציטוט עודכן בהצלחה", en: "Quote updated successfully" },

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
  "general.add": { he: "הוסף", en: "Add" },
  "general.insight": { he: "תובנה:", en: "Insight:" },
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
