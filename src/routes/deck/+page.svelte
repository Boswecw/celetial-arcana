<script lang="ts">
  import { celestiaArcanaCards } from '$lib/decks/celestia-arcana';
  import { getMeaningsBySuit } from '$lib/decks/tarot-meanings-map';
  import { onMount } from 'svelte';
  import Toast from '$lib/components/Toast.svelte';

  interface DynamicCard {
    id: string;
    name: string;
    filename: string;
    upright?: string;
    reversed?: string;
    suit?: string;
  }

  interface CardSection {
    suit: string;
    icon: string;
    cards: DynamicCard[];
  }

  interface KnowledgeCard {
    name: string;
    keywords_upright: string[];
    keywords_reversed: string[];
  }

  interface KnowledgeData {
    cards: KnowledgeCard[];
  }

  let selectedCard: DynamicCard | null = null;
  let showModal = false;
  let allCards: DynamicCard[] = [];
  let cardSections: CardSection[] = [];
  let loading = true;
  let knowledgeData: KnowledgeData | null = null;

  // Toast state
  let toastVisible = false;
  let toastMessage = '';
  let toastX = 0;
  let toastY = 0;

  const suitOrder = ['Major Arcana', 'Flames', 'Tides', 'Stones', 'Winds'];
  const suitIcons: Record<string, string> = {
    'Major Arcana': '✨',
    'Flames': '🔥',
    'Tides': '💧',
    'Stones': '💎',
    'Winds': '🌪️',
  };

  onMount(async () => {
    // Load knowledge data
    await loadKnowledgeData();

    // Load all cards from static directory
    await loadAllCards();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        showModal = false;
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  });

  async function loadKnowledgeData() {
    try {
      const response = await fetch('/celestia_arcana_knowledge.json');
      if (!response.ok) throw new Error('Failed to load knowledge data');
      knowledgeData = await response.json();
    } catch (err) {
      console.error('Error loading knowledge data:', err);
    }
  }

  async function loadAllCards() {
    try {
      // Fetch the list of card files from the static/cards directory
      const response = await fetch('/api/cards');
      if (!response.ok) throw new Error('Failed to load cards');

      const cardFiles: string[] = await response.json();

      // Convert filenames to card objects
      allCards = cardFiles.map((filename) => {
        // Convert filename to card name (e.g., "The_Fool.webp" -> "The Fool")
        const cardName = filename.replace(/\.webp$/, '').replace(/_/g, ' ');

        // Try to find matching card in celestiaArcanaCards for meanings
        const matchingCard = celestiaArcanaCards.find(
          (c) => c.name.toLowerCase() === cardName.toLowerCase()
        );

        // Determine suit based on card name
        let suit = 'Major Arcana';
        if (cardName.includes('of Flames')) suit = 'Flames';
        else if (cardName.includes('of Tide')) suit = 'Tides'; // Handles both "Tide" and "Tides"
        else if (cardName.includes('of Stones')) suit = 'Stones';
        else if (cardName.includes('of Winds')) suit = 'Winds';

        return {
          id: `card-${filename}`,
          name: cardName,
          filename: filename,
          suit: suit,
          upright: matchingCard?.upright || 'Upright meaning not available',
          reversed: matchingCard?.reversed || 'Reversed meaning not available',
        };
      });

      // Sort cards within each suit from Ace to King
      const cardOrder = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];

      const getCardSortOrder = (cardName: string): number => {
        for (let i = 0; i < cardOrder.length; i++) {
          if (cardName.includes(cardOrder[i])) {
            return i;
          }
        }
        return -1; // For Major Arcana cards
      };

      // Organize cards by suit, sorted by card count (highest to lowest)
      cardSections = suitOrder
        .map((suit) => ({
          suit,
          icon: suitIcons[suit],
          cards: allCards
            .filter((c) => c.suit === suit)
            .sort((a, b) => {
              const orderA = getCardSortOrder(a.name);
              const orderB = getCardSortOrder(b.name);
              if (orderA === -1 && orderB === -1) {
                // Both are Major Arcana, sort by name
                return a.name.localeCompare(b.name);
              }
              if (orderA === -1) return -1; // Major Arcana comes first
              if (orderB === -1) return 1;
              return orderA - orderB; // Sort by card order (Ace to King)
            }),
        }))
        .filter((section) => section.cards.length > 0)
        .sort((a, b) => b.cards.length - a.cards.length);

      loading = false;
    } catch (err) {
      console.error('Error loading cards:', err);
      loading = false;
    }
  }

  function openCardModal(card: DynamicCard) {
    selectedCard = card;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  function showToast(event: MouseEvent, card: DynamicCard) {
    if (!knowledgeData) return;

    // Get card meaning from knowledge data
    const cardData = knowledgeData.cards.find(
      (c) => c.name.toLowerCase() === card.name.toLowerCase()
    );

    if (cardData) {
      // Format the keywords for display
      const uprightKeywords = cardData.keywords_upright.slice(0, 3).join(', ');
      toastMessage = `${card.name}: ${uprightKeywords}`;

      // Position toast near the cursor
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      toastX = rect.left + rect.width / 2;
      toastY = rect.top;
      toastVisible = true;
    }
  }

  function hideToast() {
    toastVisible = false;
    toastMessage = '';
  }
</script>

<div class="min-h-screen p-8">
  <div class="max-w-7xl mx-auto">
    <!-- Back Link -->
    <div class="mb-8">
      <a href="/" class="inline-flex items-center text-lg font-semibold transition-all duration-200 hover:opacity-80" style="color: #C6A7FF;">
        ← Back to Home
      </a>
    </div>

    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-5xl font-bold mb-2" style="background: linear-gradient(135deg, #7B61FF, #FF4EDB); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Celestia Arcana</h1>
      <p style="color: #C6A7FF;">Mystical Tarot Deck</p>
      <p class="text-sm mt-2" style="color: #B3A9C7;">Original designs and classic wisdom combined</p>
    </div>

    <!-- Celestia Arcana Deck -->
    <div class="mb-16 card-surface p-8 rounded-2xl" style="border: 2px solid rgba(123, 97, 255, 0.3); background: linear-gradient(135deg, rgba(123, 97, 255, 0.05), rgba(255, 78, 219, 0.05));">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold mb-2 flex items-center justify-center gap-2" style="color: #EDEBFF;">
          <span>🎴</span>
          Celestia Arcana Deck
          <span>🎴</span>
        </h2>
        <p style="color: #C6A7FF;">Complete tarot collection with {allCards.length} cards</p>
      </div>

      {#if loading}
        <div class="text-center py-12">
          <p style="color: #B3A9C7;">Loading cards...</p>
        </div>
      {:else if allCards.length === 0}
        <div class="text-center py-12">
          <p style="color: #B3A9C7;">No cards found in the deck</p>
        </div>
      {:else}
        <!-- Display cards organized by suit/section -->
        {#each cardSections as section (section.suit)}
          <div class="mb-12">
            <div class="flex items-center gap-3 mb-6">
              <span class="text-4xl">{section.icon}</span>
              <h3 class="text-2xl font-bold" style="color: #EDEBFF;">{section.suit}</h3>
              <span class="text-sm px-3 py-1 rounded-full" style="background-color: rgba(123, 97, 255, 0.2); color: #C6A7FF;">
                {section.cards.length} cards
              </span>
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {#each section.cards as card (card.id)}
                <button
                  on:click={() => openCardModal(card)}
                  on:mouseenter={(e) => showToast(e, card)}
                  on:mouseleave={hideToast}
                  class="flex flex-col items-center cursor-pointer group transition-all hover:scale-110"
                  type="button"
                  title={card.name}
                >
                  <div class="w-20 h-28 rounded-lg border-2 overflow-hidden mb-2 transition-all group-hover:shadow-lg" style="border-color: #7B61FF; box-shadow: 0 5px 10px rgba(123, 97, 255, 0.2); group-hover:border-color: #FF4EDB;">
                    <img src="/cards/{card.filename}" alt={card.name} loading="lazy" class="w-full h-full object-cover" />
                  </div>
                  <p style="color: #C6A7FF;" class="text-xs font-semibold text-center line-clamp-2">{card.name}</p>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<!-- Card Details Modal -->
{#if showModal && selectedCard}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
    style="background-color: rgba(0, 0, 0, 0.95); pointer-events: auto; display: flex; top: 0; left: 0; right: 0; bottom: 0; padding: 2rem;"
    on:click={closeModal}
    on:keydown={(e) => e.key === 'Escape' && closeModal()}
    role="dialog"
    aria-modal="true"
    tabindex="0"
  >
    <div
      class="relative w-full max-w-2xl mx-auto my-auto card-surface p-8 rounded-2xl"
      on:click|stopPropagation
      role="presentation"
      style="pointer-events: auto; display: flex; flex-direction: column; align-items: center;"
    >
      <!-- Close Button -->
      <button
        on:click={closeModal}
        class="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 transition-colors"
        aria-label="Close modal"
        type="button"
        style="pointer-events: auto; z-index: 10000;"
      >
        ✕
      </button>

      <!-- Card Image -->
      <div class="w-48 h-72 rounded-lg border-2 overflow-hidden mb-6" style="border-color: #7B61FF; box-shadow: 0 10px 15px -3px rgba(123, 97, 255, 0.3);">
        <img
          src="/cards/{selectedCard.filename}"
          alt={selectedCard.name}
          loading="lazy"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Card Name -->
      <h2 class="text-4xl font-bold mb-6" style="color: #EDEBFF; background: linear-gradient(135deg, #7B61FF, #FF4EDB); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        {selectedCard.name}
      </h2>

      <!-- Card Meanings -->
      <div class="w-full space-y-6">
        <!-- Upright -->
        <div class="p-6 rounded-lg" style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.1), rgba(123, 97, 255, 0.05)); border-left: 4px solid #7B61FF;">
          <h3 class="text-lg font-semibold mb-2" style="color: #C6A7FF;">⬆️ Upright</h3>
          <p style="color: #EDEBFF;">{selectedCard.upright}</p>
        </div>

        <!-- Reversed -->
        <div class="p-6 rounded-lg" style="background: linear-gradient(135deg, rgba(255, 78, 219, 0.1), rgba(255, 78, 219, 0.05)); border-left: 4px solid #FF4EDB;">
          <h3 class="text-lg font-semibold mb-2" style="color: #FF4EDB;">🔄 Reversed</h3>
          <p style="color: #EDEBFF;">{selectedCard.reversed}</p>
        </div>
      </div>

      <!-- Close Instructions -->
      <div class="text-center mt-8">
        <p class="text-sm" style="color: #B3A9C7;">
          Press ESC or click outside to close
        </p>
      </div>
    </div>
  </div>
{/if}

<!-- Toast Notification -->
<Toast
  visible={toastVisible}
  message={toastMessage}
  x={toastX}
  y={toastY}
/>
