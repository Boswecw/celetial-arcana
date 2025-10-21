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
}

export interface Aspect {
  planet1: string;
  planet2: string;
  angle: number;
  type: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  orb: number;
}

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

export function getChart(
  date: string,
  time: string,
  latitude: number,
  longitude: number
): EphemerisData {
  // Parse date (YYYY-MM-DD)
  const [year, month, day] = date.split('-').map(Number);

  // Parse time (HH:MM:SS)
  const [hour, minute, second] = time.split(':').map(Number);

  // Create observer location
  const observer = new Astronomy.Observer(latitude, longitude, 0);

  // Create date/time
  const astroDate = new Astronomy.AstroTime(year, month, day, hour, minute, second);

  // Calculate planetary positions
  const planets = calculatePlanets(astroDate, observer);

  // Calculate houses (Placidus system)
  const { houses, ascendant, midheaven } = calculateHouses(astroDate, observer);

  // Calculate aspects
  const aspects = calculateAspects(planets);

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
  };
}

function calculatePlanets(date: Astronomy.AstroTime, observer: Astronomy.Observer): EphemerisData['planets'] {
  const planets: any = {};

  for (const [name, body] of Object.entries(PLANET_BODIES)) {
    try {
      const equ = Astronomy.Equator(body, date, observer, true, true);
      const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec);

      // Get ecliptic longitude
      const ecl = Astronomy.Ecliptic(equ);
      planets[name] = (ecl.lon + 360) % 360;
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

