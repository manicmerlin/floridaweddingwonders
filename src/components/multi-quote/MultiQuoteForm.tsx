'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface VenueCandidate {
  id: string;
  name: string;
  city: string;
  venueType: string;
  capacityMin: number;
  capacityMax: number;
  primaryImage: string | null;
  contactEmail: string;
}

interface Props {
  candidates: VenueCandidate[];
}

type Step = 1 | 2 | 3 | 4;

interface Step1State {
  preferredDate: string;
  dateFlexibility: string;
  guestCount: string;
  venuebudget: string;
  eventType: string;
}

interface Step3State {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

const VENUE_TYPES = ['beach', 'garden', 'ballroom', 'historic', 'modern', 'rustic'];

export default function MultiQuoteForm({ candidates }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [s1, setS1] = useState<Step1State>({
    preferredDate: '',
    dateFlexibility: 'flexible',
    guestCount: '',
    venuebudget: '$10k–$25k',
    eventType: 'Wedding',
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [s3, setS3] = useState<Step3State>({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [filterCity, setFilterCity] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => c.city && set.add(c.city));
    return Array.from(set).sort();
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filterCity && c.city !== filterCity) return false;
      if (filterType && c.venueType !== filterType) return false;
      const guests = parseInt(s1.guestCount, 10);
      if (Number.isFinite(guests) && guests > 0) {
        // Soft filter — show venues whose max ≥ guest count.
        if (c.capacityMax > 0 && c.capacityMax < guests) return false;
      }
      return true;
    });
  }, [candidates, filterCity, filterType, s1.guestCount]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const selectedVenues = candidates.filter((c) => selectedIds.includes(c.id));

