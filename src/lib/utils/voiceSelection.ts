/**
 * Voice selection utility for speech synthesis
 * Prioritizes older woman voices for tarot readings
 */

export interface VoiceSelectionOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

const OLDER_WOMAN_DESCRIPTORS = [
  'grandma',
  'grandmother',
  'elder',
  'mature',
  'senior',
  'old',
  'aged',
];

const WOMAN_DESCRIPTORS = [
  'female',
  'woman',
  'lady',
  'mom',
  'mother',
];

const QUALITY_DESCRIPTORS = [
  'sage',
  'wise',
  'story',
  'narrator',
  'reader',
];

const MALE_NAMES = [
  'david',
  'mark',
  'james',
  'george',
  'daniel',
  'michael',
  'christopher',
  'guy',
];

function sanitize(value: string): string {
  return value.toLowerCase();
}

function isBritish(voice: SpeechSynthesisVoice): boolean {
  const lang = sanitize(voice.lang || '');
  const name = sanitize(voice.name || '');
  return lang.includes('en-gb') || name.includes('brit') || name.includes('uk');
}

function isMale(voice: SpeechSynthesisVoice): boolean {
  const name = sanitize(voice.name);
  return (
    name.includes('male') ||
    name.includes('man') ||
    name.includes('boy') ||
    MALE_NAMES.some((maleName) => name.includes(maleName))
  );
}

/**
 * Selects the best available voice for tarot reading narration
 * Prioritizes older woman voices in US English
 */
export function selectBestVoice(
  availableVoices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!availableVoices || availableVoices.length === 0) {
    return null;
  }

  const usVoices = availableVoices.filter(
    (voice) =>
      !isBritish(voice) &&
      !isMale(voice) &&
      sanitize(voice.lang || '').includes('en-us')
  );

  const allEnglishVoices = availableVoices.filter(
    (voice) =>
      !isBritish(voice) &&
      !isMale(voice) &&
      sanitize(voice.lang || '').startsWith('en')
  );

  const nonMaleVoices = availableVoices.filter((voice) => !isMale(voice));

  // Try to find voices in priority order:
  // 1. US voices with "older woman" keywords
  // 2. US female voices with quality descriptors
  // 3. US female voices
  // 4. Any English female voice
  // 5. Any non-male voice
  // 6. Fallback to first available
  const selectedVoice =
    usVoices.find((voice) =>
      OLDER_WOMAN_DESCRIPTORS.some((descriptor) =>
        sanitize(voice.name).includes(descriptor)
      )
    ) ||
    usVoices.find((voice) => {
      const name = sanitize(voice.name);
      return (
        WOMAN_DESCRIPTORS.some((d) => name.includes(d)) &&
        QUALITY_DESCRIPTORS.some((d) => name.includes(d))
      );
    }) ||
    usVoices.find((voice) => {
      const name = sanitize(voice.name);
      return WOMAN_DESCRIPTORS.some((d) => name.includes(d));
    }) ||
    usVoices[0] ||
    allEnglishVoices.find((voice) => {
      const name = sanitize(voice.name);
      return WOMAN_DESCRIPTORS.some((d) => name.includes(d));
    }) ||
    allEnglishVoices[0] ||
    nonMaleVoices[0] ||
    availableVoices[0];

  return selectedVoice;
}

/**
 * Creates a configured speech utterance for tarot reading
 */
export function createReadingUtterance(
  text: string,
  voices: SpeechSynthesisVoice[],
  options: VoiceSelectionOptions = {}
): SpeechSynthesisUtterance {
  const {
    rate = 0.85, // Slightly slower, more deliberate
    pitch = 0.65, // Lower pitch for older woman voice
    volume = 0.95,
  } = options;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  const selectedVoice = selectBestVoice(voices);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log('Selected voice:', selectedVoice.name, selectedVoice.lang);
  }

  return utterance;
}
