const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  importance?: number; // 1=low, 2=medium, 3=high
  currency?: string;
}

interface EconomicEvent {
  title: string;
  country: string;
  date: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  forecast?: string;
  previous?: string;
  actual?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get today and tomorrow dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const fromDate = formatDate(today);
    const toDate = formatDate(tomorrow);

    console.log(`Fetching economic calendar from ${fromDate} to ${toDate}...`);

    const response = await fetch(
      `https://ultimate-economic-calendar.p.rapidapi.com/economic-events/tradingview?from=${fromDate}&to=${toDate}&countries=US,EU,GB,JP,AU,CA,CH,NZ,CN`,
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
    console.log('RapidAPI response received, events count:', Array.isArray(rawData) ? rawData.length : 'not array');

    const eventsData: RapidAPIEvent[] = Array.isArray(rawData) ? rawData : [];

    // Transform events to our format
    const events: EconomicEvent[] = eventsData.map((event) => {
      // Parse date - format is ISO
      let dateStr = formatDate(today);
      let timeStr = '00:00';

      if (event.date) {
        const eventDate = new Date(event.date);
        dateStr = formatDate(eventDate);
        timeStr = eventDate.toTimeString().substring(0, 5);
      }

      // Map importance to impact level
      let impact: 'high' | 'medium' | 'low' = 'medium';
      if (event.importance === 3) {
        impact = 'high';
      } else if (event.importance === 1) {
        impact = 'low';
      }

      // Map country codes
      const countryMap: Record<string, string> = {
        'US': 'USD',
        'EU': 'EUR',
        'GB': 'GBP',
        'JP': 'JPY',
        'AU': 'AUD',
        'CA': 'CAD',
        'CH': 'CHF',
        'NZ': 'NZD',
        'CN': 'CNY',
        'DE': 'EUR',
      };

      const formatValue = (val: number | string | undefined): string | undefined => {
        if (val === undefined || val === null || val === '') return undefined;
        return String(val);
      };

      return {
        title: event.title || event.indicator || 'Unknown Event',
        country: countryMap[event.country] || event.currency || event.country || 'USD',
        date: dateStr,
        time: timeStr,
        impact,
        forecast: formatValue(event.forecast),
        previous: formatValue(event.previous),
        actual: formatValue(event.actual),
      };
    });

    // Sort by date and time
    events.sort((a, b) => {
      const dateTimeA = `${a.date} ${a.time}`;
      const dateTimeB = `${b.date} ${b.time}`;
      return dateTimeA.localeCompare(dateTimeB);
    });

    console.log(`Successfully processed ${events.length} economic events`);

    return new Response(
      JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error fetching economic calendar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
