// Bulk-insert 24 boutique bridal shops across the 6 newer Florida regions
// (4 each: tampa-bay, sarasota-bradenton, southwest-florida, northeast-
// florida, central-florida, panhandle).
//
//   npx tsx scripts/insert-tier2-dress-shops.ts

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '/Users/bennettbonta/SoFloWeddingVenues/.env.production' });
config({ path: '.env.local', override: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

interface NewShop {
  name: string;
  city: string;
  shop_type: string;
  contact_website: string;
  contact_phone: string | null;
  contact_email: string | null;
  description: string;
  price_min: number | null;
  price_max: number | null;
  specialties: string[];
  brands: string[];
}

const SHOPS: NewShop[] = [
  // ── TAMPA BAY (4) ──
  { name: 'Ivory and Lace Bridal Boutique', city: 'Tampa', shop_type: 'boutique', contact_website: 'https://ivoryandlacebridal.com', contact_phone: '813-289-9400', contact_email: null, description: "An open-concept Tampa boutique on West Kennedy Boulevard offering 90-minute private appointments with a dedicated stylist and a private viewing room that fits up to four guests. The shop emphasizes a curated designer mix and a personalized, unhurried fitting experience.", price_min: 1500, price_max: null, specialties: ['modern', 'classic', 'romantic'], brands: ['Morilee', 'Stella York', "L'Amour by Calla Blanche", 'Locket by Watters', 'Kitty Chen'] },
  { name: "Isabel O'Neil Bridal Collection", city: 'Tampa', shop_type: 'designer', contact_website: 'https://www.isabelbridal.com', contact_phone: null, contact_email: null, description: "A South Tampa luxury bridal boutique on MacDill Avenue carrying an exclusive lineup of high-end and couture designers, with in-house alterations through a preferred seamstress.", price_min: null, price_max: null, specialties: ['luxury', 'couture', 'fashion-forward', 'modern'], brands: ['Monique Lhuillier', 'Atelier Pronovias', 'Ines Di Santo', 'Gala by Galia Lahav', 'Rivini', 'Rita Vinieris', 'Jenny by Jenny Yoo'] },
  { name: 'The Dressing Room', city: 'St. Petersburg', shop_type: 'plus-size', contact_website: 'https://thedroom.com', contact_phone: '727-323-7666', contact_email: null, description: "A bridal boutique on Central Avenue in St. Petersburg offering VIP appointments where the entire salon is closed to other brides during the fitting. They carry a body-inclusive range with plus-size gowns extending to size 30.", price_min: null, price_max: null, specialties: ['plus-size', 'size-inclusive', 'modern', 'classic', 'boho'], brands: ['Stella York', 'Justin Alexander', 'Lillian West', 'Eddy K', 'Maggie Sottero', 'All Who Wander', 'Sincerity Bridal'] },
  { name: 'AB2B Boutique', city: 'Clearwater', shop_type: 'mega-store', contact_website: 'https://www.allbrides2be.com', contact_phone: '813-406-0403', contact_email: null, description: "A full-service bridal and formalwear destination inside Countryside Mall in Clearwater, carrying wedding gowns alongside bridesmaids, mothers, prom, social-occasion, and tuxedo categories under one roof. Also offers in-house custom-designed gowns.", price_min: null, price_max: null, specialties: ['one-stop', 'bridesmaids', 'tuxedos', 'custom'], brands: [] },

  // ── SARASOTA-BRADENTON (4) ──
  { name: 'Calvet Couture Bridal', city: 'Sarasota', shop_type: 'designer', contact_website: 'https://www.calvetcouture.com', contact_phone: '941-706-2217', contact_email: null, description: "A chic, modern downtown Sarasota bridal boutique offering an appointment-only styling experience with a curated, designer-forward selection. Known for Penelope by Lex, an exclusive customizable in-house collection, alongside other high-end designer labels.", price_min: null, price_max: null, specialties: ['designer gowns', 'private appointments', 'customizable in-house line'], brands: ['Anne Barge', 'Eva Lendel', 'Jenny Yoo', 'Woná Concept', 'Penelope by Lex', 'Trish Peng', 'Amsale', 'Pronovias', 'Hayley Paige'] },
  { name: 'The Perfect Dress of Sarasota', city: 'Sarasota', shop_type: 'salon', contact_website: 'https://theperfectweddingdress.net', contact_phone: '941-925-5888', contact_email: 'info@theperfectweddingdress.net', description: "Founded in 2010, a full-service bridal salon located in Sarasota's Southside Village. Carries a broad range of designer gowns plus accessories and eventwear, and offers in-house alterations, a loaner program, and a sale section.", price_min: 99, price_max: null, specialties: ['full-service salon', 'plus-size options', 'accessories', 'alterations'], brands: ['Stella York', 'Willowby by Watters', 'Veni Infantino'] },
  { name: 'Tie the Knot Boutique', city: 'Bradenton', shop_type: 'boutique', contact_website: 'https://tietheknotboutique.com', contact_phone: '941-705-1002', contact_email: 'hello@tietheknotboutique.com', description: "A downtown Bradenton bridal boutique known for carrying the largest selection of Enzoani gowns on Florida's west coast. The mother-daughter-owned shop offers private one-on-one appointments in an intimate, sensory-curated space.", price_min: null, price_max: null, specialties: ['Enzoani specialist', 'private appointments', 'downtown historic district'], brands: ['Enzoani', 'Blue by Enzoani', 'Etoile by Enzoani', 'Elysee'] },
  { name: 'Something Blue Bridal Boutique', city: 'Bradenton', shop_type: 'boutique', contact_website: 'https://somethingbluebridalboutique.com', contact_phone: '941-747-1512', contact_email: 'sbbbridal@gmail.com', description: "A full-service bridal and formal-wear boutique on Manatee Avenue serving the Bradenton-Sarasota corridor. Beyond wedding gowns, the shop carries bridesmaids dresses, tuxedos, prom, and a custom accessories selection.", price_min: null, price_max: null, specialties: ['bridal gowns', 'bridesmaids', 'tuxedo rentals', 'prom'], brands: ['Mori Lee', 'Stella York'] },

  // ── SOUTHWEST FLORIDA (4) ──
  { name: 'Palm Bridal', city: 'Naples', shop_type: 'boutique', contact_website: 'https://www.palmbridal.com', contact_phone: '239-263-8220', contact_email: 'info@palmbridal.com', description: "A curated, mother-daughter-owned bridal boutique in downtown Old Naples featuring a thoughtfully edited mix of modern, classic, glam and boho gowns. Also offers wedding stationery and custom gown design services.", price_min: 1800, price_max: 4000, specialties: ['wedding gowns', 'sample sale gowns', 'wedding stationery', 'custom gown design'], brands: ['Justin Alexander', 'Madi Lane', 'Elissar Bridal', 'Lillian West', 'Beccar Couture', 'Theia', 'Enzoani', 'Blue by Enzoani'] },
  { name: 'Loretta Bridal Boutique', city: 'Bonita Springs', shop_type: 'salon', contact_website: 'https://lorettabridal.com', contact_phone: '239-948-3998', contact_email: 'contact@lorettabridal.com', description: "A family-owned, full-service bridal salon run by a mother-daughter team with over 45 years of combined experience. Known for one-on-one consultations, in-house alterations, custom design services, and curvy/plus-size friendly silhouettes.", price_min: null, price_max: null, specialties: ['wedding gowns', 'mother-of-the-bride', 'curvy / plus-size bridal', 'in-house alterations'], brands: ['Maggie Sottero', 'Sottero and Midgley', 'Rebecca Ingram', 'Kitty Chen', 'Modeca', 'Martin Thornburg'] },
  { name: 'Pure Bridal Boutique', city: 'Fort Myers', shop_type: 'boutique', contact_website: 'https://www.purebridalboutique.com', contact_phone: '239-826-1639', contact_email: null, description: "A by-appointment luxury bridal boutique offering an intimate, private shopping experience with timeless gowns featuring a modern twist. The shop describes itself as locally owned, internationally known.", price_min: null, price_max: null, specialties: ['luxury bridal', 'by-appointment private shopping', 'veils and accessories', 'house exclusive line'], brands: ['Made With Love', 'Watters', 'Sara Gabriel', 'Untamed Petals'] },
  { name: 'The White Closet Bridal', city: 'Fort Myers', shop_type: 'boutique', contact_website: 'https://www.thewhiteclosetbridalftmyers.com', contact_phone: '239-887-3341', contact_email: null, description: "A small, charming appointment-only bridal shoppe with a curated collection of bridal gowns, jewelry, veils, headpieces, and tuxedos. Emphasizes friendly price points in a warm, inviting salon setting and offers gown cleaning and preservation.", price_min: null, price_max: null, specialties: ['wedding gowns', 'veils and headpieces', 'bridal jewelry', 'tuxedo rental', 'gown preservation'], brands: ['Madi Lane', 'Justin Alexander', 'Serene Bridal'] },

  // ── NORTHEAST FLORIDA (4) ──
  { name: 'Tebault Bridal', city: 'St. Augustine', shop_type: 'boutique', contact_website: 'https://www.tebaultbridal.com', contact_phone: '904-829-7098', contact_email: 'Info@TebaultBridal.com', description: "Opened in April 2020, a luxury bridal boutique in the heart of St. Augustine. Owner Kristen O'Connell pairs each appointment with a pre-consultation and a champagne toast, set in a chandelier-lit space styled in pink and gold.", price_min: null, price_max: null, specialties: ['personal styling', 'destination brides', 'pre-appointment consultation'], brands: ['Justin Alexander', 'Madi Lane', 'Modeca', 'Sincerity'] },
  { name: 'Love a Bridal Boutique', city: 'Jacksonville Beach', shop_type: 'salon', contact_website: 'https://www.lovebridalboutique.com', contact_phone: '904-242-9800', contact_email: null, description: "A Jacksonville Beach showroom built around five private bridal suites with separate dressing rooms, styling Florida brides for nearly twenty years. Designer-driven collection ranging from approachable Essense of Australia gowns to high-end Berta Privee.", price_min: 2000, price_max: 12000, specialties: ['private bridal suites', 'designer trunk shows', 'second looks'], brands: ['Essense of Australia', 'All Who Wander', 'Robert Bullock', 'Berta Privee', 'Sarah Seven', 'Martina Liana'] },
  { name: 'Curve Bridal Collection', city: 'Atlantic Beach', shop_type: 'plus-size', contact_website: 'https://www.curvebridalcollection.com', contact_phone: '904-372-0933', contact_email: 'info@curvebridalcollection.com', description: "Florida's only exclusively-curvy high-end bridal boutique, with more than 200 sample gowns kept in sizes 14 through 32+. Brides try on dresses in their actual size in a relaxed, by-appointment showroom on Atlantic Boulevard.", price_min: null, price_max: null, specialties: ['plus-size bridal', 'size-inclusive samples 14-32', 'appointment-only'], brands: ['Madi Lane Bridal', 'Essense of Australia', 'Martina Liana', 'Studio Levana', 'All Who Wander'] },
  { name: 'Beauty Within Bridal', city: 'Fernandina Beach', shop_type: 'boutique', contact_website: 'https://beautywithinbridal.com', contact_phone: null, contact_email: null, description: "An appointment-only bridal boutique on East State Road 200 in Fernandina Beach, the only dedicated bridal shop on Amelia Island. Brides and their parties get private use of the salon with bubbles, a curated rack of gowns, and custom ordering.", price_min: null, price_max: null, specialties: ['private exclusive appointments', 'size-inclusive samples', 'custom orders'], brands: [] },

  // ── CENTRAL FLORIDA (4) ──
  { name: 'White Blossom Bridal', city: 'Orlando', shop_type: 'boutique', contact_website: 'https://www.whiteblossombridal.com', contact_phone: null, contact_email: 'amanda@whiteblossombridal.com', description: "An intimate bridal boutique tucked into Baldwin Park offering personalized one-on-one appointments. The shop curates unique and exclusive bridal gowns not found elsewhere in Orlando, paired with private styling sessions.", price_min: 1350, price_max: 3000, specialties: ['one-on-one appointments', 'plus-size selections', 'sample sales', 'veils and accessories'], brands: ['Rachel Allan', 'Tanya Grig', 'Moonlight Bridal', 'Elissar', 'Eddy K', 'Stella York', 'White Blossom Bridal'] },
  { name: 'Maria Del Pilar Bridal Boutique', city: 'Orlando', shop_type: 'designer', contact_website: 'https://mdpbridalboutique.com', contact_phone: '407-412-5782', contact_email: null, description: "A designer-driven Orlando boutique on East Colonial Drive with nearly 30 years of bridal design experience. The owner-designer offers her own labels alongside curated international designers, with full on-site alterations.", price_min: null, price_max: null, specialties: ['on-site alterations', 'custom design', 'plus-size', 'veils and accessories'], brands: ['Choie Bridal', 'Katy Corso', 'La Premiere', 'Maria Del Pilar', 'Milla Nova', 'Monreal Bridal', 'Patricia Couture', 'Randy Fenoli'] },
  { name: 'The Bridal Finery', city: 'Winter Park', shop_type: 'salon', contact_website: 'https://www.thebridalfinery.com', contact_phone: '407-554-9034', contact_email: 'tali@thebridalfinery.com', description: "A luxury bridal salon on North Orange Avenue founded by partners Tali and Roberta after 12 years in bridal fashion. The salon takes one bride at a time and is one of only five Ines Di Santo Shop-in-Shop locations worldwide.", price_min: 4000, price_max: 15000, specialties: ['one-bride-at-a-time appointments', 'made-to-order custom', 'designer styling'], brands: ['Ines Di Santo', 'Kyha Studios', 'Lihi Hod'] },
  { name: 'Ivy Bridal Shop', city: 'Altamonte Springs', shop_type: 'plus-size', contact_website: 'https://www.ivybridalshop.com', contact_phone: '407-728-8506', contact_email: null, description: "An inclusive, appointment-only bridal boutique on State Road 436 serving the Sanford/Lake Mary/Altamonte corridor. Carries over 250 hand-picked private-collection gowns in sizes 2 to 32, with the goal of giving every bride a real chance at their dream gown.", price_min: 1250, price_max: 3500, specialties: ['extended sizing 2-32', 'plus-size bridal', 'private appointments', 'private collection'], brands: [] },

  // ── PANHANDLE (4) ──
  { name: 'Margaret Ellen Bridal', city: 'Santa Rosa Beach', shop_type: 'boutique', contact_website: 'https://www.margaretellenbridal.com', contact_phone: '850-641-0266', contact_email: 'cheers@margaretellenbridal.com', description: "A couture bridal salon set in the 30A corridor of South Walton County, offering wedding dress styles that range from southern charm to whimsical and boho. Each bride is hosted by appointment in a private suite with a personal stylist for a relaxed two-hour experience.", price_min: null, price_max: null, specialties: ['couture wedding gowns', 'private suite appointments', 'mother-of-the-bride', 'gown preservation'], brands: [] },
  { name: 'Simply Elegant Bridal', city: 'Fort Walton Beach', shop_type: 'salon', contact_website: 'https://www.sebridals.com', contact_phone: '850-862-3334', contact_email: null, description: "A long-standing Emerald Coast formalwear destination serving brides between Pensacola and 30A for decades, with private bridal appointments dedicated to one customer at a time. Carries bridal, bridesmaids, plus-size bridal, prom and pageant gowns under one roof.", price_min: null, price_max: null, specialties: ['bridal gowns', 'bridesmaids', 'plus-size bridal', 'prom and pageant', 'honeymoon wear'], brands: ['Morilee', 'Casablanca Bridal', 'Sincerity by Justin Alexander', 'After Six'] },
  { name: 'Bridal Suite Pensacola', city: 'Pensacola', shop_type: 'salon', contact_website: 'https://ebridalsuite.com', contact_phone: '850-494-9989', contact_email: 'bridalsuitepensacola@gmail.com', description: "An independently run Pensacola bridal salon with more than two decades of experience outfitting Gulf Coast brides. Emphasizes a relaxed, family-style atmosphere and offers VIP after-hours appointments with mimosas, snacks and a dedicated stylist.", price_min: null, price_max: null, specialties: ['wedding gowns', 'short bridal dresses', 'plus-size bridal', 'bridesmaids', 'gown preservation'], brands: ['Maggie Sottero', 'Sottero and Midgley', 'Rebecca Ingram', 'Allure Bridals', 'Wilderly Bride'] },
  { name: 'Amore Bridal Studio', city: 'Pensacola', shop_type: 'plus-size', contact_website: 'https://amorebridalstudio.com', contact_phone: '850-418-9955', contact_email: null, description: "A small, owner-operated Pensacola studio carrying off-the-rack bridal gowns in extended sizing from 0 to 30, alongside accessories and full wedding coordination services. Each appointment includes personal styling and optional planning support.", price_min: null, price_max: null, specialties: ['off-the-rack bridal', 'extended sizing 0-30', 'plus-size bridal', 'accessories'], brands: [] },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/'/g, '')
    .replace(/[.,'"`/\\]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  console.log(`Inserting ${SHOPS.length} dress shops…`);
  const rows = SHOPS.map((s) => {
    const slug = `${slugify(s.name)}-${slugify(s.city)}`;
    return {
      legacy_id: slug,
      slug,
      name: s.name,
      description: s.description,
      shop_type: s.shop_type,
      city: s.city,
      state: 'FL',
      price_min: s.price_min ?? 0,
      price_max: s.price_max ?? 0,
      specialties: s.specialties,
      tags: [],
      images: [],
      brands: s.brands,
      services: [],
      hours: {},
      contact_phone: s.contact_phone,
      contact_email: s.contact_email,
      contact_email_real: !!s.contact_email,
      contact_website: s.contact_website,
      is_premium: false,
    };
  });

  const { data, error } = await supabase
    .from('dress_shops')
    .upsert(rows, { onConflict: 'slug' })
    .select('slug, name, city, shop_type');

  if (error) { console.error('Insert failed:', error); process.exit(1); }

  console.log(`✓ ${data?.length ?? 0} shops upserted`);
  console.log('\nSlugs:');
  for (const s of data ?? []) console.log(`  ${s.slug}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
