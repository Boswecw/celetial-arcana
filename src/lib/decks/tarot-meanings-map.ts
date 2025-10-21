/**
 * Tarot Meanings Map
 * Maps card names to their detailed meanings from tarot_meanings.json
 * Provides richer, more nuanced interpretations for readings
 */

export interface TarotMeaning {
  name: string;
  suit: string;
  upright: string;
  reversed: string;
}

// Import the meanings data
import tarotMeaningsData from '../components/tarot_meanings.json';

// Create a map for quick lookup by card name
const meaningsByName = new Map<string, TarotMeaning>();

// Normalize card names for matching (handle suit variations)
const suitMappings: Record<string, string[]> = {
  'Wands': ['Wands', 'Flames', 'Rods', 'Staves'],
  'Cups': ['Cups', 'Tides', 'Chalices'],
  'Swords': ['Swords', 'Winds', 'Blades'],
  'Pentacles': ['Pentacles', 'Stones', 'Coins', 'Discs'],
};

// Build the map
tarotMeaningsData.forEach((meaning: TarotMeaning) => {
  meaningsByName.set(meaning.name, meaning);
  
  // Also add normalized versions for different suit names
  for (const [standardSuit, aliases] of Object.entries(suitMappings)) {
    for (const alias of aliases) {
      if (meaning.suit === standardSuit || meaning.suit === alias) {
        // Create alternative names with different suit names
        for (const altSuit of aliases) {
          if (altSuit !== meaning.suit) {
            const altName = meaning.name.replace(meaning.suit, altSuit);
            if (altName !== meaning.name) {
              meaningsByName.set(altName, meaning);
            }
          }
        }
      }
    }
  }
});

/**
 * Get detailed meaning for a card
 * @param cardName - The name of the card
 * @returns The detailed meaning object or undefined if not found
 */
export function getCardMeaning(cardName: string): TarotMeaning | undefined {
  return meaningsByName.get(cardName);
}

/**
 * Get upright meaning for a card
 * @param cardName - The name of the card
 * @returns The upright meaning string
 */
export function getUprightMeaning(cardName: string): string {
  const meaning = meaningsByName.get(cardName);
  return meaning?.upright || '';
}

/**
 * Get reversed meaning for a card
 * @param cardName - The name of the card
 * @returns The reversed meaning string
 */
export function getReversedMeaning(cardName: string): string {
  const meaning = meaningsByName.get(cardName);
  return meaning?.reversed || '';
}

/**
 * Get the appropriate meaning based on card orientation
 * @param cardName - The name of the card
 * @param reversed - Whether the card is reversed
 * @returns The appropriate meaning string
 */
export function getMeaning(cardName: string, reversed: boolean = false): string {
  if (reversed) {
    return getReversedMeaning(cardName);
  }
  return getUprightMeaning(cardName);
}

/**
 * Get all meanings for a card (both upright and reversed)
 * @param cardName - The name of the card
 * @returns Object with upright and reversed meanings
 */
export function getFullMeaning(cardName: string): { upright: string; reversed: string } {
  const meaning = meaningsByName.get(cardName);
  return {
    upright: meaning?.upright || '',
    reversed: meaning?.reversed || '',
  };
}

/**
 * Get all available card meanings
 * @returns Array of all tarot meanings
 */
export function getAllMeanings(): TarotMeaning[] {
  return tarotMeaningsData;
}

/**
 * Get meanings by suit
 * @param suit - The suit name (e.g., 'Major Arcana', 'Flames', 'Tides', 'Stones', 'Winds')
 * @returns Array of meanings for that suit
 */
export function getMeaningsBySuit(suit: string): TarotMeaning[] {
  return tarotMeaningsData.filter((m) => m.suit === suit);
}

/**
 * Search for meanings by keyword
 * @param keyword - The keyword to search for
 * @returns Array of meanings containing the keyword
 */
export function searchMeanings(keyword: string): TarotMeaning[] {
  const lowerKeyword = keyword.toLowerCase();
  return tarotMeaningsData.filter(
    (m) =>
      m.name.toLowerCase().includes(lowerKeyword) ||
      m.upright.toLowerCase().includes(lowerKeyword) ||
      m.reversed.toLowerCase().includes(lowerKeyword)
  );
}

export default {
  getCardMeaning,
  getUprightMeaning,
  getReversedMeaning,
  getMeaning,
  getFullMeaning,
  getAllMeanings,
  getMeaningsBySuit,
  searchMeanings,
};

