
# שיפור מקיף של יומן המסחר - כל הפיצ'רים

## סקירה כללית
מימוש 6 שיפורים מרכזיים ליומן המסחר: הערות יומיות, מעקב יעדים, שיפור Playbook, דשבורד ניהול סיכונים, השוואת תקופות, וסיכום שבועי אוטומטי.

---

## 1. הערות יומיות (Daily Journal)

מערכת לכתיבת הערות חופשיות לכל יום מסחר -- תכנון לפני המסחר, סיכום אחרי, ותחושות.

**מה יתווסף:**
- טבלה חדשה `daily_notes` במסד הנתונים (user_id, date, pre_market_note, post_market_note, mood_rating 1-5)
- כפתור "הערת יום" בלחיצה על יום בלוח השנה בדשבורד
- דיאלוג עם שני שדות טקסט: "תכנון לפני מסחר" ו"סיכום אחרי מסחר" + דירוג מצב רוח (1-5 כוכבים)
- אינדיקטור קטן (עיגול כחול) בלוח השנה על ימים שיש בהם הערות

---

## 2. מעקב יעדים (Goals Tracker)

הגדרת יעדים יומיים, שבועיים וחודשיים עם מעקב התקדמות ויזואלי.

**מה יתווסף:**
- טבלה חדשה `trading_goals` (user_id, portfolio_id, goal_type [daily/weekly/monthly], metric [pnl/trades/winrate/points], target_value, period_start, period_end)
- כרטיס "יעדים" חדש בדשבורד עם Progress Rings (כבר קיים קומפוננט ProgressRing)
- דיאלוג הגדרת יעד: בחירת סוג (יומי/שבועי/חודשי), מטריקה (PnL / מספר עסקאות / אחוז הצלחה), ערך יעד
- חישוב אוטומטי של ההתקדמות ביחס ליעד

---

## 3. שיפור Playbook (אסטרטגיות)

העשרת עמוד האסטרטגיות עם כללי כניסה/יציאה, צילומי מסך, וקישור לעסקאות.

**מה יתווסף:**
- עמודות חדשות לטבלת `strategies`: `entry_rules TEXT`, `exit_rules TEXT`, `screenshot_url TEXT`, `risk_per_trade TEXT`
- בטופס יצירת/עריכת אסטרטגיה: שדות חדשים לכללי כניסה, כללי יציאה, סיכון לעסקה, והעלאת תמונה
- בכרטיס האסטרטגיה: הצגת כל המידע + ספירת עסקאות שהשתמשו באסטרטגיה + אחוז הצלחה

---

## 4. Risk Management Dashboard

כרטיסייה חדשה בדף הסטטיסטיקות עם מטריקות סיכון מתקדמות.

**מה יתווסף:**
- טאב חדש "ניהול סיכונים" בדף Statistics
- מטריקות: Max Drawdown (כבר מחושב), Sharpe Ratio, Expectancy, Risk per Trade, Recovery Factor
- גרף Drawdown לאורך זמן (Area Chart)
- גרף Risk/Reward Distribution (Scatter/Bar)
- התראות כשיש חריגה מהסיכון המותר

---

## 5. השוואת תקופות (Period Comparison)

השוואה ויזואלית בין שתי תקופות זמן.

**מה יתווסף:**
- טאב חדש "השוואה" בדף Statistics
- בחירת שתי תקופות (שבוע/חודש/טווח מותאם)
- תצוגה צמודה (Side by Side) של: PnL, Win Rate, מספר עסקאות, ממוצע לעסקה, Profit Factor
- חיצים ואחוזי שינוי (למשל: "+15% שיפור ב-Win Rate")

---

## 6. סיכום שבועי אוטומטי (Weekly Review)

דו"ח שבועי שמזהה דפוסים ומציג תובנות.

**מה יתווסף:**
- כרטיס "סיכום שבועי" בדשבורד שמופיע בסוף כל שבוע
- חישוב אוטומטי: PnL שבועי, המנטל סטייט הכי מוצלח, הטעות הכי נפוצה, היום הכי רווחי, ה-Setup הכי טוב
- הצגת "כרטיס דו"ח" עם ציון שבועי (A/B/C/D/F)
- אפשרות לשתף את הסיכום

---

## פרטים טכניים

### מיגרציות מסד נתונים

```text
טבלה 1: daily_notes
  - id UUID PRIMARY KEY
  - user_id UUID REFERENCES auth.users(id)  -- no FK, just store
  - portfolio_id UUID
  - note_date DATE NOT NULL
  - pre_market_note TEXT
  - post_market_note TEXT
  - mood_rating INTEGER (1-5)
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
  + RLS: user_id = auth.uid()
  + UNIQUE constraint on (user_id, note_date, portfolio_id)

טבלה 2: trading_goals
  - id UUID PRIMARY KEY
  - user_id UUID
  - portfolio_id UUID
  - goal_type TEXT (daily/weekly/monthly)
  - metric TEXT (pnl/trades/winrate/points)
  - target_value NUMERIC NOT NULL
  - is_active BOOLEAN DEFAULT true
  - created_at TIMESTAMPTZ DEFAULT now()
  + RLS: user_id = auth.uid()

שינוי טבלה: strategies
  + entry_rules TEXT
  + exit_rules TEXT
  + screenshot_url TEXT
  + risk_per_trade TEXT
```

### קבצים חדשים
1. `src/components/dashboard/DailyNoteDialog.tsx` -- דיאלוג הערת יום
2. `src/components/dashboard/GoalsTracker.tsx` -- כרטיס מעקב יעדים
3. `src/components/dashboard/GoalSettingDialog.tsx` -- דיאלוג הגדרת יעד
4. `src/components/dashboard/WeeklyReview.tsx` -- כרטיס סיכום שבועי
5. `src/components/statistics/RiskManagement.tsx` -- טאב ניהול סיכונים
6. `src/components/statistics/PeriodComparison.tsx` -- טאב השוואת תקופות
7. `src/hooks/useDailyNotes.ts` -- Hook להערות יומיות
8. `src/hooks/useTradingGoals.ts` -- Hook ליעדים

### קבצים שישתנו
1. `src/pages/Dashboard.tsx` -- הוספת GoalsTracker, WeeklyReview, DailyNoteDialog
2. `src/pages/Statistics.tsx` -- הוספת טאבים RiskManagement, PeriodComparison
3. `src/pages/Strategies.tsx` -- שדות חדשים בטופס + תצוגה מורחבת
4. `src/components/dashboard/TradingCalendar.tsx` -- אינדיקטור הערות + כפתור הוספת הערה

### סדר מימוש
1. מיגרציית מסד נתונים (daily_notes + trading_goals + strategies columns)
2. Hooks חדשים (useDailyNotes, useTradingGoals)
3. Daily Journal (דיאלוג + אינטגרציה בלוח שנה)
4. Goals Tracker (קומפוננט + דיאלוג הגדרה)
5. Strategies Playbook (שדות חדשים)
6. Risk Management טאב
7. Period Comparison טאב
8. Weekly Review כרטיס
