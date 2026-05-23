/**
 * Reading orchestration: turns a set of birth details + drawn cards into a
 * combined astro/tarot reading by coordinating the three API endpoints.
 *
 * Kept separate from the Svelte page so the fetch pipeline can be tested
 * independently and the page component stays focused on UI state.
 */

import { deriveSunSign, formatAscendant, type ZodiacEntry } from './zodiac';
import { sanitizeUserQuestion } from './promptSafety';

export interface DrawnCard {
  card: {
    id: string;
    name: string;
    image?: string;
    element?: string;
    upright: string;
    reversed: string;
  };
  reversed: boolean;
}

export interface BirthDetails {
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  time: string;
  latitude: number;
  longitude: number;
}

export interface FetchReadingArgs {
  question: string;
  spreadPositions: readonly string[];
  drawnCards: DrawnCard[];
  birth: BirthDetails;
  model: string;
}

export interface ReadingResult {
  reading: any;
  userZodiac: string;
}

function formatDate({ birthYear, birthMonth, birthDay }: BirthDetails): string {
  return `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
}

function sunSignFromBirth(birth: BirthDetails): ZodiacEntry | null {
  return deriveSunSign(parseInt(birth.birthMonth, 10) || null, parseInt(birth.birthDay, 10) || null);
}

export async function fetchCelestialReading(args: FetchReadingArgs): Promise<ReadingResult> {
  const { spreadPositions, drawnCards, birth, model } = args;
  // Cap + clean the user's question up front so every downstream prompt sees
  // the same sanitized text.
  const question = sanitizeUserQuestion(args.question);
  const derivedSun = sunSignFromBirth(birth);
  const fallbackSun = derivedSun ? `${derivedSun.name} 0°` : 'Pisces 0°';
  const fallbackElement = derivedSun ? [derivedSun.element] : [];

  const formattedDate = formatDate(birth);
  const formattedTime = birth.time.replace(':', '%3A');

  // Fire ephemeris + traditional reading in parallel — traditional doesn't
  // need ephemeris data, and astro-tarot only needs the ephemeris results.
  const ephemerisPromise = fetch(
    `/api/ephemeris?date=${formattedDate}&time=${formattedTime}&lat=${birth.latitude}&lon=${birth.longitude}`
  ).then((res) => res.json());

  const spreadData = drawnCards.map((d, i) => ({
    position: spreadPositions[i],
    card: d.card.name,
    orientation: d.reversed ? 'reversed' : 'upright',
    element: d.card.element || '',
  }));

  const traditionalReadingPromise = fetch('/api/reading', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      draw: drawnCards.map((d, i) => ({
        position: spreadPositions[i],
        reversed: d.reversed,
        card: d.card,
      })),
      ephemeris: null,
    }),
  });

  const ephemeris = await ephemerisPromise;
  const astroData = {
    sun: ephemeris.sun || ephemeris.planet_details?.sun?.sign || fallbackSun,
    moon: ephemeris.moon || ephemeris.planet_details?.moon?.sign || 'Taurus 5°',
    asc: ephemeris.asc || formatAscendant(ephemeris.ascendant),
    dominant_elements: ephemeris.dominant_elements || fallbackElement,
    notable_aspects: ephemeris.notable_aspects || [],
    lunar_phase: ephemeris.lunar_phase || 'Waxing Crescent',
  };
  const userZodiac = astroData.sun?.split(' ')[0] || derivedSun?.name || '';

  const safeQuestion = question || 'What guidance does the universe have for me?';

  const astroTarotRes = await fetch('/api/astro-tarot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: safeQuestion,
      timeframe: 'next 30 days',
      astro: astroData,
      spread: spreadData,
      model,
      temperature: 0.2,
      num_predict: 1500,
    }),
  });

  if (!astroTarotRes.ok) {
    const errorData = await astroTarotRes.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to generate Astro-Tarot reading');
  }

  const astroTarotReading = await astroTarotRes.json();

  // If the model invented a different Sun sign than the user's actual birth
  // chart, fix it so downstream UI/narration stays grounded in their data.
  if (derivedSun) {
    const expectedSun = derivedSun.name.toLowerCase();
    const currentSun = astroTarotReading?.astro_summary?.core?.sun || '';
    if (!currentSun.toLowerCase().startsWith(expectedSun)) {
      const remainder = currentSun.includes(' ')
        ? currentSun.slice(currentSun.indexOf(' ') + 1)
        : '0°';
      const updatedCore = {
        ...(astroTarotReading?.astro_summary?.core ?? {}),
        sun: `${derivedSun.name} ${remainder}`.trim(),
      };
      if (!updatedCore.dominant_elements || updatedCore.dominant_elements.length === 0) {
        updatedCore.dominant_elements = [derivedSun.element];
      }
      astroTarotReading.astro_summary = {
        ...(astroTarotReading?.astro_summary ?? {}),
        core: updatedCore,
      };
    }
  }

  const readingRes = await traditionalReadingPromise;
  const traditionalReading = await readingRes.json();

  const combinedRes = await fetch('/api/combined-reading', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: safeQuestion,
      traditionalReading: traditionalReading.reading,
      astroTarotSynthesis: astroTarotReading,
      cards: drawnCards.map((d, i) => ({
        name: d.card.name,
        position: spreadPositions[i],
        reversed: d.reversed,
      })),
    }),
  });

  const combinedReadingData = await combinedRes.json();

  return {
    reading: {
      ...traditionalReading,
      astroTarot: astroTarotReading,
      combinedReading: combinedReadingData.reading,
    },
    userZodiac,
  };
}
