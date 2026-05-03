// Industry-average budget breakdown for a Florida wedding. Percentages
// reflect the median 2025–2026 distribution we see in actual contracts;
// they net to 100% so the slider math behaves.
//
// Used by /tools/budget for initial allocation; the user can then drag any
// category and the rest auto-rebalance proportionally.

export interface BudgetCategory {
  /** Stable id used in URL params + email subject lines */
  id: string;
  /** Display label */
  label: string;
  /** Default share of total budget, 0–1 */
  defaultShare: number;
  /** One-line description shown in the UI */
  description: string;
}

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: 'venue',         label: 'Venue & Catering', defaultShare: 0.40, description: 'Reception space + plated dinner / buffet.' },
  { id: 'photo',         label: 'Photography',      defaultShare: 0.12, description: 'Photographer + same-day edits + album.' },
  { id: 'video',         label: 'Videography',      defaultShare: 0.05, description: 'Highlight reel + ceremony coverage.' },
  { id: 'flowers',       label: 'Flowers & Decor',  defaultShare: 0.08, description: 'Bouquets, centerpieces, ceremony arch.' },
  { id: 'attire',        label: 'Attire & Beauty',  defaultShare: 0.07, description: 'Dress, suit, hair, makeup, alterations.' },
  { id: 'entertainment', label: 'Music & DJ',       defaultShare: 0.06, description: 'DJ, band, ceremony musician, sound.' },
  { id: 'rings',         label: 'Rings',            defaultShare: 0.04, description: 'Two wedding bands.' },
  { id: 'invitations',   label: 'Invitations',      defaultShare: 0.02, description: 'Save-the-dates, invites, signage.' },
  { id: 'transport',     label: 'Transportation',   defaultShare: 0.03, description: 'Shuttle, car, golf carts.' },
  { id: 'cake',          label: 'Cake & Desserts',  defaultShare: 0.02, description: 'Wedding cake + dessert bar.' },
  { id: 'officiant',     label: 'Officiant',        defaultShare: 0.01, description: 'Ceremony officiant fee.' },
  { id: 'favors',        label: 'Favors & Misc',    defaultShare: 0.03, description: 'Welcome bags, gifts, signage.' },
  { id: 'planner',       label: 'Planner / Coord',  defaultShare: 0.05, description: 'Month-of coordinator or full planner.' },
  { id: 'buffer',        label: 'Buffer (10%)',     defaultShare: 0.02, description: 'Tip pool, last-minute additions.' },
];

export function totalShare(): number {
  return BUDGET_CATEGORIES.reduce((acc, c) => acc + c.defaultShare, 0);
}
