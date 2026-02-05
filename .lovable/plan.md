
# תיקון באג בטיימפריימים של צילומי מסך

## הבעיה שזוהתה

הטיימפריימים נשמרים נכון במסד הנתונים (למשל: 5m, 15m), אבל כשמציגים את העסקה הם לא מוצגים נכון כי שדה ה-`timeframe` לא נשלף מהמסד הנתונים.

## סיבת הבעיה

בקובץ `src/pages/Trades.tsx`:

1. **הממשק חסר את שדה הטיימפריים**:
   ```typescript
   interface TradeScreenshot {
     id: string;
     trade_id: string;
     screenshot_url: string;
     position: number;
     // timeframe חסר!
   }
   ```

2. **השאילתה לא מביאה את שדה הטיימפריים**:
   ```typescript
   .select("id, trade_id, screenshot_url, position")
   // צריך להוסיף: timeframe
   ```

## התיקון

### שינויים בקובץ `src/pages/Trades.tsx`:

1. עדכון הממשק `TradeScreenshot` להוספת `timeframe`:
   ```typescript
   interface TradeScreenshot {
     id: string;
     trade_id: string;
     screenshot_url: string;
     position: number;
     timeframe?: string;  // הוספה!
   }
   ```

2. עדכון השאילתה לכלול את `timeframe`:
   ```typescript
   .select("id, trade_id, screenshot_url, position, timeframe")
   ```

## התוצאה הצפויה

לאחר התיקון, כשתלחץ על עסקה, כפתורי הטיימפריים יציגו נכון את הערכים השונים (למשל: 5 דקות, 15 דקות) וניתן יהיה לעבור ביניהם.
