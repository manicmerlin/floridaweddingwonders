import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog';

// Phase 6 — Pinterest-optimized image for blog posts.
// 1000x1500 (2:3) is Pinterest's recommended share-card aspect ratio.

export const dynamic = 'force-dynamic';
export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const post = getPostBySlug(params.slug);
  const title = post?.title ?? 'Florida Wedding Wonders';
  const category = post?.category ?? 'Wedding Planning';

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
          }}
        >
          {category}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 60 ? '60px' : '76px',
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: '60px',
            marginBottom: 'auto',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
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
