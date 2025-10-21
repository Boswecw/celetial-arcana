<script lang="ts">
  import { riderWaiteDeck } from '$lib/decks';

  let selectedCard = riderWaiteDeck[0];
  let reversed = false;

  function selectCard(card: typeof riderWaiteDeck[0]) {
    selectedCard = card;
    reversed = false;
  }

  function toggleReversed() {
    reversed = !reversed;
  }

  function getCardImagePath(cardId: string): string {
    const id = parseInt(cardId);

    // Wikimedia Commons URLs for Rider-Waite cards
    const majorArcana = [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Fool.jpg/220px-Fool.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Magician.jpg/220px-Magician.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/High_Priestess.jpg/220px-High_Priestess.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Empress.jpg/220px-Empress.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Emperor.jpg/220px-Emperor.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Hierophant.jpg/220px-Hierophant.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Lovers.jpg/220px-Lovers.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Chariot.jpg/220px-Chariot.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Strength.jpg/220px-Strength.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Hermit.jpg/220px-Hermit.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Wheel_of_Fortune.jpg/220px-Wheel_of_Fortune.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Justice.jpg/220px-Justice.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Hanged_Man.jpg/220px-Hanged_Man.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Death.jpg/220px-Death.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Temperance.jpg/220px-Temperance.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Devil.jpg/220px-Devil.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Tower.jpg/220px-Tower.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Star.jpg/220px-Star.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Moon.jpg/220px-Moon.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Sun.jpg/220px-Sun.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Judgement.jpg/220px-Judgement.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/World.jpg/220px-World.jpg'
    ];

    if (id >= 0 && id <= 21) {
      return majorArcana[id];
    }

    // For minor arcana, use a placeholder or generic card back
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Fool.jpg/220px-Fool.jpg';
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
      <p style="color: #C6A7FF;">Rider-Waite-Smith Tarot Deck</p>
      <p class="text-sm mt-2" style="color: #B3A9C7;">Public domain images from Wikimedia Commons</p>
    </div>

    <!-- Main Display -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
      <!-- Card Display -->
      <div class="lg:col-span-1 flex justify-center">
        <div class="w-48 h-72 rounded-xl border-2 overflow-hidden" style="border-color: rgba(123, 97, 255, 0.5); box-shadow: 0 10px 15px -3px rgba(255, 78, 219, 0.3);">
          <img
            src={getCardImagePath(selectedCard.id)}
            alt={selectedCard.name}
            class="w-full h-full object-cover"
            style="transform: {reversed ? 'rotateY(180deg)' : 'none'}"
          />
        </div>
      </div>

      <!-- Card Info -->
      <div class="lg:col-span-2 card-surface card-surface-hover p-8">
        <h2 class="text-3xl font-bold mb-4" style="color: #EDEBFF;">{selectedCard.name}</h2>

        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold mb-2" style="color: #C6A7FF;">Upright</h3>
            <p style="color: #EDEBFF;">{selectedCard.upright}</p>
          </div>

          <div>
            <h3 class="text-lg font-semibold mb-2" style="color: #C6A7FF;">Reversed</h3>
            <p style="color: #EDEBFF;">{selectedCard.reversed}</p>
          </div>

          <button
            on:click={toggleReversed}
            class="btn-primary w-full"
          >
            {reversed ? 'Show Upright' : 'Show Reversed'}
          </button>
        </div>
      </div>
    </div>

    <!-- Deck Grid -->
    <div class="card-surface p-8">
      <h2 class="text-2xl font-bold mb-6" style="color: #EDEBFF;">Full Deck</h2>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each riderWaiteDeck as card (card.id)}
          <button
            on:click={() => selectCard(card)}
            class="group relative overflow-hidden rounded-lg border-2 transition-all hover:scale-105 h-48"
            style="border-color: {selectedCard.id === card.id ? '#FF4EDB' : 'rgba(123, 97, 255, 0.5)'}; box-shadow: {selectedCard.id === card.id ? '0 10px 15px -3px rgba(255, 78, 219, 0.5)' : 'none'};"
          >
            <img
              src={getCardImagePath(card.id)}
              alt={card.name}
              class="w-full h-full object-cover"
            />
          </button>
        {/each}
      </div>
    </div>

    <!-- Stats -->
    <div class="mt-12 grid grid-cols-3 gap-4 text-center">
      <div class="card-surface p-4">
        <p class="text-sm" style="color: #B3A9C7;">Total Cards</p>
        <p class="text-3xl font-bold" style="color: #EDEBFF;">{riderWaiteDeck.length}</p>
      </div>
      <div class="card-surface p-4">
        <p class="text-sm" style="color: #B3A9C7;">Major Arcana</p>
        <p class="text-3xl font-bold" style="color: #EDEBFF;">22</p>
      </div>
      <div class="card-surface p-4">
        <p class="text-sm" style="color: #B3A9C7;">Minor Arcana</p>
        <p class="text-3xl font-bold" style="color: #EDEBFF;">56</p>
      </div>
    </div>
  </div>
</div>

