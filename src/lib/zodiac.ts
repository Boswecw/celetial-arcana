/**
 * Zodiac data + date-to-sun-sign helpers, shared between the reading and
 * alignment pages.
 */

export type ZodiacElement = 'Fire' | 'Earth' | 'Air' | 'Water';

export interface ZodiacEntry {
  name: string;
  start: { month: number; day: number };
  end: { month: number; day: number };
  element: ZodiacElement;
}

export const zodiacData: readonly ZodiacEntry[] = [
  { name: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 }, element: 'Earth' },
  { name: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 }, element: 'Air' },
  { name: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 }, element: 'Water' },
  { name: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 }, element: 'Fire' },
  { name: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 }, element: 'Earth' },
  { name: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 }, element: 'Air' },
  { name: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 }, element: 'Water' },
  { name: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 }, element: 'Fire' },
  { name: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 }, element: 'Earth' },
  { name: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 }, element: 'Air' },
  { name: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 }, element: 'Water' },
  { name: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 }, element: 'Fire' },
];

export const zodiacSigns: readonly string[] = zodiacData.map((z) => z.name);

// Astronomical order, starting at 0° Aries. Use this for ecliptic-longitude
// based lookups (Aries 0°, Taurus 30°, …). `zodiacData` above is ordered by
// calendar date ranges starting in December and is NOT interchangeable.
export const zodiacSignsByLongitude: readonly string[] = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const ZODIAC_EMOJIS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

export function zodiacEmoji(sign: string): string {
  return ZODIAC_EMOJIS[sign] || '♈';
}

function normalizeLongitude(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function signForLongitude(longitude: number): string {
  const normalized = normalizeLongitude(longitude);
  return zodiacSignsByLongitude[Math.floor(normalized / 30) % 12];
}

export function degreeWithinSign(longitude: number): number {
  return Math.floor(normalizeLongitude(longitude) % 30);
}

function isWithinRange(
  month: number,
  day: number,
  start: { month: number; day: number },
  end: { month: number; day: number }
): boolean {
  if (start.month === end.month && start.day === end.day) {
    return month === start.month && day === start.day;
  }

  if (start.month < end.month || (start.month === end.month && start.day <= end.day)) {
    if (month < start.month || month > end.month) return false;
    if (month === start.month && day < start.day) return false;
    if (month === end.month && day > end.day) return false;
    return true;
  }

  // Range wraps across year end (e.g. Capricorn: Dec 22 -> Jan 19).
  if (month > start.month || month < end.month) return true;
  if (month === start.month && day >= start.day) return true;
  if (month === end.month && day <= end.day) return true;
  return false;
}

export function deriveSunSign(month: number | null, day: number | null): ZodiacEntry | null {
  if (!month || !day) return null;
  for (const entry of zodiacData) {
    if (isWithinRange(month, day, entry.start, entry.end)) {
      return entry;
    }
  }
  return null;
}

export function formatAscendant(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Capricorn 12°';
  }
  const normalized = normalizeLongitude(value);
  const sign = zodiacSignsByLongitude[Math.floor(normalized / 30) % 12];
  const within = normalized % 30;
  const degrees = Math.floor(within);
  const minutes = Math.floor((within - degrees) * 60);
  return `${sign} ${degrees}°${String(minutes).padStart(2, '0')}`;
}

/**
 * Number of days in a given month, accounting for leap years.
 */
export function daysInMonth(month: number, year: number): number {
  if (!Number.isFinite(month) || month < 1 || month > 12) return 31;
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}
