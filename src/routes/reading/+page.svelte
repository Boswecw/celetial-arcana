<script lang="ts">
  import { onMount } from 'svelte';
  import { riderWaiteDeck } from '$lib/decks';
  import ReadingFeedback from '$lib/components/ReadingFeedback.svelte';

  let date = new Date().toISOString().split('T')[0];
  let time = '12:00';
  let latitude = 0;
  let longitude = 0;
  let question = '';
  let spreadType = 'three-card';
  let loading = false;
  let reading: any = null;
  let error = '';
  let locationLoading = false;
  let locationError = '';
  let isShuffling = false;
  let isDealing = false;
  let deckElement: HTMLDivElement;
  let dealtCards: any[] = [];
  let readingId = '';
  let drawnCards: any[] = [];
  let showVideoPopup = false;
  let videoSrc = '/reading-animation.mp4';

  onMount(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVideoPopup) {
        showVideoPopup = false;
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  });

  const spreads = {
    'three-card': { name: 'Three Card', positions: ['Past', 'Present', 'Future'] },
    'celtic-cross': { name: 'Celtic Cross', positions: ['Situation', 'Challenge', 'Outcome', 'Foundation', 'Recent Past', 'Near Future', 'Self', 'Environment', 'Hopes/Fears', 'Final Outcome'] },
    'horseshoe': { name: 'Horseshoe', positions: ['Position 1', 'Position 2', 'Position 3', 'Position 4', 'Position 5', 'Position 6', 'Position 7'] },
  };

  // Request geolocation on component mount
  onMount(() => {
    if ('geolocation' in navigator) {
      locationLoading = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          latitude = parseFloat(position.coords.latitude.toFixed(4));
          longitude = parseFloat(position.coords.longitude.toFixed(4));
          locationLoading = false;
        },
        (err) => {
          locationError = `Location access denied: ${err.message}. Please enter manually.`;
          locationLoading = false;
        }
      );
    } else {
      locationError = 'Geolocation not supported. Please enter location manually.';
    }
  });

  function drawCards(count: number) {
    const drawn = [];
    const used = new Set<number>();

    for (let i = 0; i < count; i++) {
      let idx;
      do {
        idx = Math.floor(Math.random() * riderWaiteDeck.length);
      } while (used.has(idx));
      used.add(idx);

      drawn.push({
        card: riderWaiteDeck[idx],
        reversed: Math.random() > 0.5,
      });
    }

    return drawn;
  }

  async function shuffleDeck() {
    isShuffling = true;

    // Shuffle animation duration: 1.2 seconds (3 cycles * 0.4s each)
    await new Promise(resolve => setTimeout(resolve, 1200));

    isShuffling = false;
  }

  async function dealCards(cards: any[], positions: string[]) {
    if (!deckElement) return;

    isDealing = true;
    dealtCards = [];

    // Deal each card with a staggered animation
    for (let i = 0; i < cards.length; i++) {
      dealtCards = [...dealtCards, { ...cards[i], position: positions[i], index: i }];

      // Delay between each card deal
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    isDealing = false;
  }

  async function submitReading() {
    loading = true;
    error = '';
    reading = null;
    dealtCards = [];

    try {
      // Show video popup
      showVideoPopup = true;

      const spread = spreads[spreadType as keyof typeof spreads];
      const newDrawnCards = drawCards(spread.positions.length);
      drawnCards = newDrawnCards;

      // Shuffle animation
      await shuffleDeck();

      // Deal animation
      await dealCards(newDrawnCards, spread.positions);

      // Get ephemeris data
      const ephemerisRes = await fetch(
        `/api/ephemeris?date=${date}&time=${time.replace(':', '%3A')}&lat=${latitude}&lon=${longitude}`
      );
      const ephemeris = await ephemerisRes.json();

      // Get reading
      const readingRes = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          draw: newDrawnCards.map((d, i) => ({
            position: spread.positions[i],
            reversed: d.reversed,
            card: d.card,
          })),
          ephemeris,
        }),
      });

      reading = await readingRes.json();
      readingId = `reading-${Date.now()}`;
    } catch (err) {
      error = `Error: ${err}`;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen p-6" style="background: linear-gradient(135deg, #0B0724 0%, #17133A 100%);">
  <div class="max-w-7xl mx-auto">
    <!-- Back Link -->
    <div class="mb-8">
      <a href="/" class="inline-flex items-center text-lg font-semibold transition-all duration-200 hover:opacity-80" style="color: #C6A7FF;">
        ← Back to Home
      </a>
    </div>

    <!-- Header -->
    <div class="text-center mb-16">
      <h1 class="text-7xl font-bold mb-4" style="background: linear-gradient(135deg, #7B61FF, #FF4EDB); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        Celestial Reading
      </h1>
      <p class="text-2xl" style="color: #C6A7FF;">Combine tarot wisdom with your birth chart</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Input Form -->
      <div class="lg:col-span-1 card-surface p-10 rounded-2xl">
        <h2 class="text-3xl font-bold mb-8" style="color: #EDEBFF;">Your Information</h2>

        <div class="space-y-6">
          <!-- Question -->
          <div>
            <label for="question" class="block text-lg font-semibold mb-3" style="color: #C6A7FF;">Your Question (optional)</label>
            <textarea
              id="question"
              bind:value={question}
              placeholder="What would you like to know?"
              class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg"
              style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
              rows="4"
            ></textarea>
          </div>

          <!-- Date -->
          <div>
            <label for="date" class="block text-lg font-semibold mb-3" style="color: #C6A7FF;">Date of Birth</label>
            <input
              id="date"
              type="date"
              bind:value={date}
              class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg"
              style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
            />
          </div>

          <!-- Time -->
          <div>
            <label for="time" class="block text-lg font-semibold mb-3" style="color: #C6A7FF;">Time of Birth</label>
            <input
              id="time"
              type="time"
              bind:value={time}
              class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg"
              style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
            />
          </div>

          <!-- Location -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="block text-lg font-semibold" style="color: #C6A7FF;">Your Location</span>
              {#if locationLoading}
                <span class="text-sm" style="color: #FFC857;">📍 Getting location...</span>
              {:else if latitude !== 0 && longitude !== 0}
                <span class="text-sm" style="color: #4DF2B0;">✓ Location detected</span>
              {/if}
            </div>
            {#if locationError}
              <p class="text-sm mb-3" style="color: #FF6B6B;">{locationError}</p>
            {/if}
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="latitude" class="block text-sm font-semibold mb-2" style="color: #C6A7FF;">Latitude</label>
                <input
                  id="latitude"
                  type="number"
                  bind:value={latitude}
                  step="0.01"
                  placeholder="e.g., 40.7128"
                  class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg"
                  style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
                />
              </div>
              <div>
                <label for="longitude" class="block text-sm font-semibold mb-2" style="color: #C6A7FF;">Longitude</label>
                <input
                  id="longitude"
                  type="number"
                  bind:value={longitude}
                  step="0.01"
                  placeholder="e.g., -74.0060"
                  class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg"
                  style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
                />
              </div>
            </div>
          </div>

          <!-- Spread Type -->
          <div>
            <label for="spread" class="block text-lg font-semibold mb-3" style="color: #C6A7FF;">Spread Type</label>
            <select
              id="spread"
              bind:value={spreadType}
              class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg"
              style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
            >
              {#each Object.entries(spreads) as [key, spread]}
                <option value={key}>{spread.name}</option>
              {/each}
            </select>
          </div>

          <!-- Submit Button -->
          <button
            on:click={submitReading}
            disabled={loading}
            class="w-full py-4 px-8 rounded-lg font-bold text-xl transition-all duration-200 mt-8"
            style="background-color: #7B61FF; color: #EDEBFF; opacity: {loading ? 0.6 : 1}; cursor: {loading ? 'not-allowed' : 'pointer'};"
          >
            {loading ? '✨ Generating Reading...' : '🔮 Get Your Reading'}
          </button>

          {#if error}
            <div class="p-5 rounded-lg text-lg" style="background-color: rgba(255, 78, 219, 0.1); border-left: 4px solid #FF4EDB; color: #EDEBFF;">
              {error}
            </div>
          {/if}
        </div>
      </div>

      <!-- Deck and Cards Animation -->
      <div class="lg:col-span-2 card-surface p-10 rounded-2xl">
        {#if isShuffling || isDealing || dealtCards.length > 0}
          <div class="flex flex-col items-center justify-center min-h-96">
            <!-- Deck -->
            {#if isShuffling || (isDealing && dealtCards.length === 0)}
              <div
                id="deck-element"
                class="w-48 h-72 rounded-xl border-4 flex items-center justify-center mb-8"
                style="background: linear-gradient(135deg, #7B61FF, #FF4EDB); border-color: #C6A7FF; box-shadow: 0 20px 40px rgba(123, 97, 255, 0.3); animation: {isShuffling ? 'shuffle 1.2s ease-in-out' : 'none'};"
              >
                <div class="text-center">
                  <div class="text-6xl mb-2">🃏</div>
                  <div class="text-lg font-semibold" style="color: #EDEBFF;">
                    {isShuffling ? '🔀 Shuffling...' : '📍 Dealing...'}
                  </div>
                </div>
              </div>
            {/if}

            <!-- Dealt Cards -->
            {#if dealtCards.length > 0}
              <div class="w-full">
                <h3 class="text-2xl font-bold mb-6 text-center" style="color: #C6A7FF;">Your Cards</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {#each dealtCards as dealtCard (dealtCard.index)}
                    <div
                      class="flex flex-col items-center animate-fade-in"
                      style="animation: fadeInUp 0.6s ease-out {dealtCard.index * 0.2}s both;"
                    >
                      <div class="text-center mb-3">
                        <p class="text-sm font-semibold" style="color: #C6A7FF;">{dealtCard.position}</p>
                      </div>
                      <div
                        class="w-40 h-60 rounded-lg border-2 overflow-hidden"
                        style="border-color: #7B61FF; box-shadow: 0 10px 25px rgba(123, 97, 255, 0.2); transform: {dealtCard.reversed ? 'rotateY(180deg)' : 'none'};"
                      >
                        <img
                          src={dealtCard.card.image}
                          alt={dealtCard.card.name}
                          class="w-full h-full object-cover"
                        />
                      </div>
                      <p class="text-lg font-semibold mt-3" style="color: #EDEBFF;">{dealtCard.card.name}</p>
                      {#if dealtCard.reversed}
                        <p class="text-sm" style="color: #FF4EDB;">Reversed</p>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <div class="flex items-center justify-center min-h-96">
            <p class="text-xl" style="color: #B3A9C7;">Click "Get Your Reading" to begin</p>
          </div>
        {/if}
      </div>

      <!-- Reading Display -->
      <div class="lg:col-span-2 card-surface p-10 rounded-2xl">
        {#if reading}
          <h2 class="text-4xl font-bold mb-8" style="color: #EDEBFF;">Your Reading</h2>

          <div class="space-y-8">
            <!-- Main Reading -->
            <div>
              <p class="text-xl leading-relaxed" style="color: #EDEBFF; line-height: 2;">
                {reading.reading}
              </p>
            </div>

            <!-- Drawn Cards with Meanings -->
            {#if reading.analysis && reading.analysis.cards && reading.analysis.cards.length > 0}
              <div class="border-t-2" style="border-color: rgba(123, 97, 255, 0.3); pt-8">
                <h3 class="text-2xl font-bold mb-6 mt-8" style="color: #C6A7FF;">📖 Card Meanings</h3>
                <div class="space-y-4">
                  {#each reading.analysis.cards as card}
                    <div class="p-5 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                      <div class="flex items-start justify-between mb-3">
                        <div>
                          <p class="text-lg font-bold" style="color: #FF4EDB;">{card.name}</p>
                          <p class="text-sm" style="color: #C6A7FF;">Position: {card.position}</p>
                        </div>
                        <span class="text-2xl">{card.reversed ? '🔄' : '⬆️'}</span>
                      </div>
                      <p class="text-base leading-relaxed" style="color: #EDEBFF;">
                        {card.meaning}
                      </p>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Disclaimer -->
            {#if reading.disclaimer}
              <div class="p-6 rounded-lg text-lg" style="background-color: rgba(255, 200, 87, 0.1); border-left: 4px solid #FFC857; color: #EDEBFF;">
                {reading.disclaimer}
              </div>
            {/if}

            <!-- Warnings -->
            {#if reading.warnings && reading.warnings.length > 0}
              <div class="space-y-3">
                {#each reading.warnings as warning}
                  <div class="p-5 rounded-lg text-lg" style="background-color: rgba(77, 242, 176, 0.1); border-left: 4px solid #4DF2B0; color: #EDEBFF;">
                    ✓ {warning}
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Crisis Resources -->
            {#if reading.resources}
              <div class="p-6 rounded-lg text-lg" style="background-color: rgba(198, 167, 255, 0.1); border-left: 4px solid #C6A7FF; color: #EDEBFF;">
                <strong class="text-xl">Support Resources:</strong><br />
                {reading.resources}
              </div>
            {/if}

            <!-- Feedback Component -->
            {#if reading && readingId && drawnCards.length > 0}
              <ReadingFeedback
                {readingId}
                cards={drawnCards.map((d) => d.card.name)}
                themes={reading.analysis?.themes || []}
                {question}
                onFeedbackSubmitted={() => {
                  // Optional: Show success message or refresh
                }}
              />
            {/if}
          </div>
        {:else if !loading}
          <div class="text-center py-20">
            <p class="text-2xl" style="color: #B3A9C7;">Fill in your information and click "Get Your Reading" to begin</p>
          </div>
        {:else}
          <div class="text-center py-20">
            <p class="text-2xl" style="color: #C6A7FF;">✨ Weaving your reading...</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Video Popup (outside main container for proper z-index) -->
{#if showVideoPopup}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    style="background-color: rgba(0, 0, 0, 0.9);"
    on:click={() => (showVideoPopup = false)}
    role="dialog"
    aria-modal="true"
  >
    <div class="relative w-full max-w-4xl mx-4" on:click|stopPropagation>
      <button
        on:click={() => (showVideoPopup = false)}
        class="absolute -top-12 right-0 text-white text-3xl font-bold hover:text-gray-300 transition-colors"
        aria-label="Close video"
      >
        ✕
      </button>

      <video
        src={videoSrc}
        controls
        autoplay
        class="w-full rounded-lg shadow-2xl block"
        style="box-shadow: 0 0 50px rgba(123, 97, 255, 0.5); background-color: #000;"
      >
        <track kind="captions" />
      </video>

      <div class="text-center mt-4 text-white">
        <p class="text-sm" style="color: #C6A7FF;">
          Press ESC or click outside to close
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shuffle {
    0% {
      transform: rotateZ(0deg) translateY(0px);
    }
    10% {
      transform: rotateZ(-15deg) translateY(-5px);
    }
    20% {
      transform: rotateZ(15deg) translateY(5px);
    }
    30% {
      transform: rotateZ(-10deg) translateY(-3px);
    }
    40% {
      transform: rotateZ(10deg) translateY(3px);
    }
    50% {
      transform: rotateZ(0deg) translateY(0px);
    }
    60% {
      transform: rotateZ(-15deg) translateY(-5px);
    }
    70% {
      transform: rotateZ(15deg) translateY(5px);
    }
    80% {
      transform: rotateZ(-10deg) translateY(-3px);
    }
    90% {
      transform: rotateZ(10deg) translateY(3px);
    }
    100% {
      transform: rotateZ(0deg) translateY(0px);
    }
  }

  :global(.animate-fade-in) {
    animation: fadeInUp 0.6s ease-out forwards;
  }
</style>
