import type { EphemerisData, Aspect } from './ephemeris';
import { celestiaArcanaCards } from './decks/celestia-arcana';
import { getMeaning } from './decks/tarot-meanings-map';

export interface ReadingAnalysis {
  cards: CardInterpretation[];
  aspects: AspectInterpretation[];
  houses: HouseInterpretation[];
  weights: {
    planetary: Record<string, number>;
    aspectal: number;
    cardinal: number;
  };
  interpretations: string[];
  themes: string[];
}

export interface CardInterpretation {
  name: string;
  position: string;
  reversed: boolean;
  meaning: string;
  weight: number;
}

export interface AspectInterpretation {
  planet1: string;
  planet2: string;
  type: string;
  meaning: string;
  weight: number;
}

export interface HouseInterpretation {
  house: number;
  planet?: string;
  meaning: string;
  weight: number;
}

const ASPECT_MEANINGS: Record<string, Record<string, string>> = {
  conjunction: {
    sun_moon: 'New Moon energy - integration of conscious and unconscious',
    sun_mercury: 'Clear communication and mental clarity',
    venus_mars: 'Passionate attraction and creative drive',
    jupiter_saturn: 'Balance between expansion and limitation',
  },
  sextile: {
    default: 'Harmonious flow and opportunity',
  },
  square: {
    default: 'Tension creating growth and challenge',
  },
  trine: {
    default: 'Natural talent and ease of expression',
  },
  opposition: {
    default: 'Polarity and need for integration',
  },
};

const HOUSE_MEANINGS: Record<number, string> = {
  1: 'Self, identity, and appearance',
  2: 'Values, resources, and possessions',
  3: 'Communication, siblings, and short journeys',
  4: 'Home, family, and foundations',
  5: 'Creativity, romance, and self-expression',
  6: 'Work, health, and daily routines',
  7: 'Partnerships, marriage, and open enemies',
  8: 'Transformation, shared resources, and intimacy',
  9: 'Philosophy, higher learning, and long journeys',
  10: 'Career, public image, and authority',
  11: 'Friendships, groups, and hopes',
  12: 'Spirituality, hidden matters, and closure',
};

export function analyzeReading(
  ephemeris: Partial<EphemerisData> | null | undefined,
  drawnCards: Array<{ name: string; reversed: boolean; position: string }>
): ReadingAnalysis {
  const safeEphemeris: Partial<EphemerisData> = ephemeris ?? {};
  const cardInterpretations = analyzeCards(drawnCards);
  const aspectInterpretations = analyzeAspects(safeEphemeris.aspects);
  const houseInterpretations = analyzeHouses(safeEphemeris);
  const weights = calculateWeights(safeEphemeris, cardInterpretations, aspectInterpretations);
  const themes = extractThemes(cardInterpretations, aspectInterpretations);
  const interpretations = generateInterpretations(
    cardInterpretations,
    aspectInterpretations,
    themes
  );

  return {
    cards: cardInterpretations,
    aspects: aspectInterpretations,
    houses: houseInterpretations,
    weights,
    interpretations,
    themes,
  };
}

function analyzeCards(drawnCards: Array<{ name: string; reversed: boolean; position: string }>): CardInterpretation[] {
  return drawnCards.map((card) => {
    // Try the enriched JSON meanings first; fall back to the in-deck strings.
    let meaning = getMeaning(card.name, card.reversed);

    if (!meaning) {
      const deckCard = celestiaArcanaCards.find((c) => c.name === card.name);
      meaning = card.reversed ? deckCard?.reversed || '' : deckCard?.upright || '';
    }

    return {
      name: card.name,
      position: card.position,
      reversed: card.reversed,
      meaning,
      weight: card.reversed ? 0.8 : 1.0,
    };
  });
}

function analyzeAspects(aspects: Aspect[] | undefined): AspectInterpretation[] {
  if (!aspects || aspects.length === 0) {
    return [];
  }

  return aspects.slice(0, 5).map((aspect) => {
    const key = `${aspect.planet1}_${aspect.planet2}`;
    const meaning =
      ASPECT_MEANINGS[aspect.type]?.[key] ||
      ASPECT_MEANINGS[aspect.type]?.default ||
      `${aspect.type} between ${aspect.planet1} and ${aspect.planet2}`;

    const weight = 1 - aspect.orb / 8; // Tighter orb = higher weight

    return {
      planet1: aspect.planet1,
      planet2: aspect.planet2,
      type: aspect.type,
      meaning,
      weight: Math.max(0.3, weight),
    };
  });
}

function analyzeHouses(ephemeris: Partial<EphemerisData> | null | undefined): HouseInterpretation[] {
  const interpretations: HouseInterpretation[] = [];

  if (ephemeris?.houses && ephemeris.houses.length > 0) {
    ephemeris.houses.forEach((_, index) => {
      const houseNumber = index + 1;
      interpretations.push({
        house: houseNumber,
        meaning: HOUSE_MEANINGS[houseNumber] ?? 'Life domains and personal growth',
        weight: 0.5,
      });
    });
    return interpretations;
  }

  for (let i = 1; i <= 12; i++) {
    interpretations.push({
      house: i,
      meaning: HOUSE_MEANINGS[i],
      weight: 0.5,
    });
  }

  return interpretations;
}

