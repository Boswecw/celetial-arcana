import type { PageLoad } from './$types';

export const prerender = false; // Dynamic content
export const ssr = true; // Enable SSR for better initial load
export const csr = true; // Enable client-side rendering

export const load: PageLoad = async ({ fetch }) => {
  // Preload card data
  try {
    const response = await fetch('/api/cards');
    if (response.ok) {
      const cards = await response.json();
      return { cards };
    }
  } catch (error) {
    console.error('Failed to preload cards:', error);
  }

  return { cards: null };
};
