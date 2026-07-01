const serve = (handler: (req: Request) => Response | Promise<Response>) => Deno.serve(handler);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trades, stats, periodLabel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!trades || trades.length === 0) {
      return new Response(JSON.stringify({ 
        summary: "אין עסקאות לניתוח בטווח הנבחר.",
        patterns: [], mistakes: [], recommendations: [], strengths: [],
        grade: "C", riskAlert: null,
        textPatterns: { goodPoints: [], badPoints: [], insights: [] }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tradesContext = trades.map((t: any, i: number) => {
      const parts = [
        `${i + 1}. ${t.symbol} (${t.trade_type})`,
        `PnL: $${(t.pnl || 0).toFixed(2)}`,
        t.strategy ? `אסטרטגיה: ${t.strategy}` : null,
        t.mental_state ? `מצב מנטלי: ${t.mental_state}` : null,
        t.mistakes?.length ? `טעויות: ${t.mistakes.join(', ')}` : null,
        t.rr ? `R:R: ${t.rr.toFixed(2)}` : null,
        t.entry_date ? `תאריך: ${t.entry_date}` : null,
      ].filter(Boolean);
      return parts.join(' | ');
    }).join('\n');

    const notesContext = trades
      .map((t: any, i: number) => {
        if (!t.notes) return null;
        const pnl = (t.pnl || 0);
        const result = pnl > 0 ? "רווח" : pnl < 0 ? "הפסד" : "BE";
        return `[עסקה ${i + 1} - ${t.symbol} - ${result} $${pnl.toFixed(0)}]\n${t.notes}`;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    const systemPrompt = `אתה מנתח מסחר מקצועי שקורא ומבין את מה שהסוחר כותב.

חובה להחזיר JSON בלבד (בלי markdown, בלי backticks) עם המבנה:
{
  "summary": "סיכום 2-3 משפטים על הביצועים בטווח",
  "patterns": ["דפוס 1", "דפוס 2"],
  "mistakes": ["טעות חוזרת 1", "טעות חוזרת 2"],
  "recommendations": ["המלצה 1", "המלצה 2", "המלצה 3"],
  "grade": "A/B/C/D/F",
  "strengths": ["חוזקה 1", "חוזקה 2"],
  "riskAlert": "התרעת סיכון או null",
  "textPatterns": {
    "goodPoints": ["דבר טוב שזיהית מסיבות הכניסה/מסקנות שהסוחר כתב"],
    "badPoints": ["דבר לא טוב שחוזר בטקסטים של הסוחר"],
    "insights": ["תובנה מעניינת מהטקסט - למשל: כשכותב X מרוויח, כשכותב Y מפסיד"]
  }
}

הנחיות:
- כתוב בעברית ברורה
- textPatterns חייב להיות מבוסס אך ורק על הטקסט של סיבות הכניסה והמסקנות שהסוחר כתב
- זהה מילות מפתח או ביטויים חוזרים בעסקאות רווחיות מול מפסידות
- הצג דוגמאות ספציפיות (אל תכתוב "יש דפוס" - כתוב את הדפוס בפועל)
- אם הטקסטים דלים או ריקים - החזר מערכים ריקים ב-textPatterns`;

    const userPrompt = `## סטטיסטיקות (${periodLabel || 'הטווח'})
- סה"כ עסקאות: ${stats.totalTrades || trades.length}
- PnL כולל: $${(stats.totalPnl || 0).toFixed(2)}
- אחוז הצלחה: ${(stats.winRate || 0).toFixed(1)}%
- מנצחות: ${stats.winningTrades || 0} | מפסידות: ${stats.losingTrades || 0}

## פירוט עסקאות
${tradesContext}

## סיבות כניסה ומסקנות שהסוחר כתב
${notesContext || '(אין הערות)'}

נתח והחזר JSON. שים דגש מיוחד על ניתוח הטקסטים ב-textPatterns.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (handle possible markdown wrapping)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = {
        summary: content,
        patterns: [],
        mistakes: [],
        recommendations: [],
        grade: "C",
        strengths: [],
        riskAlert: null,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Weekly AI summary error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
