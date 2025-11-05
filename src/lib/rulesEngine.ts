import type { EphemerisData, Aspect } from './ephemeris';
import { riderWaiteDeck } from './decks';
import { getMeaning, getFullMeaning } from './decks/tarot-meanings-map';

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
  const themes = extractThemes(cardInterpretations, aspectInterpretations, houseInterpretations);
  const interpretations = generateInterpretations(
    cardInterpretations,
    aspectInterpretations,
    houseInterpretations,
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
    // Try to get enriched meaning from tarot_meanings.json first
    let meaning = getMeaning(card.name, card.reversed);

    // Fall back to deck meanings if not found
    if (!meaning) {
      const deckCard = riderWaiteDeck.find((c) => c.name === card.name);
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
    planetary[planet] = 0.5 + Math.random() * 0.5;
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

function extractThemes(
  cards: CardInterpretation[],
  aspects: AspectInterpretation[],
  houses: HouseInterpretation[]
): string[] {
  const themes: Set<string> = new Set();

  // Extract themes from card names
  cards.forEach((card) => {
    if (card.name.includes('Love') || card.name.includes('Lovers')) themes.add('relationships');
    if (card.name.includes('Tower') || card.name.includes('Death')) themes.add('transformation');
    if (card.name.includes('Fool') || card.name.includes('Magician')) themes.add('new beginnings');
  });

  // Extract themes from aspects
  aspects.forEach((aspect) => {
    if (aspect.type === 'opposition') themes.add('polarity');
    if (aspect.type === 'conjunction') themes.add('integration');
  });

  return Array.from(themes);
}

function generateInterpretations(
  cards: CardInterpretation[],
  aspects: AspectInterpretation[],
  houses: HouseInterpretation[],
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
