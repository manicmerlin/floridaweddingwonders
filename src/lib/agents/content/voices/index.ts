// Voice registry — every blog-agent voice is a uniform { id, label,
// systemPrompt, structuralBlend, voiceVersion } record. Adding a new voice
// means dropping a file in this directory and adding it to VOICES below;
// the orchestrator (weekly.ts) then picks among them via voice_id from the
// topic queue or the rotation default.

import { columnistVoice } from './columnist';
import { storytellerVoice } from './storyteller';

export type VoiceId = 'columnist' | 'storyteller';
export const ALL_VOICE_IDS: VoiceId[] = ['columnist', 'storyteller'];

export interface VoiceModule {
  id: VoiceId;
  /** Human label used in admin UIs / logs. */
  label: string;
  /** Byline that lands in post frontmatter + the rendered detail page.
   *  Treated as a proper noun — never translated. */
  authorName: string;
  /** Target reader for the voice — drives blog_topic_queue.target_audience
   *  default and any future personalization (e.g. "More for grooms" strip). */
  targetAudience: 'bride' | 'groom';
  /** Tonal lock — fed to the model as the voice charter. */
  systemPrompt: string;
  /** Structural rules that ride alongside the voice charter. Voice-agnostic
   *  by default; per-voice copies live in each module so they can drift. */
  structuralBlend: string;
  /** Bumped when the prompt materially changes — recorded on agent_runs
   *  so historical post quality can be traced back to a specific charter. */
  voiceVersion: string;
}

export const VOICES: Record<VoiceId, VoiceModule> = {
  columnist: columnistVoice,
  storyteller: storytellerVoice,
};

export function getVoice(id: VoiceId): VoiceModule {
  return VOICES[id];
}

export function isVoiceId(value: unknown): value is VoiceId {
  return typeof value === 'string' && (ALL_VOICE_IDS as string[]).includes(value);
}

/**
 * Return the OPPOSITE voice from `previousId`. Used for `voice_id='auto'`
 * topics so the blog naturally alternates between writers when no
 * explicit voice was requested.
 *
 * Falls back to `columnist` (the v3.1 default) when the previous run is
 * unknown — preserves existing behavior for the very first run after
 * voice rotation lands.
 */
export function pickAlternatingVoice(previousId: VoiceId | null | undefined): VoiceId {
  if (previousId === 'columnist') return 'storyteller';
  if (previousId === 'storyteller') return 'columnist';
  return 'columnist';
}