  const canStep1Continue =
    s1.guestCount &&
    Number.isFinite(parseInt(s1.guestCount, 10)) &&
    parseInt(s1.guestCount, 10) > 0;
  const canStep2Continue = selectedIds.length >= 2;
  const canStep3Submit = s3.fullName && s3.email && s3.message.length >= 10;

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        userName: s3.fullName,
        userEmail: s3.email,
        message: s3.message,
        leadQualification: {
          eventType: s1.eventType,
          guestCount: parseInt(s1.guestCount, 10) || 0,
          preferredDate: s1.preferredDate || null,
          dateFlexibility: s1.dateFlexibility,
          venuebudget: s1.venuebudget,
          phoneNumber: s3.phone || null,
          fullName: s3.fullName,
          email: s3.email,
        },
        venues: selectedVenues.map((v) => ({
          venueId: v.id,
          venueName: v.name,
          venueEmail: v.contactEmail,
        })),
      };

      const res = await fetch('/api/multi-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Submission failed');
      }
      setStep(4);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Progress bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-3 text-sm">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                step >= n ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {n}
            </div>
            <span className={step >= n ? 'text-gray-800 font-medium' : 'text-gray-500'}>
              {n === 1 ? 'Wedding details' : n === 2 ? 'Pick venues' : 'Send'}
            </span>
            {n < 3 && <span className="mx-2 text-gray-400">→</span>}
          </div>
        ))}
      </div>

      <div className="p-6 sm:p-10">
        {step === 1 && (
          <Step1
            state={s1}
            onChange={setS1}
            onContinue={() => setStep(2)}
            canContinue={!!canStep1Continue}
          />
        )}
        {step === 2 && (
          <Step2
            candidates={filteredCandidates}
            allCount={candidates.length}
            selectedIds={selectedIds}
            cityOptions={cityOptions}
            filterCity={filterCity}
            setFilterCity={setFilterCity}
            filterType={filterType}
            setFilterType={setFilterType}
            toggle={toggleSelect}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
            canContinue={canStep2Continue}
          />
        )}
        {step === 3 && (
          <Step3
            state={s3}
            onChange={setS3}
            selectedVenues={selectedVenues}
            onBack={() => setStep(2)}
            onSubmit={submit}
            canSubmit={!!canStep3Submit}
            submitting={submitting}
            submitError={submitError}
          />
        )}
        {step === 4 && (
          <SuccessPanel
            venues={selectedVenues}
            onReset={() => router.push('/venues')}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step components — split out for clarity
// ---------------------------------------------------------------------------

function Step1({
  state,
  onChange,
  onContinue,
  canContinue,
}: {
  state: Step1State;
  onChange: (next: Step1State) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-gray-900">Tell us about your wedding</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Preferred date">
          <input
            type="date"
            value={state.preferredDate}
            onChange={(e) => onChange({ ...state, preferredDate: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
          />
        </Field>
        <Field label="Date flexibility">
          <select
            value={state.dateFlexibility}
            onChange={(e) => onChange({ ...state, dateFlexibility: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
          >
            <option value="firm">Firm date</option>
            <option value="flexible">Flexible (±2 weeks)</option>
            <option value="very-flexible">Very flexible (any month)</option>
          </select>
        </Field>
        <Field label="Guest count">
          <input
            type="number"
            min={1}
            max={2000}
            value={state.guestCount}
            onChange={(e) => onChange({ ...state, guestCount: e.target.value })}
            placeholder="e.g. 120"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
          />
        </Field>
        <Field label="Venue budget">
          <select
            value={state.venuebudget}
            onChange={(e) => onChange({ ...state, venuebudget: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
          >
            <option>Under $5k</option>
            <option>$5k–$10k</option>
            <option>$10k–$25k</option>
            <option>$25k–$50k</option>
            <option>$50k–$100k</option>
            <option>$100k+</option>
          </select>
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="bg-pink-600 hover:bg-pink-700 text-white font-medium px-6 py-2.5 rounded-lg disabled:bg-pink-300"
        >
          Continue → Pick venues
        </button>
      </div>
    </div>
  );
}

function Step2({
  candidates,
  allCount,
  selectedIds,
  cityOptions,
  filterCity,
  setFilterCity,
  filterType,
  setFilterType,
  toggle,
  onBack,
  onContinue,
  canContinue,
}: {
  candidates: VenueCandidate[];
  allCount: number;
  selectedIds: string[];
  cityOptions: string[];
  filterCity: string;
  setFilterCity: (s: string) => void;
  filterType: string;
  setFilterType: (s: string) => void;
  toggle: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Pick up to 5 venues</h2>
        <span className="text-sm text-gray-500">
          Selected: <strong>{selectedIds.length}/5</strong>
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All cities</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm capitalize"
        >
          <option value="">All types</option>
          {VENUE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 self-center">
          Showing {candidates.length} of {allCount} (capacity-filtered)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
        {candidates.map((c) => {
          const checked = selectedIds.includes(c.id);
          return (
            <label
              key={c.id}
              className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition ${
                checked ? 'border-pink-600 ring-2 ring-pink-200' : 'border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(c.id)}
                className="absolute top-3 right-3 w-5 h-5"
              />
              {c.primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.primaryImage}
                  alt={c.name}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                  No photo
                </div>
              )}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{c.name}</h3>
                <p className="text-xs text-gray-500 mb-1">{c.city}</p>
                <p className="text-xs text-gray-600">
                  Capacity: {c.capacityMin}-{c.capacityMax} ·{' '}
                  <span className="capitalize">{c.venueType}</span>
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-medium">
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="bg-pink-600 hover:bg-pink-700 text-white font-medium px-6 py-2.5 rounded-lg disabled:bg-pink-300"
        >
          Continue → Send to {selectedIds.length} {selectedIds.length === 1 ? 'venue' : 'venues'}
        </button>
      </div>
    </div>
  );
}

function Step3({
  state,
  onChange,
  selectedVenues,
  onBack,
  onSubmit,
  canSubmit,
  submitting,
  submitError,
}: {
  state: Step3State;
  onChange: (next: Step3State) => void;
  selectedVenues: VenueCandidate[];
  onBack: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  submitting: boolean;
  submitError: string | null;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-gray-900">Almost there</h2>

      <div className="bg-pink-50 rounded-lg p-4 mb-4">
        <p className="text-pink-900 font-medium mb-2">
          Sending your inquiry to {selectedVenues.length} venues:
        </p>
        <ul className="text-pink-800 text-sm space-y-1">
          {selectedVenues.map((v) => (
            <li key={v.id}>• {v.name} ({v.city})</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Full name">
          <input
            type="text"
            value={state.fullName}
            onChange={(e) => onChange({ ...state, fullName: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
            required
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={state.email}
            onChange={(e) => onChange({ ...state, email: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
            required
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            type="tel"
            value={state.phone}
            onChange={(e) => onChange({ ...state, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
          />
        </Field>
      </div>

      <Field label="Message to all venues">
        <textarea
          value={state.message}
          onChange={(e) => onChange({ ...state, message: e.target.value })}
          rows={5}
          minLength={10}
          maxLength={4000}
          placeholder="Share your wedding vision, key dates, must-haves..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500"
        />
      </Field>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {submitError}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-medium">
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="bg-pink-600 hover:bg-pink-700 text-white font-medium px-6 py-2.5 rounded-lg disabled:bg-pink-300"
        >
          {submitting ? 'Sending...' : `Send to ${selectedVenues.length} venues`}
        </button>
      </div>
    </div>
  );
}

function SuccessPanel({
  venues,
  onReset,
}: {
  venues: VenueCandidate[];
  onReset: () => void;
}) {
  return (
    <div className="text-center py-10 space-y-5">
      <div className="text-6xl">🎉</div>
      <h2 className="text-3xl font-bold text-gray-900">Quotes requested!</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Thanks! Your inquiry is on its way to {venues.length}{' '}
        {venues.length === 1 ? 'venue' : 'venues'}. They&apos;ll respond directly within
        24 business hours, and you&apos;ll see follow-ups in the email you provided.
      </p>
      {venues.length > 0 && (
        <div className="bg-pink-50 rounded-lg p-4 max-w-md mx-auto text-left">
          <h3 className="font-semibold text-pink-900 mb-2">Your inquiry was sent to</h3>
          <ul className="text-sm text-pink-800 space-y-1">
            {venues.map((v) => (
              <li key={v.id}>• {v.name} ({v.city})</li>
            ))}
          </ul>
        </div>
      )}
      <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto text-left">
        <h3 className="font-semibold text-blue-900 mb-2">What happens next</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each venue receives your full inquiry</li>
          <li>• You&apos;ll get one confirmation email summarizing them all</li>
          <li>• Replies come directly to your inbox</li>
        </ul>
      </div>
      <button
        onClick={onReset}
        className="bg-pink-600 hover:bg-pink-700 text-white font-medium px-6 py-2.5 rounded-lg"
      >
        Browse more venues
      </button>
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
      <span className="text-sm font-medium text-gray-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
