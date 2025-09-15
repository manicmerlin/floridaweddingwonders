export interface PricingPackage {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  outcome: string;
  features: string[];
  ctaText: string;
  color: 'green' | 'blue' | 'purple';
  emoji: string;
  value?: string;
}

export const pricingPackages: PricingPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Get Listed',
    price: 'Free',
    outcome: 'Exist online so couples can find you.',
    features: [
      'Appear in search results',
      '2 photos, 1 short blurb',
      'One contact method',
      'Basic tags (3 max)'
    ],
    ctaText: 'Get Listed',
    color: 'green',
    emoji: '🟢',
    value: 'Good for visibility, bad for standing out.'
  },
  {
    id: 'growth',
    name: 'Growth',
    subtitle: 'Get Leads',
    price: '$250/yr',
    outcome: 'Look credible, get inquiries, start booking weddings.',
    features: [
      'Unlimited photos + 1 video',
      'Full description + unlimited tags',
      '"Request Info" button → capture leads directly',
      'Upload menus, floorplans, packages',
      'Featured placement + analytics',
      'Social links + special offers unlocked'
    ],
    ctaText: 'Get Leads',
    color: 'blue',
    emoji: '🔵',
    value: 'One booking covers the cost, everything else is profit.'
  },
  {
    id: 'scale',
    name: 'Scale',
    subtitle: 'Look Pro, Pay Once',
    price: '$2,500 lifetime',
    outcome: 'Pro media + permanent exposure.',
    features: [
      'Pro photo + drone video shoot',
      'Lifetime Growth membership (never pay again)',
      'Founding Partner badge',
      'Featured in our marketing + homepage rotation'
    ],
    ctaText: 'Look Pro, Pay Once',
    color: 'purple',
    emoji: '🟣',
    value: "You'd pay this much for media alone. We give you media + forever exposure."
  }
];

export const getPackageById = (id: string): PricingPackage | undefined => {
  return pricingPackages.find(pkg => pkg.id === id);
};

export const getPackageColors = (color: 'green' | 'blue' | 'purple') => {
  const colorMap = {
    green: {
      primary: '#22c55e',
      light: '#dcfce7',
      text: '#15803d'
    },
    blue: {
      primary: '#3b82f6',
      light: '#dbeafe',
      text: '#1d4ed8'
    },
    purple: {
      primary: '#8b5cf6',
      light: '#f3e8ff',
      text: '#7c3aed'
    }
  };
  
  return colorMap[color];
};
