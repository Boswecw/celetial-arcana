import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { celestiaArcanaCards } from '$lib/decks/celestia-arcana';

/**
 * GET /api/cards
 * Returns a list of all card image filenames derived from the canonical deck.
 * Cached at module load so subsequent requests are O(1).
 */
const CARD_FILES = Array.from(
	new Set(
		celestiaArcanaCards
			.map((card) => card.image?.split('/').pop())
			.filter((filename): filename is string => Boolean(filename))
	)
).sort();

export const GET: RequestHandler = async () => {
	return json(CARD_FILES);
};
