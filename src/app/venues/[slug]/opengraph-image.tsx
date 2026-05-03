import { ImageResponse } from 'next/og';
import { getVenueBySlug } from '@/lib/catalog';

// Phase 6 — dynamic OG image for venue detail pages.
// Standard 1200x630 (1.91:1) for Facebook, Twitter, LinkedIn.
//
// Pinterest gets a separate 2:3 image at /venues/[slug]/pinterest-image.

export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function OG({ params }: { params: { slug: string } }) {
  const venue = await getVenueBySlug(params.slug);
  const name = venue?.name ?? 'Florida Wedding Wonders';
  const city = venue?.address.city ?? 'Florida';
  const venueType = venue?.venueType ?? 'wedding';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px',
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            background: 'rgba(255,255,255,0.18)',
            padding: '8px 18px',
            borderRadius: '999px',
            fontSize: '22px',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {venueType} venue · {city}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: name.length > 50 ? '52px' : '64px',
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: '32px',
            marginBottom: 'auto',
            letterSpacing: '-0.02em',
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '22px',
            fontWeight: 600,
          }}
        >
          <span>Florida Wedding Wonders</span>
          <span style={{ opacity: 0.85 }}>floridaweddingwonders.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
