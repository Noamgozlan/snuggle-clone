import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeAiText(raw: unknown): string {
  // Accept common response shapes and always return plain text.
  const asString = (() => {
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object") {
      // Some gateways return an array of content parts.
      // e.g. [{ type: 'text', text: '...' }]
      const anyRaw = raw as any;
      if (Array.isArray(anyRaw)) {
        return anyRaw
          .map((p) => (typeof p === "string" ? p : (p?.text ?? "")))
          .filter(Boolean)
          .join("\n");
      }
      if (typeof anyRaw.text === "string") return anyRaw.text;
    }
    return "";
  })();

  let text = asString.trim();

  // Strip common Markdown formatting that Gemini often returns.
  // 1) fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, "");
  // 2) bold/italic markers
  text = text.replace(/\*\*(.*?)\*\*/g, "$1");
  text = text.replace(/__(.*?)__/g, "$1");
  text = text.replace(/\*(.*?)\*/g, "$1");
  text = text.replace(/_(.*?)_/g, "$1");
  // 3) bullet markers: '* ' or '- ' at line start
  text = text.replace(/^\s*[\*\-]\s+/gm, "• ");
  // 4) extra cleanup: remove leftover standalone **
  text = text.replace(/\*\*/g, "");

  // Normalize whitespace
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

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
      ? `אתה עוזר לסוחרים לסגנן את תיעוד סיבות הכניסה שלהם לעסקאות.

כללים קריטיים:
- אל תמציא מידע חדש! השתמש רק במה שהסוחר כתב.
- אל תוסיף פרטים, מספרים, או עובדות שלא מופיעים בטקסט המקורי.
- רק סגנן את הטקסט הקיים במילים יותר ברורות ומובנות.
- שמור על האורך המקורי פחות או יותר.

מה לעשות:
- לנסח את אותו תוכן בצורה ברורה וקריאה יותר
- לארגן את המשפטים בצורה טובה יותר
- לתקן שגיאות כתיב או ניסוח

הנחיות פורמט:
- החזר טקסט נקי בלבד (Plain text)
- בלי Markdown בכלל (בלי **, בלי *, בלי כותרות)
- אם יש רשימה, השתמש בתווי "•" בתחילת שורה

החזר רק את הטקסט המסוגנן בעברית, ללא הסברים.`
      : `אתה עוזר לסוחרים לסגנן את תיעוד המסקנות שלהם לאחר עסקאות.

כללים קריטיים:
- אל תמציא מידע חדש! השתמש רק במה שהסוחר כתב.
- אל תוסיף לקחים, תובנות, או עובדות שלא מופיעים בטקסט המקורי.
- רק סגנן את הטקסט הקיים במילים יותר ברורות ומובנות.
- שמור על האורך המקורי פחות או יותר.

מה לעשות:
- לנסח את אותו תוכן בצורה ברורה וקריאה יותר
- לארגן את המשפטים בצורה טובה יותר
- לתקן שגיאות כתיב או ניסוח

הנחיות פורמט:
- החזר טקסט נקי בלבד (Plain text)
- בלי Markdown בכלל (בלי **, בלי *, בלי כותרות)
- אם יש רשימה, השתמש בתווי "•" בתחילת שורה

החזר רק את הטקסט המסוגנן בעברית, ללא הסברים.`;

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
    const rawImproved = data?.choices?.[0]?.message?.content;
    const improvedText = normalizeAiText(rawImproved) || text;

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
