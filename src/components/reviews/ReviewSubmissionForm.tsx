'use client';

import { useState } from 'react';

interface Props {
  venueUuid: string;
  venueName: string;
}

export default function ReviewSubmissionForm({ venueUuid, venueName }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [weddingDate, setWeddingDate] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueUuid,
          reviewerName,
          reviewerEmail: reviewerEmail || null,
          rating,
          title: title || null,
          body,
          weddingDate: weddingDate || null,
        }),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => ({}));
        setError(r.error || 'Submission failed');
        return;
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-2">✓</div>
        <p className="text-green-900 font-medium">Thanks! Your review is in our moderation queue.</p>
        <p className="text-green-700 text-sm mt-1">It typically appears within 24-48 hours.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium px-5 py-2 rounded-lg"
      >
        Write a review
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Review {venueName}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Rating:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl transition ${
              n <= rating ? 'text-amber-400' : 'text-gray-300'
            }`}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your name" required>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
          />
        </Field>
        <Field label="Email (optional, kept private)">
          <input
            type="email"
            value={reviewerEmail}
            onChange={(e) => setReviewerEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
          />
        </Field>
        <Field label="Wedding date (optional)">
          <input
            type="date"
            value={weddingDate}
            onChange={(e) => setWeddingDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
          />
        </Field>
        <Field label="Title (optional)">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
          />
        </Field>
      </div>

      <Field label="Your review" required>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          placeholder="Share your honest experience — what was great, what wasn't, what you'd want other couples to know."
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
        />
      </Field>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-pink-600 hover:bg-pink-700 text-white font-medium px-5 py-2 rounded-lg disabled:bg-pink-300"
        >
          {submitting ? 'Submitting...' : 'Submit review'}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Reviews are moderated. We approve genuine experiences and decline anything that
        looks fake, defamatory, or off-topic.
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 mb-1 block">
        {label}
        {required && <span className="text-pink-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
