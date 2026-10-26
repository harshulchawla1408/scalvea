export interface VideoData {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  durationIso: string; // ISO 8601 duration e.g. PT45S
  uploadDate: string; // ISO 8601 date
  keyIngredients?: string[];
  relatedProductId?: string | null;
  relatedProductName?: string | null;
  transcript: string[];
  summary: string;
}

export const VIDEOS: VideoData[] = [
  {
    id: "follicle-8-application-guide",
    slug: "follicle-8-application-guide",
    title: "How to Apply Scalvea Follicle 8 Hair Growth Serum — Demonstration & Routine Guide",
    metaTitle: "How to Apply Follicle 8 Hair Growth Serum | Scalvea Video Guide",
    metaDescription: "Watch our step-by-step application guide for Scalvea Follicle 8 Hair Growth Serum. Learn how to target thinning areas and maximize follicle absorption daily.",
    description: "A complete visual demonstration of how to apply Scalvea Follicle 8 Hair Growth Serum. Learn sectioning techniques, optimal dropper dosage, and gentle scalp massage for targeted follicle nourishment.",
    videoUrl: "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/Reel4.mp4",
    thumbnailUrl: "https://scalvea.com/og-image.webp",
    duration: 45,
    durationIso: "PT45S",
    uploadDate: "2026-09-01T08:00:00+00:00",
    keyIngredients: ["4% Anagain", "3% Redensyl", "3% Baicapil", "3% Procapil"],
    relatedProductId: "follicle-8-hair-growth-serum",
    relatedProductName: "Follicle 8 Hair Growth Serum",
    transcript: [
      "Step 1: Start with dry or damp, towel-dried hair. Part hair cleanly to expose the scalp in areas experiencing thinning or low density.",
      "Step 2: Draw 1 to 2 droppers of Scalvea Follicle 8 Serum. Apply directly onto the exposed scalp along the parting lines.",
      "Step 3: Using clean fingertips, gently massage the serum into the scalp using small circular motions for 1 to 2 minutes.",
      "Step 4: Do not rinse out. Allow the water-based, non-greasy formula to absorb fully before styling or sleeping."
    ],
    summary: "Scalvea Follicle 8 combines four clinically researched hair growth actives (Anagain from organic pea sprouts, Redensyl, Baicapil, and Procapil). This daily leave-in serum is engineered to support follicle resilience, activate microcirculation, and nourish roots without greasy buildup or sticky residue."
  },
  {
    id: "scalvea-hair-growth-science-showcase",
    slug: "scalvea-hair-growth-science-showcase",
    title: "Scalvea Hair & Scalp Care — Formulation & Active Ingredients Showcase",
    metaTitle: "Scalvea Formulation & Active Ingredients Showcase | Video",
    metaDescription: "Discover the science behind Scalvea hair growth serums and scalp care formulations. Explore clinically researched actives designed for scalp comfort and follicle resilience.",
    description: "Explore Scalvea's science-backed hair and scalp formulations. Understand how clinical actives work synchronously to soothe scalp irritation and reinforce thinning hair roots.",
    videoUrl: "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/demanded.mp4",
    thumbnailUrl: "https://scalvea.com/og-image.webp",
    duration: 30,
    durationIso: "PT30S",
    uploadDate: "2026-09-05T08:00:00+00:00",
    keyIngredients: ["Anagain", "Redensyl", "Salicylic Acid", "Piroctone Olamine", "Zinc PCA"],
    relatedProductId: "scalp-5-anti-dandruff-hair-serum",
    relatedProductName: "Scalp-5 Anti-Dandruff Hair Serum",
    transcript: [
      "Every healthy strand begins at the scalp microbiome and follicular junction.",
      "Scalvea develops science-led formulations to target the distinct root causes of hair concerns.",
      "Follicle 8 delivers potent bio-actives to energize the dermal papilla cells.",
      "Scalp-5 rebalances the scalp microbiome, clearing flakes and calming irritation with Piroctone Olamine and Salicylic Acid.",
      "Clean, clinically inspired hair wellness designed for both Australian and Indian climates."
    ],
    summary: "Scalvea formulates high-performance scalp treatments focused on root health. By combining biotechnology with gentle dermatological science, Scalvea creates targeted solutions for thinning, shedding, and dandruff without harsh alcohols or unnecessary synthetic additives."
  },
  {
    id: "about-scalvea-brand-story",
    slug: "about-scalvea-brand-story",
    title: "The Scalvea Story — Australian Science Meets Daily Hair Wellness",
    metaTitle: "The Scalvea Story — Brand Journey & Philosophy | Scalvea Video",
    metaDescription: "Watch the story behind Scalvea. Learn how clinical transparency, evidence-backed hair care actives, and Australian formulation principles shape our products.",
    description: "The story behind Scalvea: born from a commitment to honest science, clinical transparency, and evidence-informed hair wellness developed across Australia and India.",
    videoUrl: "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/About.mp4",
    thumbnailUrl: "https://scalvea.com/og-image.webp",
    duration: 60,
    durationIso: "PT60S",
    uploadDate: "2026-09-01T08:00:00+00:00",
    keyIngredients: ["Evidence-Based Actives", "Dermatologically Tested", "Cruelty-Free"],
    relatedProductId: null,
    relatedProductName: null,
    transcript: [
      "Scalvea began with a conviction: modern hair care deserves genuine clinical transparency.",
      "We grew tired of exaggerated promises and filler ingredients that fail to address real scalp biology.",
      "We partnered with trusted cosmetic laboratories to formulate with researched actives at effective concentrations.",
      "Operating between Melbourne, Australia and Patiala, India, our goal is honest, science-first hair wellness for every customer.",
      "Care you deserve — thoughtful, transparent, and tested."
    ],
    summary: "Founded on the belief that hair wellness should be clinically grounded and transparent, Scalvea develops targeted scalp care products formulated with proven active percentages. Our dual presence in Australia and India allows us to engineer products suited to diverse hair textures, climates, and daily routines."
  }
];

export function getVideoBySlug(slug: string): VideoData | undefined {
  return VIDEOS.find(v => v.slug === slug || v.id === slug);
}
