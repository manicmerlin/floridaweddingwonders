import type { Venue } from '@/types';

interface Props {
  venue: Pick<
    Venue,
    'generatorBackup' | 'acTentAvailable' | 'indoorFallbackCapacity' | 'stormPolicyText'
  >;
}

/**
 * Florida-Ready panel — surfaces the four hurricane / rain-plan signals
 * that differentiate Florida-experienced venues. Renders nothing when no
 * field is populated (most rows until owners self-tag via the dashboard).
 *
 * Why a panel and not chips: storm policies are paragraphs of context,
 * not single tags. A boxed panel reads as a deliberate "we've thought
 * about this" signal; chips would feel like checkboxes for SEO.
 */
export default function FloridaReadyPanel({ venue }: Props) {
  const hasAny =
    venue.generatorBackup === true ||
    venue.acTentAvailable === true ||
    typeof venue.indoorFallbackCapacity === 'number' ||
    !!venue.stormPolicyText;
  if (!hasAny) return null;

  return (
    <section className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 mr-3 text-lg">
          🌀
        </span>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Florida-Ready</h3>
          <p className="text-sm text-gray-500">
            Practical preparation for hurricane season and afternoon storms.
          </p>
        </div>
      </div>

      <ul className="grid sm:grid-cols-2 gap-3 mb-4">
        {venue.generatorBackup === true && (
          <li className="flex items-start text-sm">
            <span className="text-emerald-600 mr-2 mt-0.5">✓</span>
            <span className="text-gray-700">
              <strong className="text-gray-900">Generator backup</strong> on standby for outages.
            </span>
          </li>
        )}
        {venue.acTentAvailable === true && (
          <li className="flex items-start text-sm">
            <span className="text-emerald-600 mr-2 mt-0.5">✓</span>
            <span className="text-gray-700">
              <strong className="text-gray-900">A/C tent available</strong> for outdoor events in summer heat.
            </span>
          </li>
        )}
        {typeof venue.indoorFallbackCapacity === 'number' && (
          <li className="flex items-start text-sm">
            <span className="text-emerald-600 mr-2 mt-0.5">✓</span>
            <span className="text-gray-700">
              <strong className="text-gray-900">Indoor fallback</strong> seats up to{' '}
              {venue.indoorFallbackCapacity.toLocaleString()} guests if weather forces a move.
            </span>
          </li>
        )}
      </ul>

      {venue.stormPolicyText && (
        <div className="border-t border-emerald-100 pt-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">Storm / rain policy</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{venue.stormPolicyText}</p>
        </div>
      )}
    </section>
  );
}
