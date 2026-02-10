

# שיפור עיצוב כללי + הוספת תגיות (Tags) בסגנון TradeZella

## סקירה

הוספת מערכת תגיות (Tags) מקצועית לתיעוד עסקאות, בדומה ל-TradeZella, כולל שיפורים ויזואליים נוספים בדשבורד ובטופס הוספת/עריכת עסקה.

---

## תגיות חדשות שיתווספו

### 1. Mental State (מצב רגשי)
אפשרויות: Confident, Anxious, FOMO, Disciplined, Revenge Trading, Calm, Frustrated, Greedy, Patient, Fearful

### 2. Mistakes (טעויות)
אפשרויות: Moved Stop Loss, No Stop Loss, Over-leveraged, Chased Entry, Exited Too Early, Held Too Long, Wrong Size, Ignored Plan

### 3. Setups (סוג הגדרה)
אפשרויות: Breakout, Pullback, Reversal, Range, Trend Following, Scalp, Swing, News Play

---

## שינויים טכניים

### שלב 1: מסד נתונים
- הוספת עמודות חדשות לטבלת `trades`:
  - `mental_state TEXT` - מצב רגשי
  - `mistakes TEXT[]` - מערך טעויות (יכול להיות יותר מאחד)
  - `setup_type TEXT` - סוג ההגדרה

### שלב 2: טופס הוספת עסקה (`AddTradeDialog.tsx`)
- הוספת סקשן חדש "תגיות" אחרי הסשן ולפני הסטרטגיה
- **Mental State**: בחירת כפתור אחד מתוך רשימה עם אייקונים רגשיים צבעוניים
- **Setup Type**: בחירת סוג הגדרה (בחירה יחידה)
- **Mistakes**: בחירה מרובה של טעויות (Multi-select chips)
- עיצוב: כפתורי chip עם צבעים ייחודיים לכל קטגוריה

### שלב 3: טופס עריכת עסקה (`EditTradeDialog.tsx`)
- אותו סקשן תגיות כמו בהוספה
- טעינת הערכים הקיימים מהמסד בעת פתיחת הדיאלוג

### שלב 4: תצוגת עסקאות (`Trades.tsx`)
- הצגת Badge-ים צבעוניים לכל תגית בטבלת העסקאות
- Mental State עם אימוג'י/אייקון מתאים
- Mistakes באדום/כתום
- Setup Type בסגול

### שלב 5: דשבורד - שיפורים ויזואליים
- הוספת גרף **Mental State Distribution** - עוגה שמראה פיזור המצבים הרגשיים
- הוספת גרף **Top Mistakes** - בר צ'ארט של הטעויות הנפוצות ביותר
- הוספת סטטיסטיקה: ביצועים לפי Mental State (למשל: "כש-Confident: 72% הצלחה")

### שלב 6: סיכום עסקה (`TradeSummaryDialog.tsx`)
- הצגת התגיות בצורה מעוצבת בתצוגת הסיכום

---

## עיצוב התגיות

Mental State יהיה עם אייקונים:
- Confident = Shield (ירוק)
- Anxious = AlertTriangle (כתום)  
- FOMO = Zap (אדום)
- Disciplined = Target (כחול)
- Revenge = Flame (אדום כהה)
- Calm = Heart (ירוק בהיר)

Mistakes יוצגו כ-chips אדומים/כתומים עם X לביטול בחירה.

Setup Type יוצג כ-badge סגול.

---

## קבצים שישתנו

1. **מיגרציה חדשה** - הוספת עמודות `mental_state`, `mistakes`, `setup_type` לטבלת trades
2. **`src/components/trades/AddTradeDialog.tsx`** - הוספת סקשן תגיות
3. **`src/components/trades/EditTradeDialog.tsx`** - הוספת סקשן תגיות
4. **`src/pages/Trades.tsx`** - הצגת תגיות בטבלה
5. **`src/components/trades/TradeSummaryDialog.tsx`** - הצגת תגיות בסיכום
6. **`src/pages/Dashboard.tsx`** - גרפים חדשים לפי תגיות
7. **`src/hooks/useTrades.ts`** - עדכון הממשק לכלול שדות חדשים

