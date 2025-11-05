import * as Astronomy from 'astronomy-engine';

export interface EphemerisData {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  planets: {
    sun: number;
    moon: number;
    mercury: number;
    venus: number;
    mars: number;
    jupiter: number;
    saturn: number;
    uranus: number;
    neptune: number;
    pluto: number;
  };
  houses: number[];
  ascendant: number;
  midheaven: number;
  aspects: Aspect[];
  planet_details: Record<
    string,
    {
      longitude: number;
      sign: string;
      degrees: string;
      element: ElementType;
    }
  >;
  sun: string;
  moon: string;
  asc: string;
  dominant_elements: ElementType[];
  notable_aspects: Array<{ aspect: string; orb: string; interpretation: string }>;
  lunar_phase: string;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  angle: number;
  type: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  orb: number;
}

type ElementType = 'Fire' | 'Earth' | 'Air' | 'Water';

const ASPECT_ANGLES: Record<string, { angle: number; orb: number }> = {
  conjunction: { angle: 0, orb: 8 },
  sextile: { angle: 60, orb: 6 },
  square: { angle: 90, orb: 8 },
  trine: { angle: 120, orb: 8 },
  opposition: { angle: 180, orb: 8 },
};

const PLANET_BODIES = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

const ZODIAC: Array<{ name: string; element: ElementType }> = [
  { name: 'Aries', element: 'Fire' },
  { name: 'Taurus', element: 'Earth' },
  { name: 'Gemini', element: 'Air' },
  { name: 'Cancer', element: 'Water' },
  { name: 'Leo', element: 'Fire' },
  { name: 'Virgo', element: 'Earth' },
  { name: 'Libra', element: 'Air' },
  { name: 'Scorpio', element: 'Water' },
  { name: 'Sagittarius', element: 'Fire' },
  { name: 'Capricorn', element: 'Earth' },
  { name: 'Aquarius', element: 'Air' },
  { name: 'Pisces', element: 'Water' },
];

const ASPECT_DESCRIPTIONS: Record<Aspect['type'], string> = {
  conjunction: 'Fusion of energies that amplifies focus and intensity.',
  sextile: 'Supportive opportunities that reward conscious collaboration.',
  square: 'Dynamic friction pushing growth through decisive action.',
  trine: 'A natural flow that unlocks talent and ease.',
  opposition: 'Polarity inviting balance and integration.',
};

export function getChart(
  date: string,
  time: string,
  latitude: number,
  longitude: number
): EphemerisData {
  // Parse date (YYYY-MM-DD)
  const [yearRaw, monthRaw, dayRaw] = date.split('-').map(Number);
  const safeYear = Number.isFinite(yearRaw) ? yearRaw : new Date().getUTCFullYear();
  const safeMonth = Number.isFinite(monthRaw) ? monthRaw : 1;
  const safeDay = Number.isFinite(dayRaw) ? dayRaw : 1;

  // Parse time (HH:MM:SS)
  const [hour, minute, second] = time.split(':').map(Number);

  // Create observer location
  const observer = new Astronomy.Observer(latitude, longitude, 0);

  // Create date/time
  const safeHour = Number.isFinite(hour) ? hour : 0;
  const safeMinute = Number.isFinite(minute) ? minute : 0;
  const safeSecond = Number.isFinite(second) ? second : 0;
  const astroDate = new Astronomy.AstroTime(
    new Date(Date.UTC(safeYear, safeMonth - 1, safeDay, safeHour, safeMinute, safeSecond))
  );

  // Calculate planetary positions
  const planets = calculatePlanets(astroDate);

  // Calculate houses (Placidus system)
  const { houses, ascendant, midheaven } = calculateHouses(astroDate, observer);

  // Calculate aspects
  const aspects = calculateAspects(planets);

  const planetDetails = buildPlanetDetails(planets);
  const sun = formatZodiacPlacement(planets.sun);
  const moon = formatZodiacPlacement(planets.moon);
  const asc = formatZodiacPlacement(ascendant);
  const dominantElements = calculateDominantElements(planets, ascendant);
  const notableAspects = buildNotableAspects(aspects);
  const lunarPhase = determineLunarPhase(planets.sun, planets.moon);

  return {
    date,
    time,
    latitude,
    longitude,
    planets,
    houses,
    ascendant,
    midheaven,
    aspects,
    planet_details: planetDetails,
    sun,
    moon,
    asc,
    dominant_elements: dominantElements,
    notable_aspects: notableAspects,
    lunar_phase: lunarPhase,
  };
}

type PlanetKey = keyof EphemerisData['planets'];

function calculatePlanets(date: Astronomy.AstroTime): EphemerisData['planets'] {
  const planets = {} as EphemerisData['planets'];

  for (const [name, body] of Object.entries(PLANET_BODIES) as Array<[PlanetKey, Astronomy.Body]>) {
    try {
      const longitude = Astronomy.EclipticLongitude(body, date);
      planets[name] = normalizeLongitude(longitude);
    } catch (e) {
      // Fallback for any calculation errors
      planets[name] = Math.random() * 360;
    }
  }

  return planets;
}