// Per-planet salience weights. Inner / luminary bodies are weighted higher
// than the slow outer planets because they're more relevant to short-term
// reflective questions. Adjust as the rules engine grows.
const PLANET_SALIENCE: Record<string, number> = {
  sun: 1.0,
  moon: 1.0,
  mercury: 0.85,
  venus: 0.85,
  mars: 0.85,
  jupiter: 0.7,
  saturn: 0.7,
  uranus: 0.5,
  neptune: 0.5,
  pluto: 0.5,
};

function calculateWeights(
  ephemeris: Partial<EphemerisData> | null | undefined,
  cards: CardInterpretation[],
  aspects: AspectInterpretation[]
): ReadingAnalysis['weights'] {
  const planetary: Record<string, number> = {};
  let planets = ephemeris?.planets ? Object.keys(ephemeris.planets) : [];

  if (planets.length === 0) {
    planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
  }

  planets.forEach((planet) => {
    planetary[planet] = PLANET_SALIENCE[planet] ?? 0.5;
  });

  const aspectalWeight =
    aspects.length > 0 ? aspects.reduce((sum, a) => sum + a.weight, 0) / aspects.length : 0.5;
  const cardinalWeight =
    cards.length > 0 ? cards.reduce((sum, c) => sum + c.weight, 0) / cards.length : 0.5;

  return {
    planetary,
    aspectal: aspectalWeight,
    cardinal: cardinalWeight,
  };
}

// Each Major Arcana card maps to one or more reading themes. Substring
// matching keeps the table simple and covers custom-suit name variants
// ("The Fool", "Lovers", etc.) so spreads from any deck produce themes.
const MAJOR_THEMES: Array<{ match: RegExp; themes: string[] }> = [
  { match: /\bFool\b/i, themes: ['new beginnings', 'leap of faith'] },
  { match: /\bMagician\b/i, themes: ['new beginnings', 'manifestation'] },
  { match: /\bHigh Priestess\b/i, themes: ['intuition', 'inner knowing'] },
  { match: /\bEmpress\b/i, themes: ['abundance', 'nurture'] },
  { match: /\bEmperor\b/i, themes: ['structure', 'authority'] },
  { match: /\bHierophant\b/i, themes: ['tradition', 'guidance'] },
  { match: /\bLovers\b/i, themes: ['relationships', 'choice'] },
  { match: /\bChariot\b/i, themes: ['determination', 'momentum'] },
  { match: /\bStrength\b/i, themes: ['courage', 'inner strength'] },
  { match: /\bHermit\b/i, themes: ['introspection', 'solitude'] },
  { match: /Wheel of Fortune/i, themes: ['change', 'cycles'] },
  { match: /\bJustice\b/i, themes: ['fairness', 'accountability'] },
  { match: /Hanged Man/i, themes: ['surrender', 'new perspective'] },
  { match: /\bDeath\b/i, themes: ['transformation', 'endings'] },
  { match: /\bTemperance\b/i, themes: ['balance', 'integration'] },
  { match: /\bDevil\b/i, themes: ['attachment', 'shadow work'] },
  { match: /\bTower\b/i, themes: ['transformation', 'upheaval'] },
  { match: /\bStar\b/i, themes: ['hope', 'renewal'] },
  { match: /\bMoon\b/i, themes: ['dreams', 'the unconscious'] },
  { match: /\bSun\b/i, themes: ['joy', 'clarity'] },
  { match: /\bJudgement\b/i, themes: ['reckoning', 'awakening'] },
  { match: /\bWorld\b/i, themes: ['completion', 'wholeness'] },
];

// Suit -> elemental theme. Covers the standard names + Celestia Arcana's
// custom suit aliases.
const SUIT_THEMES: Array<{ match: RegExp; theme: string }> = [
  { match: /\b(Wands|Flames|Rods|Staves)\b/i, theme: 'creative drive' },
  { match: /\b(Cups|Tides|Chalices)\b/i, theme: 'emotional currents' },
  { match: /\b(Swords|Winds|Blades)\b/i, theme: 'mental clarity' },
  { match: /\b(Pentacles|Stones|Coins|Discs)\b/i, theme: 'material matters' },
];

function extractThemes(
  cards: CardInterpretation[],
  aspects: AspectInterpretation[]
): string[] {
  const themes: Set<string> = new Set();

  cards.forEach((card) => {
    for (const entry of MAJOR_THEMES) {
      if (entry.match.test(card.name)) {
        entry.themes.forEach((t) => themes.add(t));
      }
    }
    for (const entry of SUIT_THEMES) {
      if (entry.match.test(card.name)) themes.add(entry.theme);
    }
    if (card.reversed) themes.add('reflection');
  });

  aspects.forEach((aspect) => {
    if (aspect.type === 'opposition') themes.add('polarity');
    if (aspect.type === 'conjunction') themes.add('integration');
    if (aspect.type === 'square') themes.add('creative tension');
    if (aspect.type === 'trine') themes.add('flow');
  });

  return Array.from(themes);
}

function generateInterpretations(
  cards: CardInterpretation[],
  aspects: AspectInterpretation[],
  themes: string[]
): string[] {
  const interpretations: string[] = [];

  interpretations.push(`Primary themes: ${themes.join(', ') || 'balance and harmony'}`);

  if (aspects.length > 0) {
    interpretations.push(`Key aspect: ${aspects[0].type} between ${aspects[0].planet1} and ${aspects[0].planet2}`);
  }

  if (cards.length > 0) {
    interpretations.push(`Central card: ${cards[0].name}${cards[0].reversed ? ' (reversed)' : ''}`);
  }

  return interpretations;
}
