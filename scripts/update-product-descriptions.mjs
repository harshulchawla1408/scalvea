const SUPABASE_URL = 'https://dtehgajreecaonqalxlf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DAFWNN0PB8JNNBIP3c8CBw_gyVRijeE';

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const SCALP_5_DESC = `Scalp-5 Anti Dandruff Hair Serum by Scalvea is an advanced scalp treatment formulated to target dandruff, excess oil, scalp irritation, and unhealthy scalp buildup while supporting a cleaner, healthier scalp environment. Its fast-absorbing formula is suitable for all hair and scalp types and integrates easily into any hair care routine.

## How Scalp-5 Helps With Dandruff & Flaky Scalps
Designed for both men and women, Scalp-5 works directly on the scalp to control dandruff-causing factors, gently exfoliate dead skin cells, and nourish the scalp without leaving a greasy residue. This lightweight serum helps reduce visible flakes, soothe irritation, and restore scalp balance for healthier-looking hair.

## Key Ingredients for Dandruff Control
Powered by clinically inspired ingredients including Rosemary Oil, Piroctone Olamine (0.8%), Salicylic Acid, and Vitamin E (Tocopherol).

• Helps reduce dandruff and visible flakes
• Controls excess scalp oil production
• Gently exfoliates scalp buildup
• Helps relieve scalp irritation and itching
• Nourishes and supports a healthier scalp barrier
• Lightweight, non-greasy formula
• Suitable for all hair and scalp types`;

const FOLLICLE_8_DESC = `Follicle 8 Hair Growth Serum by Scalvea is a premium hair growth treatment formulated to support stronger, thicker, and healthier-looking hair. Its lightweight, non-greasy formula absorbs quickly into the scalp and is suitable for all hair types.

## How Follicle 8 Helps With Hair Thinning & Density
Designed for both men and women, Follicle 8 targets weak hair roots, thinning areas, and excessive shedding by nourishing the scalp and supporting healthier hair follicles. This advanced serum helps reduce hair fall, improve scalp health, and promote visible hair density with consistent use.

## Key Ingredients for Hair Growth Support
Powered by clinically inspired ingredients including 4% Anagain, 3% Redensyl, 3% Baicapil, and 3% Procapil.

• Helps reduce hair fall
• Supports healthier hair growth
• Improves scalp nourishment
• Promotes thicker-looking hair
• Suitable for all hair types`;

async function updateDescriptions() {
  try {
    // Update Scalp-5
    const res1 = await fetch(`${SUPABASE_URL}/rest/v1/products?slug=eq.scalp-5-anti-dandruff-hair-serum`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ description: SCALP_5_DESC })
    });
    console.log('Scalp-5 update status:', res1.status);

    // Update Follicle-8
    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/products?slug=eq.follicle-8-hair-growth-serum`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ description: FOLLICLE_8_DESC })
    });
    console.log('Follicle-8 update status:', res2.status);
    
    console.log('Finished updating descriptions.');
  } catch (error) {
    console.error('Error updating descriptions:', error);
  }
}

updateDescriptions();
