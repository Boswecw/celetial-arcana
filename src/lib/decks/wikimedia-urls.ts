/**
 * Wikimedia Commons URLs for Rider-Waite-Smith Tarot Deck
 * All images are public domain
 * Source: https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck
 */

// Major Arcana direct URLs
const majorArcanaUrls: Record<number, string> = {
  0: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
  1: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
  2: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/RWS_Tarot_02_High_Priestess.jpg',
  3: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/RWS_Tarot_03_Empress.jpg',
  4: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg',
  5: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg',
  6: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/RWS_Tarot_06_Lovers.jpg',
  7: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_07_Chariot.jpg',
  8: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/RWS_Tarot_08_Strength.jpg',
  9: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/RWS_Tarot_09_Hermit.jpg',
  10: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/RWS_Tarot_10_Wheel_of_Fortune.jpg',
  11: 'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_11_Justice.jpg',
  12: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/RWS_Tarot_12_Hanged_Man.jpg',
  13: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/RWS_Tarot_13_Death.jpg',
  14: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/RWS_Tarot_14_Temperance.jpg',
  15: 'https://upload.wikimedia.org/wikipedia/commons/8/a0/RWS_Tarot_15_Devil.jpg',
  16: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/RWS_Tarot_16_Tower.jpg',
  17: 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg',
  18: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/RWS_Tarot_18_Moon.jpg',
  19: 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
  20: 'https://upload.wikimedia.org/wikipedia/commons/2/27/RWS_Tarot_20_Judgement.jpg',
  21: 'https://upload.wikimedia.org/wikipedia/commons/8/83/RWS_Tarot_21_World.jpg',
};

// Minor Arcana direct URLs
const minorArcanaUrls: Record<string, string> = {
  // Wands
  'Wands01': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Wands01.jpg',
  'Wands02': 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Wands02.jpg',
  'Wands03': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Wands03.jpg',
  'Wands04': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Wands04.jpg',
  'Wands05': 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Wands05.jpg',
  'Wands06': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Wands06.jpg',
  'Wands07': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Wands07.jpg',
  'Wands08': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Wands08.jpg',
  'Wands09': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Wands09.jpg',
  'Wands10': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Wands10.jpg',
  'Wands11': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Wands11.jpg',
  'Wands12': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Wands12.jpg',
  'Wands13': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Wands13.jpg',
  'Wands14': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Wands14.jpg',
  // Cups
  'Cups01': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Cups01.jpg',
  'Cups02': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Cups02.jpg',
  'Cups03': 'https://upload.wikimedia.org/wikipedia/commons/3/36/Cups03.jpg',
  'Cups04': 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Cups04.jpg',
  'Cups05': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Cups05.jpg',
  'Cups06': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Cups06.jpg',
  'Cups07': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Cups07.jpg',
  'Cups08': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Cups08.jpg',
  'Cups09': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Cups09.jpg',
  'Cups10': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Cups10.jpg',
  'Cups11': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Cups11.jpg',
  'Cups12': 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Cups12.jpg',
  'Cups13': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Cups13.jpg',
  'Cups14': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Cups14.jpg',
  // Swords
  'Swords01': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Swords01.jpg',
  'Swords02': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Swords02.jpg',
  'Swords03': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Swords03.jpg',
  'Swords04': 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Swords04.jpg',
  'Swords05': 'https://upload.wikimedia.org/wikipedia/commons/3/33/Swords05.jpg',
  'Swords06': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Swords06.jpg',
  'Swords07': 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Swords07.jpg',
  'Swords08': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Swords08.jpg',
  'Swords09': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Swords09.jpg',
  'Swords10': 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Swords10.jpg',
  'Swords11': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Swords11.jpg',
  'Swords12': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Swords12.jpg',
  'Swords13': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Swords13.jpg',
  'Swords14': 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Swords14.jpg',
  // Pentacles
  'Pents01': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Pents01.jpg',
  'Pents02': 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Pents02.jpg',
  'Pents03': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Pents03.jpg',
  'Pents04': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Pents04.jpg',
  'Pents05': 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Pents05.jpg',
  'Pents06': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Pents06.jpg',
  'Pents07': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Pents07.jpg',
  'Pents08': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Pents08.jpg',
  'Pents09': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Pents09.jpg',
  'Pents10': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Pents10.jpg',
  'Pents11': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Pents11.jpg',
  'Pents12': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Pents12.jpg',
  'Pents13': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Pents13.jpg',
  'Pents14': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Pents14.jpg',
};

/**
 * Get Wikimedia Commons URL for a card image
 * @param cardId - Card ID (0-77)
 * @returns Full URL to the card image on Wikimedia Commons
 */
export function getCardImageUrl(cardId: string): string {
  const id = parseInt(cardId);

  // Major Arcana (0-21)
  if (id >= 0 && id <= 21) {
    const url = majorArcanaUrls[id];
    if (url) {
      return url;
    }
  }

  // Minor Arcana (22-77)
  const minorIndex = id - 22;
  const suits = ['Wands', 'Cups', 'Swords', 'Pents'];
  const suitIndex = Math.floor(minorIndex / 14);
  const cardIndex = (minorIndex % 14) + 1;

  if (suitIndex < suits.length) {
    const suit = suits[suitIndex];
    const key = `${suit}${String(cardIndex).padStart(2, '0')}`;
    const url = minorArcanaUrls[key];
    if (url) {
      return url;
    }
  }

  // Fallback placeholder
  return 'https://via.placeholder.com/300x500?text=Card+Not+Found';
}

/**
 * Get all card image URLs for the deck
 * @returns Object mapping card IDs to image URLs
 */
export function getAllCardImageUrls(): Record<string, string> {
  const urls: Record<string, string> = {};
  for (let i = 0; i < 78; i++) {
    urls[String(i)] = getCardImageUrl(String(i));
  }
  return urls;
}

