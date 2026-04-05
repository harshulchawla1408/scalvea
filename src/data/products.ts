import follicle8Serum from "@/assets/follicle8-serum.png";
import follicle8Black from "@/assets/follicle8-black.png";
import follicle8Spray from "@/assets/follicle8-spray.png";

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  currency: string;
  images: string[];
  description: string;
  ingredients: string;
  howToUse: string;
  keyIngredients: string[];
  size: string;
  inStock: boolean;
  featured: boolean;
  badge?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Follicle 8 Hair Growth Serum",
    slug: "follicle-8-hair-growth-serum",
    category: "Serums",
    price: 49.95,
    currency: "AUD",
    images: [follicle8Serum, follicle8Spray, follicle8Black],
    description: "A clinically formulated hair growth serum powered by 3% Redensyl, 3% Baicapil, 3% Procapil, and 4% Anagain. Designed to enhance hair density, volume, and strength while reducing hair fall. Lightweight, fast-absorbing formula suitable for all hair types.",
    ingredients: "Aqua, Redensyl (3%), Baicapil (3%), Procapil (3%), Anagain (4%), Glycerin, Panthenol, Niacinamide, Biotin, Caffeine, Sodium Hyaluronate, Phenoxyethanol, Ethylhexylglycerin",
    howToUse: "Apply 6-8 drops directly to the scalp in areas of concern. Massage gently with fingertips for 1-2 minutes. Use twice daily — morning and night — on clean, towel-dried hair. Do not rinse. For best results, use consistently for 8-12 weeks.",
    keyIngredients: ["3% Redensyl", "3% Baicapil", "3% Procapil", "4% Anagain"],
    size: "30 mL / 1.01 fl oz",
    inStock: true,
    featured: true,
    badge: "BESTSELLER",
  },
  {
    id: "2",
    name: "Hair Growth Serum — Black Edition",
    slug: "hair-growth-serum-black-edition",
    category: "Serums",
    price: 54.95,
    currency: "AUD",
    images: [follicle8Black, follicle8Serum, follicle8Spray],
    description: "The advanced Black Edition of our signature hair growth serum. Featuring the same clinically proven actives with an enhanced delivery system for deeper scalp penetration. The premium formulation targets hair follicle health at the root level.",
    ingredients: "Aqua, Redensyl (3%), Baicapil (3%), Procapil (3%), Anagain (4%), Capixyl, Glycerin, Panthenol, Niacinamide, Biotin, Caffeine, Sodium Hyaluronate, Tocopheryl Acetate, Phenoxyethanol, Ethylhexylglycerin",
    howToUse: "Apply 6-8 drops to clean scalp. Massage in circular motions for 2 minutes. Use nightly before bed for optimal absorption. Do not wash for at least 4 hours. Consistent use for 12 weeks recommended for visible results.",
    keyIngredients: ["3% Redensyl", "3% Baicapil", "3% Procapil", "4% Anagain"],
    size: "30 mL / 1.01 fl oz",
    inStock: true,
    featured: true,
    badge: "NEW",
  },
  {
    id: "3",
    name: "Follicle 8 Spray Serum",
    slug: "follicle-8-spray-serum",
    category: "Sprays",
    price: 44.95,
    currency: "AUD",
    images: [follicle8Spray, follicle8Serum, follicle8Black],
    description: "A convenient spray-on delivery of our award-winning Follicle 8 formula. The fine mist applicator ensures even distribution across the scalp for comprehensive coverage. Ideal for those seeking an easy, mess-free application experience.",
    ingredients: "Aqua, Redensyl (3%), Baicapil (3%), Procapil (3%), Anagain (4%), Glycerin, Panthenol, Niacinamide, Biotin, Allantoin, Phenoxyethanol, Ethylhexylglycerin",
    howToUse: "Part hair into sections and spray 4-6 pumps directly onto the scalp. Gently massage for 1 minute. Use twice daily on clean or dry hair. Do not rinse. Allow to air dry naturally.",
    keyIngredients: ["3% Redensyl", "3% Baicapil", "3% Procapil", "4% Anagain"],
    size: "30 mL / 1.01 fl oz",
    inStock: true,
    featured: true,
  },
];

export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);
export const getProductById = (id: string) => products.find(p => p.id === id);
export const getFeaturedProducts = () => products.filter(p => p.featured);
