import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import VendorDetailClient from '@/components/vendors/VendorDetailClient';
import {
  getVendorByLegacyId,
  getVendorBySlug,
  getVendors,
} from '@/lib/catalog';

interface Params {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = params;
  if (/^\d+$/.test(slug)) return { title: 'Vendor | Florida Wedding Wonders' };
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return { title: 'Vendor | Florida Wedding Wonders' };
  return {
    title: `${vendor.name} | Florida Wedding Wonders`,
    description: vendor.description,
    alternates: { canonical: `https://floridaweddingwonders.com/vendors/${vendor.slug}` },
  };
}

export default async function VendorSlugPage({ params }: Params) {
  const { slug } = params;

  // Vendor legacy_ids in the JSON were already kebab-case strings, so most
  // /vendors/<id> URLs are byte-identical to /vendors/<slug>. The numeric
  // branch is here for symmetry — a hypothetical future legacy numeric.
  if (/^\d+$/.test(slug)) {
    const vendor = await getVendorByLegacyId(slug);
    if (!vendor) notFound();
    permanentRedirect(`/vendors/${vendor.slug}`);
  }

  const vendor = await getVendorBySlug(slug);
  if (!vendor) {
    // Fall back to legacy lookup in case caller has the old kebab id but it
    // somehow differs from the new slug (defensive — won't happen with
    // current data since slug == legacy_id for vendors).
    const byLegacy = await getVendorByLegacyId(slug);
    if (byLegacy && byLegacy.slug !== slug) {
      permanentRedirect(`/vendors/${byLegacy.slug}`);
    }
    notFound();
  }

  const cohort = await getVendors({ category: vendor.category });
  const relatedVendors = cohort.filter((v) => v.id !== vendor.id).slice(0, 3);

  return <VendorDetailClient vendor={vendor} relatedVendors={relatedVendors} />;
}