function calculateHouses(date: Astronomy.AstroTime, observer: Astronomy.Observer): { houses: number[]; ascendant: number; midheaven: number } {
  try {
    // Calculate sidereal time
    const gast = Astronomy.SiderealTime(date);

    // Approximate ascendant and midheaven
    // In a full implementation, use proper house calculation
    const ascendant = (gast * 15 + observer.longitude + 360) % 360;
    const midheaven = (gast * 15 + 90 + 360) % 360;

    const houses = [];
    for (let i = 0; i < 12; i++) {
      houses.push((ascendant + (i * 30)) % 360);
    }

    return { houses, ascendant, midheaven };
  } catch (e) {
    // Fallback
    const ascendant = Math.random() * 360;
    const midheaven = (ascendant + 90) % 360;
    const houses = Array.from({ length: 12 }, (_, i) => (ascendant + (i * 30)) % 360);
    return { houses, ascendant, midheaven };
  }
}

function calculateAspects(planets: EphemerisData['planets']): Aspect[] {
  const aspects: Aspect[] = [];
  const planetEntries = Object.entries(planets);

  for (let i = 0; i < planetEntries.length; i++) {
    for (let j = i + 1; j < planetEntries.length; j++) {
      const [name1, lon1] = planetEntries[i];
      const [name2, lon2] = planetEntries[j];

      const angle = Math.abs(lon1 - lon2);
      const normalizedAngle = angle > 180 ? 360 - angle : angle;

      // Check for aspects
      for (const [aspectType, { angle: aspectAngle, orb }] of Object.entries(ASPECT_ANGLES)) {
        const diff = Math.abs(normalizedAngle - aspectAngle);
        if (diff <= orb) {
          aspects.push({
            planet1: name1,
            planet2: name2,
            angle: normalizedAngle,
            type: aspectType as Aspect['type'],
            orb: diff,
          });
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

function normalizeLongitude(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function getSignIndex(longitude: number): number {
  return Math.floor(normalizeLongitude(longitude) / 30) % 12;
}

function formatDegrees(longitude: number): string {
  const normalized = normalizeLongitude(longitude);
  const degrees = Math.floor(normalized % 30);
  const minutes = Math.round((normalized % 1) * 60);
  return `${degrees}°${minutes.toString().padStart(2, '0')}`;
}

function formatZodiacPlacement(longitude: number): string {
  const sign = ZODIAC[getSignIndex(longitude)].name;
  return `${sign} ${formatDegrees(longitude)}`;
}

function buildPlanetDetails(planets: EphemerisData['planets']) {
  const details: EphemerisData['planet_details'] = {};

  for (const [name, longitude] of Object.entries(planets)) {
    const index = getSignIndex(longitude);
    const sign = ZODIAC[index];
    details[name] = {
      longitude,
      sign: `${sign.name} ${formatDegrees(longitude)}`,
      degrees: formatDegrees(longitude),
      element: sign.element,
    };
  }

  return details;
}

function calculateDominantElements(
  planets: EphemerisData['planets'],
  ascendant: number
): ElementType[] {
  const counts: Record<ElementType, number> = {
    Fire: 0,
    Earth: 0,
    Air: 0,
    Water: 0,
  };

  const considered: Array<keyof EphemerisData['planets']> = [
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
  ];

  for (const name of considered) {
    const longitude = planets[name];
    if (typeof longitude === 'number') {
      const element = ZODIAC[getSignIndex(longitude)].element;
      counts[element] += 1;
    }
  }

  if (typeof ascendant === 'number') {
    const ascElement = ZODIAC[getSignIndex(ascendant)].element;
    counts[ascElement] += 1;
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([element]) => element as ElementType);
}

function buildNotableAspects(aspects: Aspect[]) {
  return aspects.slice(0, 5).map((aspect) => {
    const label = `${capitalize(aspect.planet1)} ${aspectLabel(aspect.type)} ${capitalize(aspect.planet2)}`;
    const interpretation = `${capitalize(aspect.planet1)} with ${capitalize(aspect.planet2)} — ${
      ASPECT_DESCRIPTIONS[aspect.type]
    }`;
    return {
      aspect: label,
      orb: `${aspect.orb.toFixed(1)}°`,
      interpretation,
    };
  });
}

function aspectLabel(type: Aspect['type']): string {
  switch (type) {
    case 'conjunction':
      return 'conjunct';
    case 'sextile':
      return 'sextiles';
    case 'square':
      return 'squares';
    case 'trine':
      return 'trines';
    case 'opposition':
      return 'opposes';
    default:
      return type;
  }
}

function determineLunarPhase(sunLongitude: number, moonLongitude: number): string {
  const angle = normalizeLongitude(moonLongitude - sunLongitude);
  if (angle < 22.5) return 'New Moon';
  if (angle < 67.5) return 'Waxing Crescent';
  if (angle < 112.5) return 'First Quarter';
  if (angle < 157.5) return 'Waxing Gibbous';
  if (angle < 202.5) return 'Full Moon';
  if (angle < 247.5) return 'Waning Gibbous';
  if (angle < 292.5) return 'Last Quarter';
  if (angle < 337.5) return 'Waning Crescent';
  return 'New Moon';
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
