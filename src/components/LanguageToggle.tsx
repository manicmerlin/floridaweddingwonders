'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

/**
 * EN | ES toggle that sits in the nav bar. Active locale renders as a
 * solid pill, inactive as a link. Clicking the inactive locale hits
 * /api/locale which writes the NEXT_LOCALE cookie and 303's back to the
 * current page so server components re-render with the new translations.
 */
export default function LanguageToggle() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  // Just use the pathname for the redirect — preserving query strings on
  // language toggle isn't worth wrapping the component in <Suspense> to
  // satisfy useSearchParams() build-time constraints in Next 14.
  const pathname = usePathname() ?? '/';
  const href = (to: 'en' | 'es') =>
    `/api/locale?to=${to}&next=${encodeURIComponent(pathname)}`;

  const active =
    'bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold';
  const inactive =
    'text-gray-700 hover:text-gray-900 px-2 py-1 text-xs font-bold';

  return (
    <div
      className="inline-flex items-center border border-gray-200 rounded overflow-hidden"
      role="group"
      aria-label="Language selector"
    >
      <a
        href={href('en')}
        aria-current={locale === 'en' ? 'true' : undefined}
        aria-label={t('switchToEnglish')}
        className={locale === 'en' ? active : inactive}
      >
        EN
      </a>
      <span className="text-gray-300" aria-hidden="true">
        |
      </span>
      <a
        href={href('es')}
        aria-current={locale === 'es' ? 'true' : undefined}
        aria-label={t('switchToSpanish')}
        className={locale === 'es' ? active : inactive}
      >
        ES
      </a>
    </div>
  );
}
