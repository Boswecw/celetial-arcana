import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * GET /api/cards
 * Returns a list of all card image filenames from the static/cards directory
 * Automatically discovers new cards as they're added
 */
export const GET: RequestHandler = async () => {
  try {
    // Get the absolute path to the static/cards directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // Navigate from src/routes/api/cards to project root, then to static/cards
    const cardsDir = join(__dirname, '..', '..', '..', '..', 'static', 'cards');

    console.log('Reading cards from:', cardsDir);

    // Read all files from the cards directory
    const files = await readdir(cardsDir);

    // Filter for webp files and sort alphabetically
    const cardFiles = files
      .filter((file) => file.endsWith('.webp'))
      .sort();

    console.log('Found cards:', cardFiles.length);

    return json(cardFiles);
  } catch (error) {
    console.error('Error reading cards directory:', error);
    return json([], { status: 500 });
  }
};

