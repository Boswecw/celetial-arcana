import { getAllMeanings } from './decks/tarot-meanings-map';

export interface RAGDocument {
  id: string;
  type: 'card' | 'spread' | 'aspect' | 'house';
  title: string;
  content: string;
  embedding?: number[];
}

export interface RAGResult {
  documents: RAGDocument[];
  relevance: number[];
}

// Spread lore and meanings
const SPREAD_LORE: Record<string, string> = {
  'three-card': 'Past, Present, Future - A classic spread revealing the flow of time and circumstances',
  'celtic-cross': 'A comprehensive 10-card spread exploring all aspects of a situation',
  'horseshoe': 'Seven cards in a horseshoe pattern revealing influences and outcomes',
  'relationship': 'Six cards exploring the dynamics between two people',
};

const ASPECT_LORE: Record<string, string> = {
  conjunction: 'Planets merge their energies - amplification and focus',
  sextile: 'Harmonious 60° angle - natural talents and opportunities',
  square: 'Challenging 90° angle - friction creating growth',
  trine: 'Flowing 120° angle - ease and natural expression',
  opposition: '180° polarity - integration of opposing forces',
};

const HOUSE_LORE: Record<number, string> = {
  1: 'The House of Self - Your identity, appearance, and how you present to the world',
  2: 'The House of Values - Resources, possessions, and what you hold dear',
  3: 'The House of Communication - Siblings, short journeys, and mental exchange',
  4: 'The House of Home - Family, roots, and your foundation',
  5: 'The House of Creativity - Romance, self-expression, and joy',
  6: 'The House of Service - Work, health, and daily practices',
  7: 'The House of Partnership - Marriage, contracts, and open relationships',
  8: 'The House of Transformation - Shared resources, intimacy, and rebirth',
  9: 'The House of Philosophy - Higher learning, travel, and meaning',
  10: 'The House of Career - Public image, authority, and life direction',
  11: 'The House of Community - Friendships, groups, and collective vision',
  12: 'The House of Spirituality - Hidden matters, closure, and transcendence',
};

/**
 * Build RAG documents from deck, spreads, and astrological lore
 * Uses enriched meanings from tarot_meanings.json
 */
let cachedDocuments: RAGDocument[] | null = null;
let cachedSearchIndex: Array<{ doc: RAGDocument; tokens: Set<string> }> | null = null;

export function buildRAGDocuments(): RAGDocument[] {
  if (cachedDocuments) return cachedDocuments;

  const documents: RAGDocument[] = [];

  // Add card documents using enriched meanings from tarot_meanings.json
  const allMeanings = getAllMeanings();
  allMeanings.forEach((meaning, index) => {
    documents.push({
      id: `card-${index}`,
      type: 'card',
      title: meaning.name,
      content: `${meaning.name} (${meaning.suit})\n\nUpright: ${meaning.upright}\n\nReversed: ${meaning.reversed}`,
    });
  });

  // Add spread documents
  Object.entries(SPREAD_LORE).forEach(([spread, lore]) => {
    documents.push({
      id: `spread-${spread}`,
      type: 'spread',
      title: spread,
      content: lore,
    });
  });

  // Add aspect documents
  Object.entries(ASPECT_LORE).forEach(([aspect, lore]) => {
    documents.push({
      id: `aspect-${aspect}`,
      type: 'aspect',
      title: aspect,
      content: lore,
    });
  });

  // Add house documents
  Object.entries(HOUSE_LORE).forEach(([house, lore]) => {
    documents.push({
      id: `house-${house}`,
      type: 'house',
      title: `House ${house}`,
      content: lore,
    });
  });

  cachedDocuments = documents;
  return documents;
}

function getSearchIndex() {
  if (cachedSearchIndex) return cachedSearchIndex;
  cachedSearchIndex = buildRAGDocuments().map((doc) => ({
    doc,
    tokens: new Set(`${doc.title} ${doc.content}`.toLowerCase().split(/\s+/)),
  }));
  return cachedSearchIndex;
}

/**
 * Simple keyword-based retrieval (in production, use vector embeddings)
 */
export function retrieveRelevantDocuments(query: string, topK: number = 5): RAGResult {
  const index = getSearchIndex();
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = index.map(({ doc, tokens }) => {
    let score = 0;
    queryTerms.forEach((term) => {
      if (tokens.has(term)) score += 1;
    });
    return { doc, score };
  });

  const sorted = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const maxScore = Math.max(...sorted.map((s) => s.score), 1);
  const results = sorted.map((s) => ({
    doc: s.doc,
    relevance: s.score / maxScore,
  }));

  return {
    documents: results.map((r) => r.doc),
    relevance: results.map((r) => r.relevance),
  };
}

/**
 * Get context for LLM based on reading data
 */
export function buildReadingContext(
  cardNames: string[],
  aspectTypes: string[],
  themes: string[]
): string {
  const cardDocs = retrieveRelevantDocuments(cardNames.join(' '), 3);
  const aspectDocs = retrieveRelevantDocuments(aspectTypes.join(' '), 2);
  const themeDocs = retrieveRelevantDocuments(themes.join(' '), 2);

  let context = '## Card Meanings\n';
  cardDocs.documents.forEach((doc) => {
    context += `\n${doc.title}: ${doc.content}\n`;
  });

  context += '\n## Astrological Aspects\n';
  aspectDocs.documents.forEach((doc) => {
    context += `\n${doc.title}: ${doc.content}\n`;
  });

  context += '\n## Thematic Context\n';
  themeDocs.documents.forEach((doc) => {
    context += `\n${doc.title}: ${doc.content}\n`;
  });

  return context;
}

