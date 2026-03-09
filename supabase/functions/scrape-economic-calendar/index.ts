const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RapidAPIEvent {
  title: string;
  country: string;
  indicator?: string;
  ticker?: string;
  comment?: string;
  period?: string;
  actual?: number | string;
  previous?: number | string;
  forecast?: number | string;
  date: string;
  importance?: number;
  currency?: string;
}

interface EconomicEvent {
  title: string;
  country: string;
  currency: string;
  date: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  forecast?: string;
  previous?: string;
  actual?: string;
}

// Simple in-memory cache
let cachedData: { events: EconomicEvent[]; fetchedAt: number; key: string } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body params
    let fromDate: string, toDate: string, countries: string;
    try {
      const body = await req.json();
      fromDate = body.from || '';
      toDate = body.to || '';
      countries = body.countries || '';
    } catch {
      fromDate = '';
      toDate = '';
      countries = '';
    }

    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (!fromDate) fromDate = formatDate(today);
    if (!toDate) {
      const next7 = new Date(today);
      next7.setDate(next7.getDate() + 7);
      toDate = formatDate(next7);
    }
    if (!countries) countries = 'US,EU,GB,JP,AU,CA,CH,NZ,CN';

    const cacheKey = `${fromDate}_${toDate}_${countries}`;

    // Return cached if fresh
    if (cachedData && cachedData.key === cacheKey && (Date.now() - cachedData.fetchedAt) < CACHE_TTL) {
      return new Response(
        JSON.stringify({ success: true, events: cachedData.events, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching economic calendar from ${fromDate} to ${toDate}, countries: ${countries}`);

    const response = await fetch(
      `https://ultimate-economic-calendar.p.rapidapi.com/economic-events/tradingview?from=${fromDate}&to=${toDate}&countries=${countries}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'ultimate-economic-calendar.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `API request failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawData = await response.json();
    console.log('Raw API response type:', typeof rawData, 'isArray:', Array.isArray(rawData));
    console.log('Raw API response keys:', rawData ? Object.keys(rawData).slice(0, 10) : 'null');
    console.log('Raw API response sample:', JSON.stringify(rawData).substring(0, 500));
    
    // Handle different response structures
    let eventsData: RapidAPIEvent[] = [];
    if (Array.isArray(rawData)) {
      eventsData = rawData;
    } else if (rawData && typeof rawData === 'object') {
      // Try common wrapper keys
      if (Array.isArray(rawData.result)) eventsData = rawData.result;
      else if (Array.isArray(rawData.data)) eventsData = rawData.data;
      else if (Array.isArray(rawData.events)) eventsData = rawData.events;
      else if (Array.isArray(rawData.calendar)) eventsData = rawData.calendar;
    }

    const countryToCurrency: Record<string, string> = {
      'US': 'USD', 'EU': 'EUR', 'GB': 'GBP', 'JP': 'JPY',
      'AU': 'AUD', 'CA': 'CAD', 'CH': 'CHF', 'NZ': 'NZD',
      'CN': 'CNY', 'DE': 'EUR',
    };

    const formatValue = (val: number | string | undefined): string | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      return String(val);
    };

    const events: EconomicEvent[] = eventsData.map((event) => {
      let dateStr = fromDate;
      let timeStr = '00:00';

      if (event.date) {
        const eventDate = new Date(event.date);
        dateStr = formatDate(eventDate);
        timeStr = eventDate.toTimeString().substring(0, 5);
      }

      let impact: 'high' | 'medium' | 'low' = 'medium';
      if (event.importance === 3) impact = 'high';
      else if (event.importance === 1) impact = 'low';

      const currency = event.currency || countryToCurrency[event.country] || event.country || 'USD';

      return {
        title: event.title || event.indicator || 'Unknown Event',
        country: event.country || 'US',
        currency,
        date: dateStr,
        time: timeStr,
        impact,
        forecast: formatValue(event.forecast),
        previous: formatValue(event.previous),
        actual: formatValue(event.actual),
      };
    });

    events.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    // Cache results
    cachedData = { events, fetchedAt: Date.now(), key: cacheKey };

    console.log(`Processed ${events.length} economic events`);

    return new Response(
      JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
