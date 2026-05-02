// Tasteful fallback for vendor cards that lack a photo. Branded gradient + the
// vendor's initials + a small category glyph. Replaces the emoji placeholder
// that all 30 current vendors render today.
//
// Once vendors.json carries real images this component will be unused.

interface VendorImagePlaceholderProps {
  name: string;
  category?: string;
  className?: string;
}

const GRADIENTS: Array<[string, string]> = [
  ['#ec4899', '#8b5cf6'], // pink → purple (brand)
  ['#f472b6', '#a78bfa'], // soft pink → soft purple
  ['#db2777', '#7c3aed'], // deeper pink → violet
  ['#f43f5e', '#9333ea'], // rose → purple
  ['#e11d48', '#6366f1'], // rose → indigo
  ['#be185d', '#5b21b6'], // dark rose → dark violet
];

// Maps a category string to a small inline SVG glyph. Keeps the placeholder
// silhouette-style rather than emoji so it reads as branded.
function categoryGlyph(category: string): JSX.Element {
  const c = (category || '').toLowerCase();
  if (c.includes('photo') || c.includes('video')) {
    return (
      <path d="M9 4h6l1.5 2H20a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2.5L9 4zm3 5a4 4 0 100 8 4 4 0 000-8z" />
    );
  }
  if (c.includes('flor')) {
    return (
      <path d="M12 2a3 3 0 00-3 3v.27A3 3 0 005 8a3 3 0 002 2.83V11a3 3 0 00-2 2.83A3 3 0 005 18a3 3 0 003-2.27 3 3 0 005.66-1.16A3 3 0 0019 14a3 3 0 00-2-2.83V11a3 3 0 002-2.83A3 3 0 0015 5.27 3 3 0 0012 2zm0 6a2 2 0 110 4 2 2 0 010-4z" />
    );
  }
  if (c.includes('dj') || c.includes('music') || c.includes('band')) {
    return (
      <path d="M9 18V5l12-2v13M9 18a3 3 0 11-3-3 3 3 0 013 3zm12-2a3 3 0 11-3-3 3 3 0 013 3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    );
  }
  if (c.includes('cater') || c.includes('bake')) {
    return (
      <path d="M12 2a4 4 0 014 4v2h1a2 2 0 012 2v3H5V10a2 2 0 012-2h1V6a4 4 0 014-4zm-7 13h14v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6z" />
    );
  }
  if (c.includes('plan')) {
    return (
      <path d="M19 4h-2V2h-2v2H9V2H7v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z" />
    );
  }
  if (c.includes('hair') || c.includes('makeup') || c.includes('beaut')) {
    return (
      <path d="M12 2a5 5 0 00-5 5c0 2.39 1.69 4.39 4 4.9V13H8v2h3v6h2v-6h3v-2h-3v-1.1c2.31-.51 4-2.51 4-4.9a5 5 0 00-5-5z" />
    );
  }
  if (c.includes('officiant')) {
    return (
      <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" />
    );
  }
  // generic sparkle for entertainment, decorator, transportation, other
  return (
    <path d="M12 2l2.39 6.95L21.5 9l-5.5 4.5 1.61 7.5L12 17l-5.61 4 1.61-7.5L2.5 9l7.11-.05L12 2z" />
  );
}

export default function VendorImagePlaceholder({
  name,
  category = '',
  className = 'w-full h-48',
}: VendorImagePlaceholderProps) {
  const initials = (name || 'Vendor')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  // Stable hash of name → gradient index. Different vendors get different
  // colour pairs but a given vendor always renders the same way.
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const [from, to] = GRADIENTS[Math.abs(hash) % GRADIENTS.length];

  return (
    <div
      className={`${className} relative flex items-center justify-center text-white overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      aria-hidden="true"
    >
      {/* category glyph, large and faint behind initials */}
      <svg
        viewBox="0 0 24 24"
        className="absolute right-3 bottom-3 w-16 h-16 text-white/20"
        fill="currentColor"
      >
        {categoryGlyph(category)}
      </svg>

      <div className="relative text-center px-4">
        <div className="text-4xl font-bold tracking-wide drop-shadow-sm">
          {initials || 'FW'}
        </div>
        {category && (
          <div className="mt-1 text-xs uppercase tracking-widest text-white/80">
            {category}
          </div>
        )}
      </div>
    </div>
  );
}
