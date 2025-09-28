const venues = [
  "The Surfcomber Hotel Miami Beach",
  "MB Hotel Miami Beach", 
  "Sea Watch on the Ocean Fort Lauderdale",
  "Emeril Lagasse Foundation Innovation Kitchen New Orleans",
  "Historic Walton House Miami",
  "Woman's Club of Coconut Grove",
  "The Bath Club Miami",
  "The Cruz Building Miami",
  "Bonnet House Museum Gardens Fort Lauderdale",
  "Stranahan House Fort Lauderdale",
  "Villa Woodbine Miami",
  "Lavan Venue Miami",
  "Secret Gardens Miami",
  "The M Building Miami",
  "The Wharf Miami Fort Lauderdale",
  "Milander Center Arts Entertainment Miami",
  "Lady Jean Ranch",
  "Out of the Blue Celebrations",
  "Pelican Club Jupiter",
  "The Wanderers Club Wellington",
  "Sundy House Delray Beach",
  "The Club at Grandezza Fort Myers", 
  "The Colony Golf Country Club Naples",
  "Heritage Bay Golf Country Club Naples",
  "Lover's Key Adventure Events",
  "Corkscrew Sanctuary",
  "Misty Morning Barn",
  "Naples Princess",
  "Dolphin Point Villas",
  "Ocean Oasis Key Largo",
  "Three Waters Key Largo",
  "La Siesta Resort Villas",
  "Bud N Mary's Marina The Barn",
  "East Sister Rock Island",
  "The Garden at Oldest House Museum",
  "Sunset Watersports",
  "Key West Lighthouse Keeper's Quarters",
  "Fort East Martello",
  "Old Town Manor",
  "Hard Rock Café Key West",
  "First Flight Island Brewery",
  "Ernest Hemingway Home Museum",
  "Fort Zachary Taylor State Park",
  "Bagatelle Restaurant",
  "Key West Historic Inns",
  "The Blue Room",
  "Schooner Appledore",
  "Suite Dreams Inn",
  "Patch of Heaven Sanctuary",
  "Redland Koi Gardens",
  "Schnebly Redland Winery",
  "Ever After Farms Tropical Grove Barn",
  "Villa Toscana Miami",
  "Jungle Island Miami"
];

console.log("VENUES TO MANUALLY CHECK FOR CLOSURE STATUS:");
console.log("=" * 60);

venues.forEach((venue, index) => {
  console.log(`${index + 1}. ${venue}`);
  console.log(`   Search: "${venue} permanently closed OR temporarily closed OR hours OR contact"`);
  console.log(`   Check: Website, Google Business, Yelp, Facebook`);
  console.log("");
});

console.log("\nPRIORITY CHECK (Higher Risk Categories):");
console.log("- Historic/older venues: Historic Walton House, Woman's Club of Coconut Grove");
console.log("- Smaller/independent venues: Villa Woodbine, Lavan Venue, Secret Gardens Miami");
console.log("- Specialty/unique venues: Lady Jean Ranch, Out of the Blue Celebrations, Misty Morning Barn");
console.log("- Restaurant/entertainment venues: Hard Rock Café Key West, Bagatelle Restaurant");
console.log("- Bars/breweries: First Flight Island Brewery, The Blue Room");
console.log("- Small accommodations: Suite Dreams Inn, Old Town Manor");

console.log("\nLOW RISK (Major chains/established venues):");
console.log("- Hotel chains: The Surfcomber Hotel, MB Hotel, etc.");
console.log("- Museums: Bonnet House Museum, Ernest Hemingway Home Museum");
console.log("- State parks: Fort Zachary Taylor State Park");
console.log("- Country clubs: The Wanderers Club, Heritage Bay Golf Country Club");
console.log("- Major resorts: All JW Marriott, Hyatt, etc.");
