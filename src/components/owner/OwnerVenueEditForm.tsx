'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface VenueImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface VenueProps {
  id: string;
  slug: string;
  name: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  contactWebsite: string;
  capacityText: string;
  addressStreet: string;
  addressZip: string;
  amenities: string[];
  tags: string[];
  images: VenueImage[];
  tier: 'starter' | 'growth' | 'scale';
}

export default function OwnerVenueEditForm({
  venue,
  maxPhotos,
}: {
  venue: VenueProps;
  maxPhotos: number;
}) {
  const router = useRouter();
  const [_, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [form, setForm] = useState({
    description: venue.description,
    contactPhone: venue.contactPhone,
    contactEmail: venue.contactEmail,
    contactWebsite: venue.contactWebsite,
    capacityText: venue.capacityText,
    addressStreet: venue.addressStreet,
    addressZip: venue.addressZip,
    amenitiesText: venue.amenities.join('\n'),
    tagsText: venue.tags.join(', '),
  });

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const amenities = form.amenitiesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const tags = form.tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`/api/owner/venues/${venue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          contactPhone: form.contactPhone || null,
          contactEmail: form.contactEmail || null,
          contactWebsite: form.contactWebsite || null,
          capacityText: form.capacityText || null,
          addressStreet: form.addressStreet || null,
          addressZip: form.addressZip || null,
          amenities,
          tags,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.error || 'Save failed');
        return;
      }
      setSavedAt(new Date().toLocaleTimeString());
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PhotoManager venue={venue} maxPhotos={maxPhotos} />

      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-gray-900">Listing details</h2>

        <Field label="Description">
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Capacity (free-text)">
            <input
              type="text"
              value={form.capacityText}
              onChange={(e) => setField('capacityText', e.target.value)}
              placeholder="e.g. Up to 200 seated, 250 cocktail"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              type="text"
              value={form.tagsText}
              onChange={(e) => setField('tagsText', e.target.value)}
              placeholder="historic, garden, beachfront"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
          </Field>
        </div>

        <Field label="Amenities (one per line)">
          <textarea
            rows={5}
            value={form.amenitiesText}
            onChange={(e) => setField('amenitiesText', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
          />
        </Field>

        <h2 className="text-lg font-semibold text-gray-900 pt-4 border-t">Contact</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setField('contactPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
          </Field>
          <Field label="Email (real address — receives inquiries)">
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setField('contactEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
          </Field>
        </div>

        <Field label="Website">
          <input
            type="url"
            value={form.contactWebsite}
            onChange={(e) => setField('contactWebsite', e.target.value)}
            placeholder="https://"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
          />
        </Field>

        <h2 className="text-lg font-semibold text-gray-900 pt-4 border-t">Address</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Street">
            <input
              type="text"
              value={form.addressStreet}
              onChange={(e) => setField('addressStreet', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
          </Field>
          <Field label="ZIP">
            <input
              type="text"
              value={form.addressZip}
              onChange={(e) => setField('addressZip', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
          </Field>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t">
          {savedAt && <span className="text-xs text-gray-500">Saved at {savedAt}</span>}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-semibold rounded-md"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Photo manager — upload + delete + tier-cap message
// ---------------------------------------------------------------------------

function PhotoManager({
  venue,
  maxPhotos,
}: {
  venue: VenueProps;
  maxPhotos: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [images, setImages] = useState<VenueImage[]>(venue.images);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cap = Number.isFinite(maxPhotos) ? maxPhotos : Infinity;
  const atCap = images.length >= cap;

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/owner/venues/${venue.id}/photos`, {
        method: 'POST',
        body: fd,
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.error || 'Upload failed');
        return;
      }
      setImages((prev) => [...prev, result.image]);
      startTransition(() => router.refresh());
    } finally {
      setUploading(false);
    }
  };

  const remove = async (photoId: string) => {
    setError(null);
    const res = await fetch(
      `/api/owner/venues/${venue.id}/photos?photoId=${encodeURIComponent(photoId)}`,
      { method: 'DELETE' }
    );
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(result.error || 'Delete failed');
      return;
    }
    setImages((prev) => prev.filter((i) => i.id !== photoId));
    startTransition(() => router.refresh());
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
        <span className="text-sm text-gray-500">
          {images.length} of {Number.isFinite(maxPhotos) ? maxPhotos : '∞'}
        </span>
      </div>

      {atCap && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          You've hit your {venue.tier} plan's photo limit.{' '}
          <a href="/venue-packages" className="font-semibold underline">
            Upgrade to Growth or Scale
          </a>{' '}
          for unlimited photos.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-100"
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            {img.isPrimary && (
              <span className="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                Primary
              </span>
            )}
            <button
              onClick={() => remove(img.id)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white text-xs w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <label
        className={`block w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
          atCap
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : 'border-pink-300 hover:bg-pink-50 text-pink-600'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          disabled={atCap || uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.currentTarget.value = '';
          }}
          className="hidden"
        />
        {uploading ? 'Uploading…' : atCap ? 'Cap reached — upgrade to add more' : '+ Add photo'}
      </label>
    </div>
  );
}
