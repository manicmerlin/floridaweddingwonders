const fs = require('fs');
const path = require('path');

// Read the venues data
const venuesPath = path.join(__dirname, '../src/data/venues.json');
const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));

const venues = venuesData.weddingVenues;

console.log(`Checking ${venues.length} venues for potential closure status...`);
console.log('Venues to investigate further:');
console.log('=' * 50);

// Keywords that might indicate closure issues
const closureKeywords = [
  'permanently closed',
  'temporarily closed', 
  'closed permanently',
  'out of business',
  'no longer operating',
  'closed down',
  'shuttered',
  'ceased operations'
];

// Export venue list for manual checking
const venueList = venues.map(venue => ({
  name: venue.name,
  location: venue.location,
  phone: venue.contactInfo?.phone || 'N/A',
  website: venue.contactInfo?.website || 'N/A',
  address: `${venue.location.address}, ${venue.location.city}, ${venue.location.state} ${venue.location.zipCode}`
}));

// Write to CSV for easy checking
const csv = [
  'Name,City,Phone,Website,Full Address',
  ...venueList.map(v => `"${v.name}","${v.location.city}","${v.phone}","${v.website}","${v.address}"`)
].join('\n');

fs.writeFileSync(path.join(__dirname, 'venues_to_check.csv'), csv);

console.log('Created venues_to_check.csv with all venue details');
console.log('\nVenues by city:');

// Group by city for easier checking
const byCity = venues.reduce((acc, venue) => {
  const city = venue.location.city;
  if (!acc[city]) acc[city] = [];
  acc[city].push(venue.name);
  return acc;
}, {});

Object.entries(byCity).forEach(([city, venueNames]) => {
  console.log(`\n${city}: ${venueNames.length} venues`);
  venueNames.forEach(name => console.log(`  - ${name}`));
});

console.log('\nNext steps:');
console.log('1. Check venues_to_check.csv');
console.log('2. Search Google for "[venue name] + closed" or "[venue name] + permanently closed"');
console.log('3. Check venue websites and social media');
console.log('4. Verify Google Business listings');
