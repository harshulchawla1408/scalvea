import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://dtehgajreecaonqalxlf.supabase.co', 'sb_publishable_DAFWNN0PB8JNNBIP3c8CBw_gyVRijeE');
async function run() {
  const { data, error } = await supabase.from('orders').select('shiprocket_order_id, gateway_response').eq('order_number', 'SCV-2026-000014');
  console.log('Orders:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}
run();
