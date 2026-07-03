import { supabase } from "@/integrations/supabase/client";

export interface StoreSettings {
  au_business_name: string;
  au_abn: string;
  au_owner_name: string;
  au_address: string;
  au_phone: string;
  in_owner_name: string;
  in_address: string;
  in_phone: string;
  in_email: string;
  cancellation_policy: string;
  refund_policy: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  au_business_name: "SCALVEA GROUPS PTY LTD",
  au_abn: "99 696 417 679",
  au_owner_name: "Puneet",
  au_address: "17 Travers St, Craigieburn VIC 3064, Australia",
  au_phone: "+61 460 309 333",
  in_owner_name: "Bimla Rani",
  in_address: "R-6 Tej Bagh Colony, Sanour Road, Patiala, Punjab, India",
  in_phone: "+91 98771 91114",
  in_email: "scalvea.operations@gmail.com",
  cancellation_policy: `Orders can be cancelled only before dispatch.

Once an order has been shipped or delivered, cancellation is not allowed.

Customers may request cancellation by contacting our support team immediately after placing the order.

SCALVEA reserves the right to approve or reject cancellation requests depending on order status.`,
  refund_policy: `SCALVEA does NOT accept returns for used, opened, or partially used products.

Due to hygiene and safety reasons, products once opened cannot be returned.

Refund or replacement is ONLY applicable in the following cases:

1. Product received damaged
2. Wrong product delivered
3. Customer rejects delivery before acceptance
4. Product missing in shipment

No refund for:
- Change of mind
- Used product
- Opened packaging
- Dissatisfaction after usage

Refund approval process:
Customer must contact support within 48 hours of delivery with:
- Order ID
- Photos/videos
- Reason for issue

After verification, refund/replacement will be processed.

Refund timeline:
Approved refunds are processed within 5–10 business days.

Support Contact:
Email: scalvea.operations@gmail.com
Phone: +91 98771 91114`,
};

const LOCAL_STORAGE_KEY = "scalvea_store_settings";

export const getStoreSettings = async (): Promise<StoreSettings> => {
  try {
    const { data, error } = await supabase
      .from("store_settings" as any)
      .select("*");
    
    if (error || !data || data.length === 0) {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(local) };
      }
      return DEFAULT_SETTINGS;
    }

    const settings: any = {};
    data.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (err) {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(local) };
    }
    return DEFAULT_SETTINGS;
  }
};

export const updateStoreSettings = async (settings: Partial<StoreSettings>): Promise<void> => {
  const current = await getStoreSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  try {
    const upsertData = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from("store_settings" as any)
      .upsert(upsertData, { onConflict: "key" });

    if (error) {
      console.warn("Failed to upsert settings to Supabase, saved locally.", error);
    }
  } catch (err) {
    console.warn("Supabase not available or table store_settings missing, saved locally.", err);
  }
};
