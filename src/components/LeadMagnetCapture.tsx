'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  /**
   * Where the capture happened. Allowlisted in the API
   * ('blog' | 'venues' | 'vendors' | 'dress-shops' | 'home').
   */
  source: 'blog' | 'venues' | 'vendors' | 'dress-shops' | 'home';
  /**
   * Visual variant. 'card' is a self-contained box; 'inline' is a slim
   * horizontal bar that sits inside another section. Defaults to 'card'.
   */
  variant?: 'card' | 'inline';
}

interface ApiResponse {
  success: boolean;
  pdfUrl?: string;
  message?: string;
  alreadyCaptured?: boolean;
}

export default function LeadMagnetCapture({ source, variant = 'card' }: Props) {
  const t = useTranslations('LeadMagnet');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data: ApiResponse = await res.json();
      if (!res.ok || !data.success || !data.pdfUrl) {
        setError(t('errorBody'));
        return;
      }
      setSuccess(data);
      // Auto-trigger the download. The browser will save it directly to
      // the user's downloads folder; the link below also stays clickable
      // in case the auto-trigger is blocked.
      const a = document.createElement('a');
      a.href = data.pdfUrl;
      a.download = 'florida-wedding-planning-checklist.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError(t('errorBody'));
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS PANEL — same content for both variants.
  if (success) {
    return (
      <div
        className={
          variant === 'card'
            ? 'bg-white rounded-2xl border border-pink-200 p-5 sm:p-6 my-8 shadow-sm text-center'
            : 'bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 my-6 text-center text-sm'
        }
      >
        <p className="text-gray-800 mb-2">
          {success.message ?? t('successBody')}
        </p>
        <a
          href={success.pdfUrl}
          download
          className="text-pink-700 font-semibold underline hover:text-pink-800"
        >
          {t('successTitle')}
        </a>
      </div>
    );
  }

  // CAPTURE PANEL.
  if (variant === 'inline') {
    return (
      <form
        onSubmit={onSubmit}
        className="bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 my-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="flex items-center gap-3 flex-1 text-sm text-gray-800">
          <span aria-hidden className="text-2xl">📋</span>
          <span>
            <strong className="text-gray-900">{t('title')}</strong>{' '}
            <span className="text-gray-600">{t('subtitle')}</span>
          </span>
        </div>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 sm:flex-none sm:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          aria-label={t('emailLabel')}
        />
        <button
          type="submit"
          disabled={submitting || !email}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-pink-300"
        >
          {submitting ? t('submitting') : t('submitButton')}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </form>
    );
  }

  // Default 'card' variant — used inside grid sections like /venues.
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl border border-pink-200 p-5 sm:p-6 my-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4"
    >
      <div className="flex items-start gap-3 flex-1">
        <span aria-hidden className="text-3xl shrink-0">📋</span>
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-0.5">
            {t('title')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('subtitle')}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          aria-label={t('emailLabel')}
        />
        <button
          type="submit"
          disabled={submitting || !email}
          className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 rounded-md text-sm font-semibold disabled:bg-pink-300"
        >
          {submitting ? t('submitting') : t('submitButton')}
        </button>
      </div>
      {error && (
        <span className="text-red-600 text-sm w-full sm:w-auto">{error}</span>
      )}
    </form>
  );
}
