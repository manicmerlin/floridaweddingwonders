import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog';

// Dynamic OG image for every blog post — Pinterest, Facebook, and X all
// fetch this URL when the post is shared. Renders the post title against
// the brand gradient so each post has a unique, branded share card without
// needing per-post hand-designed assets.
//
// Runtime is the default (nodejs) rather than edge because @/lib/blog uses
// Node fs to read MDX files. The trade-off is fine — OG images are cached
// at the CDN, so cold-start latency only hits the first crawler request.

export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function OG({ params }: { params: { slug: string } }) {
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
          }}
        >
          {category}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: title.length > 60 ? '52px' : '64px',
            fontWeight: 800,
            lineHeight: 1.1,
            marginTop: '32px',
            marginBottom: 'auto',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '24px',
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
