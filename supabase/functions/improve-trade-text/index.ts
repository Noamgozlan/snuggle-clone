import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, type } = await req.json();
    
    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "לא הוזן טקסט לשיפור" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = type === "entry_reason" 
      ? `אתה עוזר לסוחרים לשפר את תיעוד סיבות הכניסה שלהם לעסקאות.
המטרה שלך היא לקחת את הטקסט של הסוחר ולשפר אותו כך שיהיה:
- ברור וקריא יותר
- מפורט יותר עם נקודות קונקרטיות
- מאורגן בצורה טובה יותר
- עם דגש על הסיגנלים הטכניים והפונדמנטליים

החזר רק את הטקסט המשופר בעברית, ללא הסברים נוספים.`
      : `אתה עוזר לסוחרים לשפר את תיעוד המסקנות שלהם לאחר עסקאות.
המטרה שלך היא לקחת את הטקסט של הסוחר ולשפר אותו כך שיהיה:
- ברור וקריא יותר
- מפורט יותר עם לקחים ספציפיים
- מאורגן בצורה טובה יותר
- עם דגש על מה למדתי ומה אעשה אחרת בפעם הבאה

החזר רק את הטקסט המשופר בעברית, ללא הסברים נוספים.`;

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
          { role: "user", content: `שפר את הטקסט הבא:\n\n${text}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "הגעת למגבלת הבקשות, נסה שוב מאוחר יותר" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש תשלום, יש להוסיף קרדיטים" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const improvedText = data.choices?.[0]?.message?.content || text;

    return new Response(
      JSON.stringify({ improved_text: improvedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error improving text:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "שגיאה לא ידועה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
