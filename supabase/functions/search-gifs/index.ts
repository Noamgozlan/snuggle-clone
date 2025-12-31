import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 20 } = await req.json();
    const apiKey = Deno.env.get("TENOR_API_KEY");

    if (!apiKey) {
      throw new Error("TENOR_API_KEY not configured");
    }

    let url: string;
    
    if (query && query.trim()) {
      // Search GIFs
      url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=${limit}&media_filter=gif,tinygif&contentfilter=medium`;
    } else {
      // Get featured/trending GIFs
      url = `https://tenor.googleapis.com/v2/featured?key=${apiKey}&limit=${limit}&media_filter=gif,tinygif&contentfilter=medium`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Tenor API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the response to a simpler format
    const gifs = data.results.map((gif: any) => ({
      id: gif.id,
      title: gif.title || "",
      preview: gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url,
      url: gif.media_formats?.gif?.url,
      width: gif.media_formats?.gif?.dims?.[0] || 200,
      height: gif.media_formats?.gif?.dims?.[1] || 200,
    }));

    return new Response(JSON.stringify({ gifs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error searching GIFs:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
