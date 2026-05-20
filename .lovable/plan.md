
## ניהול תיקים (Prop Portfolio Management) — תכנון

פיצ'ר חדש לעמוד `/prop-portfolios` שעוקב אחרי תיקי פרופ-פרמס (Topstep, Apex, FundedNext, Lucid וכו'), מסנכרן באופן אוטומטי עם טבלת `trades` הקיימת, ומחשב אוטומטית סטטוס "זכאי למשיכה".

הערה חשובה: כבר קיימת טבלת `portfolios` (תיקים פנימיים של היומן). כדי לא לשבור את הקיים, הפיצ'ר ישתמש בטבלה חדשה ונפרדת `prop_accounts` ויקושר אופציונלית ל-`portfolios.id` כדי שעסקאות שכבר משויכות לתיק יוזרמו אוטומטית.

---

### 1. סכמת מסד נתונים (Migration)

טבלה חדשה אחת + טבלת משיכות:

**`prop_accounts`** — פרטי כל תיק
- `firm_name` (text): Topstep / Apex / FundedNext / Lucid / Other
- `account_type` (text): `eval_phase_1` | `eval_phase_2` | `funded`
- `account_size` (numeric): 25000 / 50000 / 100000 / 150000
- `cost` (numeric): מחיר רכישה
- `start_date` (date): תאריך פתיחה
- `status` (text): `active` | `passed` | `failed` | `archived`
- `portfolio_id` (uuid, nullable): קישור ל-`portfolios` ביומן (אופציונלי). אם מקושר, ה-PnL נמשך מעסקאות של אותו portfolio. אחרת לפי `start_date` מהיום.
- `profit_target` (numeric, nullable): יעד רווח לעבור שלב/למשיכה
- `min_trading_days` (int, nullable): מינימום ימי מסחר
- `max_drawdown` (numeric, nullable): drawdown מקסימלי
- `rules_preset` (text): מזהה preset של חוקי החברה
- `notes` (text, nullable)

**`prop_payouts`** — היסטוריית משיכות
- `prop_account_id` (uuid, FK)
- `amount` (numeric)
- `payout_date` (date)
- `notes` (text, nullable)

RLS על שתי הטבלאות: בעל החשבון בלבד (CRUD).

---

### 2. Presets של חוקי חברות (קוד, לא DB)

קובץ `src/lib/propFirmRules.ts` יכיל preset לכל חברה לפי גודל תיק, כך שהוספת תיק חדש ממלאת אוטומטית את `profit_target / min_trading_days / max_drawdown`. המשתמש יכול לדרוס ידנית.

```text
Topstep 50K  → target $3,000  | min 5 days | DD $2,000
Apex 50K     → target $3,000  | min 7 days | DD $2,500 (trailing)
FundedNext   → ...
Lucid 50K    → target $2,000  | min 5 days | DD $1,500
Other        → ידני
```

---

### 3. לוגיקת חישוב — `usePropAccounts` hook

עבור כל `prop_account`, ה-hook יחשב לייב מתוך `trades`:

- **trades scope**:
  - אם `portfolio_id` קיים → כל ה-trades עם `portfolio_id` תואם + `entry_date >= start_date`
  - אחרת → כל ה-trades של המשתמש + `entry_date >= start_date`
- **`netPnl`**: סכום `pnl` של כל ה-trades בסקופ
- **`tradingDays`**: ספירת ימים ייחודיים (DISTINCT `entry_date::date`) שיש בהם לפחות עסקה אחת
- **`currentDrawdown`**: מקס peak-to-trough של ה-cumulative PnL
- **`payoutsTotal`**: סכום מ-`prop_payouts`
- **`eligibleForPayout`**:
  - `netPnl >= profit_target`
  - `tradingDays >= min_trading_days`
  - `currentDrawdown < max_drawdown`
  - `status === 'active' || 'funded'`
- **`progressPct`**: `netPnl / profit_target * 100`

---

### 4. ממשק משתמש

#### Sidebar
ערך חדש ב-`DashboardSidebar.tsx`: "ניהול תיקים" עם אייקון `Briefcase` מ-lucide. נתיב `/prop-portfolios`.

#### עמוד `src/pages/PropPortfolios.tsx`

**Header — 4 כרטיסי סיכום** (גריד `grid-cols-2 lg:grid-cols-4`):
1. סה"כ תיקים פעילים (count where status='active'|'funded')
2. סה"כ הוצאות (sum of cost)
3. סה"כ הכנסות / משיכות (sum of payouts)
4. רווח נקי כולל (payouts − costs) — צבע ירוק/אדום לפי סימן, גופן בולט

**טבלת תיקים / רשת כרטיסים**:
כל שורה/כרטיס מציג: שם חברה + לוגו טקסטואלי, גודל, סוג שלב, סטטוס (Badge), פס התקדמות לעבר היעד, מונה ימי מסחר (`5/7`), סכום משיכות שהתקבל. תווית בולטת ירוקה "זכאי למשיכה ✓" כש-`eligibleForPayout`.

**פעולות לכל תיק**:
- עדכן משיכה → דיאלוג קטן עם סכום + תאריך → INSERT ל-`prop_payouts`
- ארכיון / כשלון → עדכון `status` ל-`failed`/`archived`
- ערוך / מחק

**דיאלוג הוספה** (`AddPropAccountDialog.tsx`):
שדות לפי האפיון. בבחירת firm + size, השדות `profit_target / min_trading_days / max_drawdown` מתמלאים אוטומטית מה-preset (ניתנים לעריכה). שדה אופציונלי: קישור ל-portfolio קיים.

---

### 5. מבנה הקבצים

```text
supabase/migrations/<ts>_prop_accounts.sql   ← schema + RLS

src/lib/propFirmRules.ts                     ← presets

src/hooks/usePropAccounts.ts                 ← fetch + compute live stats

src/pages/PropPortfolios.tsx                 ← העמוד הראשי

src/components/prop/
  PropSummaryCards.tsx
  PropAccountCard.tsx
  PropAccountsTable.tsx
  AddPropAccountDialog.tsx
  EditPropAccountDialog.tsx
  RecordPayoutDialog.tsx

src/App.tsx                                  ← route חדש
src/components/layout/DashboardSidebar.tsx   ← פריט תפריט חדש
```

---

### 6. עיצוב

- שימוש בטוקנים הסמנטיים הקיימים (TradeZella minimal). אין צבעים hard-coded.
- Status badges: `bg-green-500/15 text-green-500` לזכאי, `bg-muted` ל-eval, `bg-destructive/15` ל-failed.
- Dark mode מגיע אוטומטית מתוך מערכת התמות הקיימת.
- RTL מלא בעברית עם dir דינמי מ-`LanguageContext`.

---

### 7. סדר ביצוע

1. מיגרציה ל-`prop_accounts` + `prop_payouts` + RLS (ידרוש אישור שלך).
2. `propFirmRules.ts` עם preset ל-Topstep / Apex / FundedNext / Lucid + "Other".
3. `usePropAccounts` hook עם החישוב.
4. דיאלוגי הוספה / עריכה / משיכה.
5. עמוד `PropPortfolios.tsx` עם כרטיסי סיכום + טבלה.
6. נתיב + פריט סיידבר.

אם אתה מאשר, אני מתחיל מהמיגרציה.
