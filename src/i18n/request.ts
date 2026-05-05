// next-intl request configuration — cookie-driven locale resolution.
//
// We deliberately do NOT use path-prefix routing ([locale] segment). The
// URL stays the same in either language; the cookie + Accept-Language
// header pick which messages render. This means /venues/in/miami works
// in both languages, simpler routing + better SEO (no duplicate URLs).
//
// Resolution order:
//   1) `NEXT_LOCALE` cookie set by the language toggle (persistent)
//   2) Accept-Language header (first match against SUPPORTED)
//   3) DEFAULT_LOCALE
//
// Fallback: if a key exists in en.json but not es.json, next-intl falls
// back to en.json automatically (configured via the `messages` merge
// below).

import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

function isSupported(value: string | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Reads the locale a request should render in. Server-only. */
export async function resolveLocale(): Promise<Locale> {
  const cookieValue = cookies().get(LOCALE_COOKIE)?.value;
  if (isSupported(cookieValue)) return cookieValue;

  // Accept-Language header — take the first segment that matches a
  // supported locale. Format is like "es-ES,es;q=0.9,en;q=0.8".
  const accept = headers().get('accept-language') ?? '';
  for (const part of accept.split(',')) {
    const tag = part.trim().split(';')[0]?.toLowerCase();
    const primary = tag?.split('-')[0];
    if (isSupported(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

/** Deep merge so es.json overrides en.json key-by-key without erasing
 *  whole sub-trees when es lacks a particular leaf. Plain object merge is
 *  enough — our message tree is JSON, no Maps/Sets. */
function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    const baseVal = base[k];
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      baseVal &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      out[k] = deepMerge(
        baseVal as Record<string, unknown>,
        v as Record<string, unknown>
      );
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  // Merge en + active locale so missing keys fall back to English. Avoids
  // throwing in production when a translator forgets a string.
  const en = (await import('@/messages/en.json')).default;
  if (locale === 'en') return { locale, messages: en };
  const localeMessages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, messages: deepMerge(en, localeMessages) };
});
