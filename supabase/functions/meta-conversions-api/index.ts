import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendMetaCapiEvent, CapiEventPayload } from "../_shared/meta-capi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: CapiEventPayload = await req.json();

    if (!payload.eventName || !payload.eventId) {
      return new Response(
        JSON.stringify({ error: "Missing eventName or eventId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Augment client IP and user agent from request headers if not provided
    payload.userData = payload.userData || {};
    if (!payload.userData.clientIp) {
      payload.userData.clientIp =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip");
    }
    if (!payload.userData.clientUserAgent) {
      payload.userData.clientUserAgent = req.headers.get("user-agent");
    }

    const result = await sendMetaCapiEvent(payload);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[meta-conversions-api] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
