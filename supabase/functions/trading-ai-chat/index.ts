import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, tradingData } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    console.log("Trading AI Chat - Received request with", messages?.length, "messages");
    console.log("Trading data summary:", JSON.stringify({
      totalTrades: tradingData?.trades?.length || 0,
      stats: tradingData?.stats || {}
    }));

    // Build context from trading data
    const tradingContext = buildTradingContext(tradingData);

    const systemPrompt = `אתה יועץ מסחר מקצועי שמנתח נתוני מסחר ונותן המלצות מותאמות אישית.
    
הנה נתוני המסחר של המשתמש:
${tradingContext}

תפקידך:
1. לנתח את הביצועים של המשתמש
2. לזהות דפוסים חיוביים ושליליים
3. להמליץ על שיפורים ספציפיים
4. לענות על שאלות לגבי האישורים (confirmations), אסטרטגיות, זמני מסחר וכו'

ענה תמיד בעברית. היה ממוקד, מעשי ותומך.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    console.log("Streaming response from OpenRouter");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Trading AI Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildTradingContext(data: any): string {
  if (!data) return "אין נתוני מסחר זמינים.";

  const { trades = [], stats = {}, confirmations = [] } = data;

  let context = `## סטטיסטיקות כלליות
- סה"כ עסקאות: ${trades.length}
- רווח/הפסד כולל: $${stats.totalPnl?.toFixed(2) || 0}
- אחוז הצלחה: ${stats.winRate?.toFixed(1) || 0}%
- ממוצע רווח: $${stats.avgWin?.toFixed(2) || 0}
- ממוצע הפסד: $${stats.avgLoss?.toFixed(2) || 0}
- יחס R:R ממוצע: ${stats.avgRR?.toFixed(2) || 0}
- עסקאות מנצחות: ${stats.winningTrades || 0}
- עסקאות מפסידות: ${stats.losingTrades || 0}
`;

  // Add confirmation analysis
  if (confirmations.length > 0) {
    const confirmationStats = analyzeConfirmations(trades, confirmations);
    context += `\n## ניתוח אישורים (Confirmations)\n`;
    confirmationStats.forEach(cs => {
      context += `- ${cs.name}: ${cs.count} שימושים, ${cs.winRate.toFixed(1)}% הצלחה, ממוצע P&L: $${cs.avgPnl.toFixed(2)}\n`;
    });
  }

  // Add strategy analysis
  const strategyStats = analyzeStrategies(trades);
  if (strategyStats.length > 0) {
    context += `\n## ניתוח אסטרטגיות\n`;
    strategyStats.forEach(ss => {
      context += `- ${ss.name}: ${ss.count} עסקאות, ${ss.winRate.toFixed(1)}% הצלחה, סה"כ P&L: $${ss.totalPnl.toFixed(2)}\n`;
    });
  }

  // Add day of week analysis
  const dayStats = analyzeDays(trades);
  if (dayStats.length > 0) {
    context += `\n## ביצועים לפי יום\n`;
    dayStats.forEach(ds => {
      context += `- ${ds.day}: ${ds.count} עסקאות, ${ds.winRate.toFixed(1)}% הצלחה, סה"כ P&L: $${ds.totalPnl.toFixed(2)}\n`;
    });
  }

  // Add recent trades
  const recentTrades = trades.slice(0, 10);
  if (recentTrades.length > 0) {
    context += `\n## 10 עסקאות אחרונות\n`;
    recentTrades.forEach((t: any, i: number) => {
      context += `${i + 1}. ${t.symbol} (${t.trade_type}) - P&L: $${t.pnl?.toFixed(2) || 0}, R:R: ${t.rr?.toFixed(2) || 'N/A'}, אסטרטגיה: ${t.strategy || 'לא צוין'}\n`;
    });
  }

  return context;
}

function analyzeConfirmations(trades: any[], confirmations: any[]): any[] {
  const stats: Record<string, { count: number; wins: number; totalPnl: number }> = {};
  
  trades.forEach(trade => {
    const tradeConfirmations = confirmations.filter(c => c.trade_id === trade.id);
    tradeConfirmations.forEach(conf => {
      if (!stats[conf.confirmation_name]) {
        stats[conf.confirmation_name] = { count: 0, wins: 0, totalPnl: 0 };
      }
      stats[conf.confirmation_name].count++;
      if (trade.pnl > 0) stats[conf.confirmation_name].wins++;
      stats[conf.confirmation_name].totalPnl += trade.pnl || 0;
    });
  });

  return Object.entries(stats).map(([name, s]) => ({
    name,
    count: s.count,
    winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
    avgPnl: s.count > 0 ? s.totalPnl / s.count : 0
  })).sort((a, b) => b.count - a.count);
}

function analyzeStrategies(trades: any[]): any[] {
  const stats: Record<string, { count: number; wins: number; totalPnl: number }> = {};
  
  trades.forEach(trade => {
    const strategy = trade.strategy || 'לא מוגדר';
    if (!stats[strategy]) {
      stats[strategy] = { count: 0, wins: 0, totalPnl: 0 };
    }
    stats[strategy].count++;
    if (trade.pnl > 0) stats[strategy].wins++;
    stats[strategy].totalPnl += trade.pnl || 0;
  });

  return Object.entries(stats).map(([name, s]) => ({
    name,
    count: s.count,
    winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
    totalPnl: s.totalPnl
  })).sort((a, b) => b.count - a.count);
}

function analyzeDays(trades: any[]): any[] {
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const stats: Record<number, { count: number; wins: number; totalPnl: number }> = {};
  
  trades.forEach(trade => {
    const date = new Date(trade.entry_date || trade.created_at);
    const day = date.getDay();
    if (!stats[day]) {
      stats[day] = { count: 0, wins: 0, totalPnl: 0 };
    }
    stats[day].count++;
    if (trade.pnl > 0) stats[day].wins++;
    stats[day].totalPnl += trade.pnl || 0;
  });

  return Object.entries(stats).map(([day, s]) => ({
    day: dayNames[parseInt(day)],
    count: s.count,
    winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
    totalPnl: s.totalPnl
  })).sort((a, b) => parseInt(Object.keys(stats).find(k => dayNames[parseInt(k)] === a.day) || '0') - 
                     parseInt(Object.keys(stats).find(k => dayNames[parseInt(k)] === b.day) || '0'));
}
