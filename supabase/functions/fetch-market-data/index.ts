import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, interval, outputsize } = await req.json();
    
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      console.error('TWELVE_DATA_API_KEY not found');
      throw new Error('API key not configured');
    }

    console.log(`Fetching data for ${symbol} with interval ${interval}`);

    // Map interval to Twelve Data format
    const intervalMap: Record<string, string> = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '1h': '1h',
      '4h': '4h',
      '1D': '1day',
    };

    const twelveDataInterval = intervalMap[interval] || '1h';
    const size = outputsize || 500;

    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${twelveDataInterval}&outputsize=${size}&apikey=${apiKey}`;
    
    console.log(`Calling Twelve Data API for ${symbol}`);
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'error') {
      console.error('Twelve Data error:', data.message);
      throw new Error(data.message || 'Failed to fetch market data');
    }

    if (!data.values || !Array.isArray(data.values)) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from market data API');
    }

    // Transform data to candlestick format
    const candles = data.values.map((item: any) => ({
      time: new Date(item.datetime).getTime() / 1000,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
    })).reverse(); // Reverse to get chronological order

    console.log(`Successfully fetched ${candles.length} candles for ${symbol}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        candles,
        symbol: data.meta?.symbol || symbol,
        interval: data.meta?.interval || interval,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch market data';
    console.error('Error fetching market data:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
