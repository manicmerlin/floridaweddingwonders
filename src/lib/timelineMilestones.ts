// Standard wedding planning milestones, expressed as months-before-wedding.
// Calibrated to Florida specifics: peak-season booking lead times for the
// Keys + Miami estate market, marriage license window, hurricane-season
// prompts. Used by /tools/timeline to render a personalized checklist.

export interface Milestone {
  /** Stable id used for localStorage check-off + URL params */
  id: string;
  /** Months before the wedding date this milestone is due */
  monthsBefore: number;
  /** Category bucket for visual grouping */
  category:
    | 'venue-vendors'
    | 'guests'
    | 'attire'
    | 'logistics'
    | 'legal'
    | 'final-month'
    | 'wedding-week';
  /** Display title */
  title: string;
  /** 1-2 sentence description shown under the title */
  description: string;
  /** Optional CTA link + label rendered inline */
  cta?: { href: string; label: string };
}

export const MILESTONES: Milestone[] = [
  // 12+ months
  { id: 'venue-book', monthsBefore: 12, category: 'venue-vendors', title: 'Lock the venue', description: 'Top Florida venues book 12–18 months ahead for peak Saturdays. This is the only truly time-sensitive item on the entire timeline.', cta: { href: '/quotes/request', label: 'Get quotes from up to 5 venues' } },
  { id: 'guest-band', monthsBefore: 12, category: 'guests', title: 'Pick a guest-count band', description: 'Commit to "60–80," "100–125," or "150+." Capacity tiers cap your venue options hard.' },
  { id: 'budget', monthsBefore: 12, category: 'logistics', title: 'Set the total budget', description: 'See where the math lands across the 14 standard categories.', cta: { href: '/tools/budget', label: 'Open the budget calculator' } },

  // 10–12
  { id: 'photographer', monthsBefore: 11, category: 'venue-vendors', title: 'Book the photographer + videographer', description: 'Florida photographers worth booking are gone 9–12 months out for peak weekends.' },
  { id: 'planner', monthsBefore: 11, category: 'venue-vendors', title: 'Hire planner or month-of coordinator', description: 'Skip if your venue includes coordination. Otherwise this person is your sanity preservation budget.' },
  { id: 'officiant', monthsBefore: 10, category: 'venue-vendors', title: 'Choose the officiant', description: 'Florida requires officiants be a notary, judicial officer, or ordained minister. Online ordination is legal here.' },
  { id: 'band-dj', monthsBefore: 10, category: 'venue-vendors', title: 'Book band or DJ', description: 'Peak-season Florida music vendors book 9 months out. Get demos before signing.' },

  // 8–9
  { id: 'save-the-date', monthsBefore: 9, category: 'guests', title: 'Send save-the-dates', description: 'Send 8 months out for in-state guests, 10 months for destination weddings. Include a wedding website URL.' },
  { id: 'dress', monthsBefore: 9, category: 'attire', title: 'Order the wedding dress', description: 'Alterations alone take 8–12 weeks; production is another 4–6 months. Don\'t compress.' },
  { id: 'attire-party', monthsBefore: 8, category: 'attire', title: 'Bridesmaid + groomsmen attire', description: 'Coordinate styles and order via the same boutique when possible — color matching is more reliable.' },
  { id: 'hotel-blocks', monthsBefore: 8, category: 'guests', title: 'Reserve hotel room blocks', description: 'Florida hotels need lead time for negotiated rates, especially in peak-season Keys / Naples / Palm Beach.' },

  // 6–8
  { id: 'florist', monthsBefore: 7, category: 'venue-vendors', title: 'Book the florist', description: 'Peak-season Florida florists book 6 months out. Tropical wholesale supply has gotten thinner since 2020.' },
  { id: 'cake', monthsBefore: 6, category: 'venue-vendors', title: 'Choose the cake / dessert vendor', description: 'Most Florida cake vendors do tastings 6–8 months out. Schedule yours when you book.' },
  { id: 'invitations-design', monthsBefore: 6, category: 'guests', title: 'Design invitations', description: 'Your stationer needs 6–8 weeks lead time. Order envelopes + addressing service in the same flow.' },
  { id: 'transport', monthsBefore: 6, category: 'logistics', title: 'Book transportation', description: 'Shuttle, party bus, vintage car, or golf carts for Keys properties. Most companies need 4 months.' },

  // 4–6
  { id: 'registry', monthsBefore: 5, category: 'guests', title: 'Create the registry', description: 'Most couples now use Zola, Honeyfund, or Honeyminder. Mix traditional + cash + experiences.' },
  { id: 'rentals', monthsBefore: 5, category: 'logistics', title: 'Finalize rental inventory', description: 'Chairs, linens, plates, glassware, tents. Get the tent quote even if you don\'t think you need one — Florida thunderstorms are sharp.' },
  { id: 'ceremony', monthsBefore: 4, category: 'logistics', title: 'Draft the ceremony script', description: 'Work with the officiant on order, readings, and any cultural traditions you\'re including.' },

  // 3
  { id: 'license-plan', monthsBefore: 3, category: 'legal', title: 'Plan the marriage license window', description: 'Florida licenses are valid for exactly 60 days. Most couples apply 30–45 days before the wedding so it\'s still valid with comfortable buffer.' },
  { id: 'invitations-send', monthsBefore: 2, category: 'guests', title: 'Mail invitations', description: '8 weeks before for in-state guests; 10 weeks for destination weddings.' },
  { id: 'fitting-1', monthsBefore: 3, category: 'attire', title: 'First dress fitting', description: 'Bring the shoes you\'ll wear. The hem is the longest part of alterations.' },
  { id: 'honeymoon', monthsBefore: 3, category: 'logistics', title: 'Book the honeymoon', description: 'Flights and hotels are cheaper at this lead time than any later. Build in a recovery day at home before the trip.' },

  // 2
  { id: 'vendor-confirm', monthsBefore: 2, category: 'venue-vendors', title: 'Confirm timeline with every vendor', description: 'Photographer arrival, florist drop-off window, cake delivery — get it in writing.' },
  { id: 'tasting', monthsBefore: 2, category: 'venue-vendors', title: 'Final menu tasting at venue', description: 'Bring a notebook and your planner. This is your last chance to swap items.' },
  { id: 'rsvp-chase', monthsBefore: 2, category: 'guests', title: 'Chase silent RSVPs', description: 'Wave 1 at 6 weeks out, wave 2 at 4 weeks out. Phone calls work better than emails by week 4.' },

  // 1 month
  { id: 'final-headcount', monthsBefore: 1, category: 'final-month', title: 'Final headcount lock with venue', description: 'Most contracts require this 14–21 days out. Adding guests after this point usually carries a per-head premium.' },
  { id: 'seating', monthsBefore: 1, category: 'final-month', title: 'Finalize the seating chart', description: 'Save it as a shared Google Doc your wedding party can reference on the day.' },
  { id: 'license-pickup', monthsBefore: 1, category: 'legal', title: 'Apply for + pick up the marriage license', description: 'Both partners present, valid ID, $93.50 (or $61 with completed premarital course). 3-day waiting period for FL residents who skip the course.' },
  { id: 'storm-plan', monthsBefore: 1, category: 'final-month', title: 'Confirm hurricane / storm contingency (if June–Nov)', description: 'Where does the ceremony move? Who makes the call to relocate, and what\'s the deadline?' },
  { id: 'fitting-2', monthsBefore: 1, category: 'attire', title: 'Final dress fitting', description: 'This is the last fitting. Don\'t lose or gain weight after this — the dress is set.' },

  // Wedding week
  { id: 'kit', monthsBefore: 0.25, category: 'wedding-week', title: 'Pack the day-of emergency kit', description: 'Safety pins, stain wipes, bobby pins, mints, painkillers, deodorant. Florida humidity makes the last one matter.' },
  { id: 'welcome-bags', monthsBefore: 0.25, category: 'wedding-week', title: 'Welcome bags to hotel block', description: 'Water, sunscreen, a local snack, a printed map with restaurant recs. Goes a long way for out-of-town guests.' },
  { id: 'rehearsal', monthsBefore: 0.1, category: 'wedding-week', title: 'Rehearsal + rehearsal dinner', description: 'Day before the wedding. Walk the order with the wedding party.' },
  { id: 'rest', monthsBefore: 0.1, category: 'wedding-week', title: 'Rest day', description: 'Drink water, eat an actual meal, log off your phone for two hours.' },
];

export const CATEGORY_LABELS: Record<Milestone['category'], string> = {
  'venue-vendors': 'Venue & vendors',
  guests: 'Guests',
  attire: 'Attire & beauty',
  logistics: 'Logistics',
  legal: 'Legal',
  'final-month': 'Final month',
  'wedding-week': 'Wedding week',
};

/**
 * Compute the absolute due-date for each milestone given a wedding date.
 * Negative monthsBefore is unusual but supported (post-wedding tasks).
 */
export function attachDueDates(weddingDate: Date): Array<Milestone & { dueDate: Date }> {
  return MILESTONES.map((m) => {
    const due = new Date(weddingDate);
    due.setMonth(due.getMonth() - Math.floor(m.monthsBefore));
    if (m.monthsBefore < 1) {
      // Sub-month milestones — convert fractional months to days
      const days = Math.floor(m.monthsBefore * 30);
      due.setTime(weddingDate.getTime() - days * 24 * 60 * 60 * 1000);
    }
    return { ...m, dueDate: due };
  }).sort((a, b) => b.monthsBefore - a.monthsBefore);
}
