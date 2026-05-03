import { ImageResponse } from 'next/og';
import { getVenueBySlug } from '@/lib/catalog';

// Phase 6 — Pinterest-optimized image for venue detail pages.
// 1000x1500 (2:3) is Pinterest's recommended share-card aspect ratio.
// Referenced via <meta property="pinterest:image"> + <meta property="og:image:secure_url"> override
// on Pinterest pin embeds.

export const dynamic = 'force-dynamic';
export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
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
          padding: '80px 64px',
          background: 'linear-gradient(180deg, #ec4899 0%, #8b5cf6 60%, #3b82f6 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            background: 'rgba(255,255,255,0.2)',
            padding: '10px 22px',
            borderRadius: '999px',
            fontSize: '28px',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {venueType} venue · {city}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '60px',
            marginBottom: 'auto',
          }}
        >
          <div
            style={{
              fontSize: name.length > 40 ? '64px' : '84px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              marginBottom: '32px',
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 500,
              opacity: 0.92,
              lineHeight: 1.3,
            }}
          >
            Florida wedding venue
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '32px',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', marginBottom: 12 }}>
            Florida Wedding Wonders
          </div>
          <div style={{ display: 'flex', opacity: 0.85, fontSize: '24px' }}>
            floridaweddingwonders.com
          </div>
        </div>
      </div>
    ),
    { width: 1000, height: 1500 }
  );
}
