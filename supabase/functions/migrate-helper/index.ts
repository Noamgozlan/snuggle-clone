const BUILD_ID = "2026-03-04-safe";
const ACCESS_KEY = "8d3652d3b07aa8021cb306a2043c66261bdeb2aba5e47f59";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-access-key, x-client-info, apikey, content-type, authorization",
};

const responseHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "X-Build-Id": BUILD_ID,
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: responseHeaders,
  });

const errorResponse = (status: number, error: string) =>
  jsonResponse({ build_id: BUILD_ID, error }, status);

const requiredEnv = (name: string): string | null => {
  const value = Deno.env.get(name)?.trim();
  return value || null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: responseHeaders });
  }

  const requestAccessKey = req.headers.get("x-access-key")?.trim();
  if (!requestAccessKey || requestAccessKey !== ACCESS_KEY) {
    return errorResponse(401, "Unauthorized");
  }

  const supabaseDbUrl = requiredEnv("SUPABASE_DB_URL");
  if (!supabaseDbUrl) {
    return errorResponse(500, "Set SUPABASE_DB_URL and redeploy.");
  }

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const projectRef = supabaseUrl
    ? supabaseUrl.replace(/^https?:\/\//, "").split(".")[0]
    : null;

  // SECURITY: This helper intentionally does NOT return SUPABASE_SERVICE_ROLE_KEY.
  // The service role key bypasses RLS and must never be returned over HTTP behind a
  // static access key. To run a migration that requires it, copy the service role key
  // manually from the Lovable Cloud / Supabase dashboard into your local migration tool.
  return jsonResponse({
    build_id: BUILD_ID,
    generated_at: new Date().toISOString(),
    supabase_db_url: supabaseDbUrl,
    supabase_url: supabaseUrl,
    project_ref: projectRef,
    service_role_key: null,
    service_role_key_status: "withheld_for_security",
    notice:
      "SUPABASE_SERVICE_ROLE_KEY is intentionally not returned. Copy it manually from the backend dashboard (Cloud → Backend → Project Settings → API) into your migration tool.",
  });
});
