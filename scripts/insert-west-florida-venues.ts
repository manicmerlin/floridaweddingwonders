// Bulk-insert 28 boutique West Florida wedding venues scraped via the
// research agent pipeline (Tampa Bay + Sarasota/Bradenton + Anna Maria
// Island + Fort Myers/Cape Coral/Sanibel + Naples/Marco extras).
//
// Run via:
//   npx tsx scripts/insert-west-florida-venues.ts
// Reads SUPABASE_SERVICE_ROLE_KEY from .env.production (loaded at top).

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load env files. Service role key only lives in the parent repo's
// .env.production (worktree doesn't carry it). Local takes precedence
// for everything else.
config({ path: '/Users/bennettbonta/SoFloWeddingVenues/.env.production' });
config({ path: '.env.local', override: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

interface NewVenue {
  name: string;
  city: string;
  venue_type: 'beach' | 'garden' | 'ballroom' | 'historic' | 'modern' | 'rustic';
  contact_website: string;
  contact_phone: string | null;
  description: string;
  capacity_min: number | null;
  capacity_max: number | null;
  price_min: number | null;
  amenities: string[];
}

const VENUES: NewVenue[] = [
  // ── TAMPA BAY (5) ──
  {
    name: 'The Birchwood',
    city: 'St. Petersburg',
    venue_type: 'historic',
    contact_website: 'https://thebirchwood.com',
    contact_phone: '727-896-1080',
    description: "Boutique hotel set in a five-story Spanish Mission-style building on Beach Drive, listed on the National Register of Historic Places. The fourth-floor Grand Ballroom (4,000 sq ft) opens onto two private outdoor terraces with panoramic Tampa Bay views, and the property includes a rooftop canopy lounge with cabanas. Catering is handled in-house with locally sourced ingredients.",
    capacity_min: null,
    capacity_max: 200,
    price_min: null,
    amenities: ['Grand Ballroom', 'Two outdoor terraces', 'Rooftop canopy lounge', 'In-house catering', 'Bridal suite', 'Custom-built bar', 'National Register historic'],
  },
  {
    name: 'NOVA 535 Unique Event Space',
    city: 'St. Petersburg',
    venue_type: 'modern',
    contact_website: 'https://nova535.com',
    contact_phone: '727-758-7657',
    description: "Restored 1920s building in downtown St. Petersburg combining original clay-brick walls and Brazilian hardwood floors with a bamboo courtyard and dramatic LED lighting. The two-story space includes four distinct areas (downstairs reception, courtyard, upstairs lounge, private suites) and operates on a one-event-at-a-time exclusivity policy.",
    capacity_min: 50,
    capacity_max: 320,
    price_min: 5874,
    amenities: ['Bamboo courtyard', '1920s brick walls', '16-foot ceilings', 'Two getting-ready suites', 'Designer lounges', 'DJ booth', 'Full liquor bars', 'Free parking'],
  },
  {
    name: 'Davis Islands Garden Club',
    city: 'Tampa',
    venue_type: 'garden',
    contact_website: 'https://digclub.org',
    contact_phone: '813-251-3123',
    description: "Nonprofit garden club at 81 Columbia Drive on Davis Islands, about 1.5 miles from downtown Tampa, operating its clubhouse and grounds as a wedding venue. The site features tropical and subtropical plantings with sunset views over Seddon Channel toward Harbour Island and downtown Tampa, plus a covered veranda and ballroom. Couples can rent the venue for the full day and bring their own caterer and alcohol.",
    capacity_min: null,
    capacity_max: 175,
    price_min: null,
    amenities: ['Tropical garden grounds', 'Waterfront views', 'Gazebo', 'Covered veranda', 'Ballroom', 'Open-vendor (BYO catering)', 'Wheelchair accessible'],
  },
  {
    name: 'Bilmar Beach Resort',
    city: 'Treasure Island',
    venue_type: 'beach',
    contact_website: 'https://www.bilmarbeachresort.com',
    contact_phone: null,
    description: "Independent beachfront resort at the end of the Treasure Island Causeway, directly on the Gulf of Mexico. Wedding offerings include ceremonies on a private stretch of Treasure Island Beach with the required permit handled in-house, the renovated 3,000+ sq ft Waves beachfront venue with floor-to-ceiling Gulf views, and the Crystal Ballroom for receptions.",
    capacity_min: null,
    capacity_max: 200,
    price_min: null,
    amenities: ['Private beach ceremony', 'Beach permit included', 'Wedding arch with tulle', 'Waves beachfront event space', 'Crystal Ballroom', 'Misting patio'],
  },
  {
    name: 'Harborside Chapel',
    city: 'Safety Harbor',
    venue_type: 'historic',
    contact_website: 'https://harborsidechapel.org',
    contact_phone: null,
    description: "Standalone wedding chapel in Safety Harbor (Clearwater area) on Tampa Bay's Pinellas peninsula, designed as a ceremony-only venue with seating for up to 216 in classic white pews. The interior features chandeliers, large windows showing the Florida landscape, a bridal suite and a groom's quarters. The chapel offers an on-site pastor and coordination services.",
    capacity_min: null,
    capacity_max: 216,
    price_min: null,
    amenities: ['White pews', 'Chandeliers', 'Decorative arch', 'Bridal suite', "Groom's quarters", 'On-site pastor', 'Ceremony coordination'],
  },

  // ── SARASOTA / BRADENTON (6) ──
  {
    name: 'Marie Selby Botanical Gardens',
    city: 'Sarasota',
    venue_type: 'garden',
    contact_website: 'https://selby.org',
    contact_phone: '941-366-5731',
    description: "A 15-acre waterfront botanical garden on Sarasota Bay built around the rare-plant collections of Marie Selby, with seven indoor and outdoor event sites. Couples can host ceremonies inside the Schimmel Wedding Pavilion, beneath banyan trees, or in the Great Room overlooking the bayfront, with on-site catering provided exclusively by Michael's on East. The gardens are notable as the only botanical institution in the world devoted to epiphytic orchids, bromeliads, gesneriads and ferns.",
    capacity_min: null,
    capacity_max: 250,
    price_min: null,
    amenities: ['Bayfront ceremony sites', 'Indoor pavilion', 'Outdoor garden spaces', 'Banyan grove', 'Rare orchid collections', 'Exclusive in-house catering'],
  },
  {
    name: 'Sarasota Garden Club',
    city: 'Sarasota',
    venue_type: 'garden',
    contact_website: 'https://sarasotagardenclub.org',
    contact_phone: null,
    description: "A volunteer-run civic garden club on Boulevard of the Arts in Sarasota's downtown cultural district that rents its hall and surrounding gardens for private events. The mission centers on preserving the gardens and historic landmarks while supporting environmental conservation, and the property hosts intimate ceremonies in both the indoor hall and outdoor garden spaces.",
    capacity_min: null,
    capacity_max: 150,
    price_min: null,
    amenities: ['Main hall', 'Outdoor garden ceremony space', 'Downtown cultural-district location', 'Bring-your-own-vendor flexibility'],
  },
  {
    name: 'Mar Vista Dockside Restaurant & Pub',
    city: 'Longboat Key',
    venue_type: 'beach',
    contact_website: 'https://www.marvistadining.com',
    contact_phone: '941-383-2391',
    description: "An Old Florida dockside restaurant on the bayside of north Longboat Key, set under century-old buttonwood trees with a private dock on Sarasota Bay. Event spaces include the Marina Lawn for ceremonies with a sea-grape backdrop and the covered Bayview Deck for receptions, with the kitchen handling in-house catering of locally sourced seafood.",
    capacity_min: 20,
    capacity_max: 60,
    price_min: null,
    amenities: ['Bayfront marina lawn', 'Covered Bayview Deck', 'Private dock', 'In-house catering', 'Day-of coordinator', 'Buttonwood-tree canopy'],
  },
  {
    name: 'PIER 22',
    city: 'Bradenton',
    venue_type: 'historic',
    contact_website: 'https://www.pier22catering.com',
    contact_phone: '941-748-8087',
    description: "A locally owned waterfront restaurant and event venue housed in a 1920s Spanish-eclectic building on the historic Bradenton Pier overlooking the Manatee River. The property offers several distinct spaces — the Dockside Lounge, Waterside Terrace, Grand Ballroom, and additional private rooms — with in-house executive chefs handling custom menus.",
    capacity_min: null,
    capacity_max: 300,
    price_min: null,
    amenities: ['Riverfront ceremony terrace', '1920s Spanish-eclectic ballroom', 'In-house executive chef', 'Multiple indoor/outdoor spaces', 'Dockside Lounge'],
  },
  {
    name: 'The Bishop Museum of Science and Nature',
    city: 'Bradenton',
    venue_type: 'historic',
    contact_website: 'https://bishopscience.org',
    contact_phone: '941-216-3468',
    description: "An independent natural-science museum founded in 1947 on Bradenton's Riverwalk that opens its galleries, courtyards, and planetarium for private events. Couples can hold ceremonies in the Spanish-inspired South Courtyard, the Riverside Plaza, or beneath the planetarium dome with star projections. The museum provides a curated bridal suite called Tierney Lane.",
    capacity_min: 50,
    capacity_max: 400,
    price_min: 700,
    amenities: ['Spanish-style South Courtyard', 'Riverside Plaza', 'Planetarium ceremony option', 'Bridal suite', 'Tables, chairs, linens included'],
  },
  {
    name: 'Evergrove Estate',
    city: 'Sarasota',
    venue_type: 'rustic',
    contact_website: 'https://www.evergroveestate.com',
    contact_phone: null,
    description: "A privately owned 6-acre estate in the Sarasota/Lakewood Ranch area built around a restored historic barn surrounded by oak canopies and an open ceremony field. The property is unusual for the region in offering on-property overnight lodging through three separate guest houses (Meadow, Ranch, and Grove), so wedding parties can sleep on site.",
    capacity_min: null,
    capacity_max: null,
    price_min: null,
    amenities: ['Restored historic barn', 'Oak-canopy ceremony site', 'Open reception field', 'Three on-site guest houses', 'Indoor and outdoor event spaces'],
  },

  // ── ANNA MARIA ISLAND (5) ──
  {
    name: 'Anna Maria Island Inn',
    city: 'Bradenton Beach',
    venue_type: 'beach',
    contact_website: 'https://www.annamariaislandinn.com',
    contact_phone: '941-557-6860',
    description: "A small beachfront inn offering two outdoor wedding spaces directly on Anna Maria Island: the Seaside Beachfront on the sugar sand and the Pelican Post pool and green space. The inn provides personalized event coordination and on-site guest accommodations across multiple cottage-style properties.",
    capacity_min: null,
    capacity_max: 100,
    price_min: null,
    amenities: ['Beachfront ceremony space', 'Pool and green space venue', 'Event coordination', 'On-site cottage accommodations'],
  },
  {
    name: 'Sandbar Restaurant',
    city: 'Anna Maria',
    venue_type: 'beach',
    contact_website: 'https://www.sandbardining.com',
    contact_phone: '941-778-0444',
    description: "An independent waterfront restaurant on the north end of Anna Maria Island offering beach ceremonies under an arbor on the sand and receptions in The Grand Pavilion, a covered open-air space with a dance floor. On-site coordinators handle dinner service and event details against a Gulf sunset backdrop.",
    capacity_min: 50,
    capacity_max: 180,
    price_min: 10580,
    amenities: ['Beach arbor ceremony site', 'Open-air covered Grand Pavilion', 'Dance floor', 'On-site event coordinators', 'Farm-to-table seafood catering', 'Bridal getting-ready area'],
  },
  {
    name: 'Beach House Waterfront Restaurant',
    city: 'Bradenton Beach',
    venue_type: 'beach',
    contact_website: 'https://www.beachhousedining.com',
    contact_phone: null,
    description: "A Gulf-front independent restaurant on Bradenton Beach whose Sunset Deck wedding space sits directly on the sand with one of the largest gulf-front decks on Florida's west coast. The venue offers ceremony and reception flexibility across beach, deck, and indoor areas with in-house culinary and planning support.",
    capacity_min: null,
    capacity_max: 200,
    price_min: null,
    amenities: ['Sunset Deck on the Gulf', 'Beach ceremony access', 'Indoor and open-air spaces', 'In-house catering and bakery', 'Misters and overhead heaters', 'On-site planning team'],
  },
  {
    name: 'The Sunset by Gulf Drive Cafe',
    city: 'Bradenton Beach',
    venue_type: 'beach',
    contact_website: 'https://www.thesunsetweddings.com',
    contact_phone: '941-778-1919',
    description: "A waterfront tiki-hut wedding venue at the south end of Anna Maria Island attached to Gulf Drive Cafe, with the larger Sunset Tiki, the smaller Seaside Tiki, and Seastar Sands private beach featuring seven miniature tiki huts. The venue offers ceremony, reception, decor, and catering packages with toes-in-the-sand dancing and Gulf sunset views.",
    capacity_min: null,
    capacity_max: 150,
    price_min: null,
    amenities: ['Sunset Tiki Hut reception space', 'Seaside Tiki Hut for small parties', 'Seastar Sands private beach', 'Catering menu tiers', 'On-site coordinator'],
  },
  {
    name: 'Bali Hai Beach Resort',
    city: 'Holmes Beach',
    venue_type: 'beach',
    contact_website: 'https://www.balihaibeachresort.com',
    contact_phone: '941-254-6609',
    description: "A two-acre independently operated beachfront resort in Holmes Beach with 300 feet of private Gulf-front sand, offering wedding ceremonies in a palm-lined courtyard beside the pool or directly on the beach. Bookings often involve a partial resort buyout, so couples have access to on-site lodging and grounds for a private destination feel.",
    capacity_min: null,
    capacity_max: 100,
    price_min: null,
    amenities: ['300 ft of private Gulf-front beach', 'Tropical courtyard ceremony site', 'Heated pool', 'On-site lodging', 'Outside catering allowed', 'Preferred vendor list'],
  },

  // ── FORT MYERS / CAPE CORAL / SANIBEL (7) ──
  {
    name: 'The Heitman House',
    city: 'Fort Myers',
    venue_type: 'historic',
    contact_website: 'https://heitmanhouse.com',
    contact_phone: '239-872-5541',
    description: "A 1908 historic home with a wraparound porch and 200-foot walkway along the Caloosahatchee River in downtown Fort Myers. The professionally landscaped grounds offer multiple indoor and outdoor event spaces with waterfront ceremony decking and on-site catering by in-house chefs.",
    capacity_min: null,
    capacity_max: 250,
    price_min: null,
    amenities: ['Waterfront views on Caloosahatchee River', '200-foot walkway', 'Bridal suite', 'Indoor and outdoor spaces', 'Back dock', 'Complimentary valet', 'In-house chefs'],
  },
  {
    name: 'The Tree House',
    city: 'Fort Myers',
    venue_type: 'historic',
    contact_website: 'https://thetreehousefortmyers.com',
    contact_phone: null,
    description: "An independently run 1908 historic main house in the downtown Fort Myers river district, themed to evoke the 1920s-1940s. The grounds feature a signature banyan-tree ceremony site with vintage iron arbor, an illuminated gazebo, and a bridal suite with five adjoining parlor rooms.",
    capacity_min: null,
    capacity_max: null,
    price_min: null,
    amenities: ['Banyan tree ceremony site', 'Vintage iron arbor', 'Illuminated gazebo', 'Bridal suite', 'Five parlor rooms', 'On-site officiant', 'Vintage streetlamp lighting'],
  },
  {
    name: 'Edison and Ford Winter Estates',
    city: 'Fort Myers',
    venue_type: 'garden',
    contact_website: 'https://www.edisonfordwinterestates.org',
    contact_phone: '239-335-3689',
    description: "A nonprofit historic museum estate along the Caloosahatchee River featuring the winter homes, gardens, and laboratory of Thomas Edison and Henry Ford. Wedding ceremony locations include the Moonlight Garden with bougainvillea-draped trellises, the River Pavilion in the Coconut Grove, the Mysore Fig tree on the Ford estate, and Edison's Pergola.",
    capacity_min: null,
    capacity_max: null,
    price_min: null,
    amenities: ['Moonlight Garden', 'River Pavilion', 'Mysore Fig tree', "Edison's Pergola", 'Free guest parking', 'On-site events coordinator', 'Lily Pond and gardens'],
  },
  {
    name: 'The Veranda',
    city: 'Fort Myers',
    venue_type: 'historic',
    contact_website: 'https://www.verandarestaurant.com',
    contact_phone: '239-332-2065',
    description: "A locally owned fine-dining restaurant set in two turn-of-the-century homes at Second Street and Broadway in downtown Fort Myers, with the corner house built in 1902. A Fort Myers tradition since 1978, the venue offers Southern Regional Cuisine, an extensive wine list, and a courtyard space for weddings, rehearsal dinners, and private events.",
    capacity_min: null,
    capacity_max: null,
    price_min: null,
    amenities: ['Two restored 1902 homes', 'Outdoor courtyard', 'Award-winning Southern cuisine', 'Full bar service', 'Extensive wine list'],
  },
  {
    name: 'Rumrunners',
    city: 'Cape Coral',
    venue_type: 'modern',
    contact_website: 'https://rumrunners.cc',
    contact_phone: '239-790-5786',
    description: "An independent waterfront restaurant at Cape Harbour in Cape Coral with direct dock access on the Caloosahatchee River. Named for a custom-built 37-foot commuter boat, the venue offers a full kitchen, bar, and deck dining suitable for ceremonies and receptions, with live entertainment and free guest docking.",
    capacity_min: null,
    capacity_max: null,
    price_min: null,
    amenities: ['Cape Harbour waterfront', 'Boat docking for guests', 'Free parking', 'Full kitchen and bar', 'Live entertainment', 'Indoor and dock-side seating'],
  },
  {
    name: 'Sanibel Community House',
    city: 'Sanibel',
    venue_type: 'historic',
    contact_website: 'https://sanibelcommunityhouse.net',
    contact_phone: '239-472-2155',
    description: "Operated by the nonprofit Sanibel Community Association since 1927, the Community House on Periwinkle Way is the island's longest-standing gathering place. The historic building offers four rentable rooms (including a conference room and three larger spaces that combine for one large room) with kitchen facilities, currently active for weddings post-Hurricane Ian.",
    capacity_min: null,
    capacity_max: null,
    price_min: null,
    amenities: ['Four rentable rooms', 'Conference room', 'Kitchen facilities', 'Historic 1927 building', 'Periwinkle Way location'],
  },
  {
    name: "'Tween Waters Island Resort & Spa",
    city: 'Captiva',
    venue_type: 'beach',
    contact_website: 'https://tween-waters.com',
    contact_phone: '239-472-5161',
    description: "An independently operated Captiva Island resort founded by the Price family in 1931, situated between the Gulf of Mexico and Pine Island Sound. Wedding spaces include the historic Old Captiva House — a former 1930s one-room schoolhouse on the National Register of Historic Places — along with beachfront ceremony sites and Gulf-view event lawns.",
    capacity_min: null,
    capacity_max: 135,
    price_min: null,
    amenities: ['Beachfront Gulf ceremony', 'Old Captiva House (National Register)', 'Indoor and outdoor spaces', 'On-site lodging', 'Marina', 'Wedding planning team', 'Ballroom'],
  },

  // ── NAPLES / MARCO / BONITA EXTRAS (5) ──
  {
    name: 'Historic Palm Cottage',
    city: 'Naples',
    venue_type: 'historic',
    contact_website: 'https://napleshistoricalsociety.org',
    contact_phone: '239-261-8164',
    description: "Naples' oldest home, built in 1895 of tabby (crushed-shell cement) and operated by the Naples Historical Society as a rentable event space in the Old Naples Historic District. The cottage and adjoining Norris Gardens are available for cocktail parties, anniversaries and other private celebrations one block from Naples Pier.",
    capacity_min: null,
    capacity_max: null,
    price_min: null,
    amenities: ['1895 historic cottage', 'Norris Gardens', 'Old Naples Historic District', 'One block from Naples Pier'],
  },
  {
    name: 'The Escalante Hotel',
    city: 'Naples',
    venue_type: 'historic',
    contact_website: 'https://hotelescalante.com',
    contact_phone: '239-659-3466',
    description: "Independent Mediterranean-villa-style boutique hotel in downtown Old Naples at Fifth Avenue and Third Street South. Couples can host ceremonies in the courtyard gardens, beside old-world fountains, or on the nearby private Gulf beach, and may reserve the entire property for an intimate destination wedding.",
    capacity_min: 30,
    capacity_max: 80,
    price_min: null,
    amenities: ['Courtyard gardens with fountains', 'Pool', 'Private beach shuttle', 'Bungalow-style guest rooms', 'Whole-property buyout option'],
  },
  {
    name: 'Bella Vista Ranch',
    city: 'Naples',
    venue_type: 'garden',
    contact_website: 'https://bellavistaranchnaples.com',
    contact_phone: '239-289-1992',
    description: "Privately owned Naples estate built around koi gardens with cascading waterfalls, lit palms and a luxury estate home that sleeps eight. The owners deliberately host a limited number of events per year and bundle in-house catering with the property rental.",
    capacity_min: null,
    capacity_max: 120,
    price_min: null,
    amenities: ['Koi gardens with waterfalls', 'Lit palm tree ceremony lawn', 'On-site estate home', 'In-house catering'],
  },
  {
    name: 'Shangri-La Springs',
    city: 'Bonita Springs',
    venue_type: 'garden',
    contact_website: 'https://www.shangrilasprings.com',
    contact_phone: '239-949-0749',
    description: "Independent historic boutique hotel established in 1926 on more than eight acres in downtown Bonita Springs, with ceremony spots beneath Mysore fig trees, beside a fountain, and inside restored historic interiors. The property pairs weddings with an on-site organic spa and the Harvest & Wisdom farm-to-table restaurant.",
    capacity_min: null,
    capacity_max: 500,
    price_min: null,
    amenities: ['8+ acres of gardens with springs', 'Mysore fig tree ceremony site', 'Restored 1926 buildings', 'Farm-to-table restaurant', 'Organic spa', 'Indoor and outdoor spaces'],
  },
  {
    name: 'Sola Gratia Estate',
    city: 'Marco Island',
    venue_type: 'historic',
    contact_website: 'https://www.solagratiaestate.com',
    contact_phone: null,
    description: "Private Mediterranean-inspired mansion on roughly 2.5 acres of Marco Island waterfront, used as both a wedding venue and a film location. The estate offers indoor and outdoor ceremony settings, dedicated bridal and groom suites, and access to a curated network of in-house rentals and outside vendors.",
    capacity_min: null,
    capacity_max: 500,
    price_min: null,
    amenities: ['2.5-acre waterfront grounds', 'Mediterranean-inspired mansion', 'Bridal and groom suites', 'Indoor and outdoor ceremony spaces', 'Open-vendor policy'],
  },
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
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const rows = VENUES.map((v) => {
    const slug = `${slugify(v.name)}-${slugify(v.city)}`;
    return {
      legacy_id: slug,
      slug,
      tier: 'starter' as const,
      name: v.name,
      description: v.description,
      city: v.city,
      state: 'FL',
      capacity_min: v.capacity_min,
      capacity_max: v.capacity_max,
      venue_type: v.venue_type,
      price_min: v.price_min,
      amenities: v.amenities,
      tags: [],
      images: [],
      contact_phone: v.contact_phone,
      contact_email: null,
      contact_email_real: false,
      contact_website: v.contact_website,
    };
  });

  console.log(`Inserting ${rows.length} venues…`);
  const { data, error } = await supabase
    .from('venues')
    .upsert(rows, { onConflict: 'slug' })
    .select('slug, name, city, venue_type');

  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }

  console.log(`✓ ${data?.length ?? 0} venues upserted`);
  for (const v of data ?? []) {
    console.log(`  - ${v.slug} (${v.city}, ${v.venue_type})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
