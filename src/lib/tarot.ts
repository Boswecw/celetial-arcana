export type Card = {
  id: string;
  name: string;
  upright: string;
  reversed: string;
  image?: string;
  element?: string;
  suit?: string;
};

export type Draw = {
  id: string;
  card: Card;
  reversed: boolean;
  position: string;
};

/**
 * Generates a seeded pseudo-random number generator based on celestial coordinates and timestamp
 * @param longitudes - Array of longitude values for celestial bodies
 * @param ts - Timestamp in milliseconds
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @returns A function that generates random numbers between 0 and 1
 */
export function fateSeed(
  longitudes: number[],
  ts: number,
  lat: number,
  lon: number
) {
  const base =
    longitudes.reduce((a, b) => a + Math.sin(b), 0) + ts / 1000 + lat + lon;
  let s = Math.abs(Math.sin(base)) * 1e9;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280; // 0..1
}

/**
 * Draws a tarot spread from a deck of cards
 * @param deck - Array of cards to draw from
 * @param positions - Array of position names for the spread
 * @param rng - Random number generator function
 * @returns Array of drawn cards with positions and reversals
 */
export function drawSpread(
  deck: Card[],
  positions: string[],
  rng: () => number
): Draw[] {
  const pool = [...deck];
  const picks: Draw[] = [];
  for (const pos of positions) {
    const idx = Math.floor(rng() * pool.length);
    const [card] = pool.splice(idx, 1);
    picks.push({
      id: crypto.randomUUID(),
      card,
      reversed: rng() > 0.5,
      position: pos,
    });
  }
  return picks;
}
