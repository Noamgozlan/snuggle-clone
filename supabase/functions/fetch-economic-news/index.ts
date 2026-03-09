const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('JBLANKED_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'JBLANKED_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { period, source, currency, impact } = await req.json();

    // Build endpoint URL
    const src = source || 'forex-factory';
    const p = period || 'today';
    
    let url = `https://www.jblanked.com/news/api/${src}/calendar/${p}/`;
    
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (impact) params.set('impact', impact);
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('API error:', response.status, text);
      return new Response(
        JSON.stringify({ error: `API request failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
