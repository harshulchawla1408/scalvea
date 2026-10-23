/**
 * meta-capi.ts
 *
 * Server-side Meta Conversions API (CAPI) helper for Scalvea.
 * Pixel ID: 1990336078340761
 *
 * Implements Meta Graph API v19.0 event dispatch with SHA-256 data normalization
 * and automated deduplication against client-side Meta Pixel events via event_id.
 */

export const META_PIXEL_ID =
  Deno.env.get("META_PIXEL_ID") ||
  Deno.env.get("VITE_META_PIXEL_ID") ||
  "1990336078340761";

export const META_ACCESS_TOKEN =
  Deno.env.get("META_CONVERSIONS_API_ACCESS_TOKEN") ||
  Deno.env.get("VITE_META_CONVERSIONS_API_ACCESS_TOKEN") ||
  "EAAWL1S9YfiwBS5sVYwBylTevzqxCguuvRtZAGUcFXy4iM5QZBpZAKwZCMZAv14setYjZCvkGL917IowaEWXhEIZANru0PDrgIqEqiIBqHTP3Xsml1Ih0yp1P2zqc4ucE9ANa3YZBFBreUqElsmxhylTosYvM2xtt3iyVP1SQCqv6fV868vAe1Ll4rGtaKYk5YvPTWQZDZD";

/**
 * SHA-256 hash helper using Web Crypto API (Deno / Browser native)
 */
export async function sha256(str: string): Promise<string> {
  const normalized = str.trim().toLowerCase();
  const msgUint8 = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface CapiUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface CapiCustomData {
  currency?: string;
  value?: number;
  content_type?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  num_items?: number;
  order_id?: string;
}

export interface CapiEventPayload {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: CapiCustomData;
}

/**
 * Send event to Meta Conversions API
 */
export async function sendMetaCapiEvent(payload: CapiEventPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!META_ACCESS_TOKEN) {
      console.warn("[Meta CAPI] No Access Token provided. Skipping event.");
      return { success: false, error: "No Access Token" };
    }

    // Build hashed user_data object
    const userDataObj: Record<string, any> = {};

    if (payload.userData.email) {
      userDataObj.em = [await sha256(payload.userData.email)];
    }
    if (payload.userData.phone) {
      // Keep only digits for phone hashing per Meta specifications
      const cleanPhone = payload.userData.phone.replace(/[^\d]/g, "");
      if (cleanPhone) {
        userDataObj.ph = [await sha256(cleanPhone)];
      }
    }
    if (payload.userData.firstName) {
      userDataObj.fn = [await sha256(payload.userData.firstName)];
    }
    if (payload.userData.lastName) {
      userDataObj.ln = [await sha256(payload.userData.lastName)];
    }
    if (payload.userData.city) {
      userDataObj.ct = [await sha256(payload.userData.city)];
    }
    if (payload.userData.state) {
      userDataObj.st = [await sha256(payload.userData.state)];
    }
    if (payload.userData.postcode) {
      userDataObj.zp = [await sha256(payload.userData.postcode)];
    }
    if (payload.userData.country) {
      // 2-letter country code
      userDataObj.country = [await sha256(payload.userData.country.slice(0, 2).toLowerCase())];
    }
    if (payload.userData.clientIp) {
      userDataObj.client_ip_address = payload.userData.clientIp;
    }
    if (payload.userData.clientUserAgent) {
      userDataObj.client_user_agent = payload.userData.clientUserAgent;
    }
    if (payload.userData.fbp) {
      userDataObj.fbp = payload.userData.fbp;
    }
    if (payload.userData.fbc) {
      userDataObj.fbc = payload.userData.fbc;
    }

    const eventTime = Math.floor(Date.now() / 1000);

    const body = {
      data: [
        {
          event_name: payload.eventName,
          event_time: eventTime,
          event_id: payload.eventId,
          event_source_url: payload.eventSourceUrl || "https://scalvea.com",
          action_source: "website",
          user_data: userDataObj,
          custom_data: payload.customData || {},
        },
      ],
    };

    const url = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const resJson = await res.json();

    if (!res.ok) {
      console.error("[Meta CAPI] Error response from Meta:", resJson);
      return { success: false, error: JSON.stringify(resJson) };
    }

    console.log(`[Meta CAPI] Event ${payload.eventName} (${payload.eventId}) sent successfully. Events received:`, resJson.events_received);
    return { success: true, data: resJson };
  } catch (err: any) {
    console.error("[Meta CAPI] Exception during event dispatch:", err.message);
    return { success: false, error: err.message };
  }
}
