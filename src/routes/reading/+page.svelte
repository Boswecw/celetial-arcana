<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { celestiaArcanaCards } from '$lib/decks/celestia-arcana';
  import ReadingFeedback from '$lib/components/ReadingFeedback.svelte';
  import ReadingExplainer from '$lib/components/ReadingExplainer.svelte';
  import ShuffleOverlay, { buildShuffleCards, type ShuffleCard } from '$lib/components/ShuffleOverlay.svelte';
  import VideoIntroPopup from '$lib/components/VideoIntroPopup.svelte';
  import AstroTarotPanel from '$lib/components/AstroTarotPanel.svelte';
  import type { CardInterpretation } from '$lib/rulesEngine';
  import { fateSeed } from '$lib/tarot';
  import { daysInMonth, deriveSunSign } from '$lib/zodiac';
  import { fetchCelestialReading } from '$lib/readingClient';

  let birthMonth = '';
  let birthDay = '';
  let birthYear = '';
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
  let deckElement: HTMLDivElement | null = null;
  let dealtCards: any[] = [];
  let readingId = '';
  let drawnCards: any[] = [];
  let showVideoPopup = true;
  const astroTarotModel = import.meta.env.VITE_ASTRO_TAROT_MODEL || 'gpt-4o-mini';
  let userZodiac = '';
  let showTraditionalReading = true;
  let showToast = false;
  let toastTimeout: number | null = null;
  let toastMessage = '';
  let cardsContainerElement: HTMLDivElement;

  let showShuffleOverlay = false;
  let shuffleCards: ShuffleCard[] = [];
  let shuffleResults: { id: string; image: string; name: string }[] = [];
  let isSpeaking = false;
  let speechSynthesis: SpeechSynthesisUtterance | null = null;
  let combinedReading = '';
  let maxDaysInMonth = 31;
  let availableVoices: SpeechSynthesisVoice[] = [];
  let narratedReadingId: string | null = null;

  // Cap the day input to the chosen month/year (leap-year-aware).
  $: {
    maxDaysInMonth = daysInMonth(parseInt(birthMonth, 10) || 0, parseInt(birthYear, 10) || 2024);
    if (birthDay && parseInt(birthDay) > maxDaysInMonth) {
      birthDay = String(maxDaysInMonth);
    }
  }

  function scheduleToast(message: string) {
    toastMessage = message;
    showToast = true;
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    if (typeof window === 'undefined') {
      return;
    }
    toastTimeout = window.setTimeout(() => {
      showToast = false;
      toastTimeout = null;
    }, 6000);
  }

  $: if (readingId === '') {
    narratedReadingId = null;
  }

  $: if (
    reading &&
    readingId &&
    !loading &&
    narratedReadingId !== readingId &&
    (
      (showTraditionalReading && (reading.reading || reading.combinedReading)) ||
      (!showTraditionalReading && reading.combinedReading)
    )
  ) {
    console.log('Auto-narration triggered!', {
      readingId,
      narratedReadingId,
      showTraditionalReading,
      hasReading: !!reading.reading,
      hasCombinedReading: !!reading.combinedReading
    });
    narratedReadingId = readingId;
    const textToSpeak = getReadingText();
    console.log('Text to speak length:', textToSpeak.length);
    if (textToSpeak) {
      speakReading(textToSpeak, { autoplay: true });
    } else {
      console.warn('No text to speak!');
    }
  }

  onMount(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const refreshVoices = () => {
      availableVoices = window.speechSynthesis.getVoices().filter(Boolean);
    };
    refreshVoices();
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices);
    };
  });

  function showCardHoverToast(card: any, index: number) {
    const spread = spreads[spreadType as keyof typeof spreads];
    const position = spread.positions[index] || `Card ${index + 1}`;
    const reversed = card.reversed ? ' (Reversed)' : '';

    toastMessage = `🎴 ${position}: ${card.card.name}${reversed}`;
    showToast = true;

    // Clear any existing timeout
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
  }

  function hideCardHoverToast() {
    // Don't hide immediately, add a small delay to prevent flickering
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastTimeout = window.setTimeout(() => {
      showToast = false;
      toastTimeout = null;
    }, 300);
  }

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

  function drawCards(count: number, rng: () => number = Math.random) {
    const drawn = [];
    const used = new Set<number>();

    for (let i = 0; i < count; i++) {
      let idx;
      do {
        idx = Math.floor(rng() * celestiaArcanaCards.length);
      } while (used.has(idx));
      used.add(idx);

      drawn.push({
        card: celestiaArcanaCards[idx],
        reversed: rng() > 0.5,
      });
    }

    return drawn;
  }

  // Build a deterministic RNG from the user's coordinates + birth instant.
  // Falls back to Math.random when inputs are missing so first-time visitors
  // still see a draw.
  function buildReadingRng(): () => number {
    const month = parseInt(birthMonth, 10);
    const day = parseInt(birthDay, 10);
    const year = parseInt(birthYear, 10);
    if (!month || !day || !year) return Math.random;

    const [hh = 12, mm = 0] = time.split(':').map(Number);
    const ts = Date.UTC(year, month - 1, day, hh || 0, mm || 0);
    if (!Number.isFinite(ts)) return Math.random;

    // Use a session salt so the same birth chart still gets a different draw
    // each click, while keeping the draw reproducible within a single reading.
    const sessionSalt = Date.now() / 1000;
    return fateSeed([month * 30, day * 12, year * 0.001], ts + sessionSalt, latitude, longitude);
  }

  function startShuffleOverlay() {
    shuffleResults = [];
    showShuffleOverlay = true;
    shuffleCards = buildShuffleCards();
  }

  function stopShuffleOverlay() {
    setTimeout(() => {
      showShuffleOverlay = false;
      shuffleCards = [];
    }, 400);
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

  async function speakReading(text: string, options: { autoplay?: boolean } = {}) {
    const { autoplay = false } = options;

    console.log('speakReading called', { autoplay, textLength: text.length, isSpeaking });

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      if (!autoplay) {
        console.log('Stopping speech, not autoplay');
        return;
      }
    }

    // Check browser support
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      scheduleToast('Voice narration is not supported in this browser.');
      isSpeaking = false;
      return;
    }

    if (!text || text.trim().length === 0) {
      console.warn('No text to speak');
      return;
    }

    isSpeaking = true;
    console.log('Starting speech synthesis...');

    const voices =
      availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

    // Use utility function for voice selection and utterance creation
    const { createReadingUtterance } = await import('$lib/utils/voiceSelection');
    const utterance = createReadingUtterance(text, voices);

    utterance.onend = () => {
      console.log('Speech ended');
      isSpeaking = false;
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      isSpeaking = false;
    };

    utterance.onstart = () => {
      console.log('Speech started successfully');
    };

    console.log('Calling speechSynthesis.speak()');
    window.speechSynthesis.speak(utterance);
    console.log('speechSynthesis.speak() called, speaking:', window.speechSynthesis.speaking);
  }

  function getReadingText(): string {
    if (!reading) return '';
    // Prefer the combined synthesis; only fall back to the traditional reading
    // when no combined narrative is available. Concatenating both produces a
    // double-length narration that re-reads disclaimers and section labels.
    if (reading.combinedReading) return reading.combinedReading;
    if (showTraditionalReading && reading.reading) return reading.reading;
    return '';
  }

  async function submitReading() {
    loading = true;
    error = '';
    reading = null;
    dealtCards = [];
    shuffleResults = [];
    narratedReadingId = null;
    readingId = '';

    startShuffleOverlay();

    try {
      const spread = spreads[spreadType as keyof typeof spreads];
      const rng = buildReadingRng();
      const newDrawnCards = drawCards(spread.positions.length, rng);
      drawnCards = newDrawnCards;
      shuffleResults = newDrawnCards.map((d, i) => ({
        id: `${d.card.id}-${i}`,
        image: d.card.image ?? '',
        name: d.card.name,
      }));

      // Shuffle animation
      await shuffleDeck();

      // Deal animation
      await dealCards(newDrawnCards, spread.positions);

      const result = await fetchCelestialReading({
        question,
        spreadPositions: spread.positions,
        drawnCards: newDrawnCards,
        birth: { birthMonth, birthDay, birthYear, time, latitude, longitude },
        model: astroTarotModel,
      });
      reading = result.reading;
      userZodiac = result.userZodiac;
      readingId = `reading-${Date.now()}`;
    } catch (err) {
      error = `Error: ${err}`;
    } finally {
      stopShuffleOverlay();
      loading = false;
    }
  }

  onDestroy(() => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
  });
</script>

<div class="min-h-screen p-8 lg:p-20 overflow-x-hidden" style="background: linear-gradient(135deg, #0B0724 0%, #17133A 100%);">
  <div class="max-w-6xl mx-auto w-full px-6 lg:px-16">
    <!-- Back Link -->
    <div class="mb-8">
      <a href="/" class="inline-flex items-center text-lg font-semibold transition-all duration-200 hover:opacity-80" style="color: #C6A7FF;">
        ← Back to Home
      </a>
    </div>

    <!-- Header -->
    <div class="text-center mb-20">
      <div class="mb-6 text-6xl">🔮✨🌙</div>
      <h1 class="text-7xl lg:text-8xl font-bold mb-4" style="background: linear-gradient(135deg, #7B61FF, #FF4EDB, #4DF2B0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-shadow: 0 0 30px rgba(123, 97, 255, 0.3);">
        Celestial Reading
      </h1>
      <p class="text-xl lg:text-2xl mb-2" style="color: #C6A7FF;">Combine tarot wisdom with your birth chart</p>
      <p class="text-sm" style="color: #B3A9C7;">Discover cosmic guidance tailored to your unique astrological profile</p>
    </div>

    {#if showToast}
      <div class="toast-notification" role="status" aria-live="polite">
        {toastMessage}
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 overflow-hidden">
      <!-- Input Form -->
      <div class="lg:col-span-1 space-y-4">
        <div class="toggle-banner inline-flex items-center gap-3" style="z-index: 10;">
          <label class="toggle-switch">
            <input
              type="checkbox"
              bind:checked={showTraditionalReading}
              on:change={() =>
                scheduleToast(
                  showTraditionalReading
                    ? 'Traditional tarot insight enabled — you will see and hear the full narrative.'
                    : 'Traditional tarot insight hidden — focus stays on astro synthesis.'
                )
              }
              aria-label="Toggle traditional tarot reading"
            />
            <span class="slider"></span>
          </label>
          <span class="text-sm font-semibold" style="color: #C6A7FF;">Traditional Reading</span>
        </div>

        <div
          class="overflow-x-hidden"
          style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.15), rgba(255, 78, 219, 0.08)); border: 2px solid rgba(123, 97, 255, 0.3); border-radius: 2rem; padding: 2.5rem 1.5rem; backdrop-filter: blur(10px);"
        >
          <div class="flex items-center gap-3 mb-8">
            <span class="text-3xl">📋</span>
            <h2 class="text-3xl font-bold" style="color: #EDEBFF;">Your Information</h2>
          </div>

          <div class="space-y-6">
          <!-- Question -->
          <div>
            <label for="question" class="block text-lg font-semibold mb-3 flex items-center gap-2" style="color: #C6A7FF;">
              <span>❓</span>
              Your Question (optional)
              <button
                type="button"
                on:click={() => scheduleToast('💡 Questions give your reading focus and direction, helping the cards speak to what you need. They\'re optional though — you can explore broadly ("What do I need to know?") or simply see what unfolds without a specific question. The cards will reveal what\'s needed either way.')}
                class="info-icon-button"
                aria-label="Why questions are optional"
                title="Click for more info"
              >
                ℹ️
              </button>
            </label>
            <textarea
              id="question"
              bind:value={question}
              placeholder="What would you like to know?"
              class="w-full p-4 rounded-xl bg-opacity-50 border-2 focus:outline-none text-lg transition-all duration-200"
              style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF; focus-border-color: #FF4EDB;"
              rows="4"
            ></textarea>
          </div>

          <!-- Date of Birth (Manual Entry) -->
          <fieldset style="border: none; padding: 0; margin: 0;">
            <legend class="block text-lg font-semibold mb-3 flex items-center gap-2" style="color: #C6A7FF;">
              <span>🎂</span>
              Date of Birth
            </legend>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label for="month" class="block text-sm font-semibold mb-2" style="color: #C6A7FF;">Month</label>
                <input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="MM"
                  bind:value={birthMonth}
                  class="w-full p-3 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg text-center"
                  style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
                />
              </div>
              <div>
                <label for="day" class="block text-sm font-semibold mb-2" style="color: #C6A7FF;">Day</label>
                <input
                  id="day"
                  type="number"
                  min="1"
                  max={maxDaysInMonth}
                  placeholder="DD"
                  bind:value={birthDay}
                  class="w-full p-3 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg text-center"
                  style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
                />
              </div>
              <div>
                <label for="year" class="block text-sm font-semibold mb-2" style="color: #C6A7FF;">Year</label>
                <input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="YYYY"
                  bind:value={birthYear}
                  class="w-full p-3 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg text-center"
                  style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
                />
              </div>
            </div>
          </fieldset>

          <!-- Time -->
          <div>
            <label for="time" class="block text-lg font-semibold mb-3 flex items-center gap-2" style="color: #C6A7FF;">
              <span>⏰</span>
              Time of Birth
            </label>
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
              <span class="block text-lg font-semibold flex items-center gap-2" style="color: #C6A7FF;">
                <span>📍</span>
                Your Location
              </span>
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
            <label for="spread" class="block text-lg font-semibold mb-3 flex items-center gap-2" style="color: #C6A7FF;">
              <span>🎴</span>
              Spread Type
            </label>
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
            class="w-full py-4 px-8 rounded-xl font-bold text-xl transition-all duration-300 mt-8 hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
            style="background: linear-gradient(135deg, #7B61FF, #FF4EDB); color: #EDEBFF; opacity: {loading ? 0.6 : 1}; cursor: {loading ? 'not-allowed' : 'pointer'}; box-shadow: 0 10px 30px rgba(123, 97, 255, 0.3);"
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

            <!-- Dealt Cards with Meanings -->
            {#if dealtCards.length > 0}
              <div class="w-full">
                <h3 class="text-2xl font-bold mb-6 text-center" style="color: #C6A7FF;">Your Cards</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {#each dealtCards as dealtCard, index (dealtCard.index)}
                    <div
                      class="flex flex-col animate-fade-in"
                      style="animation: fadeInUp 0.6s ease-out {index * 0.2}s both;"
                    >
                      <!-- Position Label -->
                      <div class="text-center mb-3">
                        <p class="text-sm font-semibold" style="color: #C6A7FF;">{dealtCard.position}</p>
                      </div>

                      <!-- Card Image -->
                      <div
                        class="w-40 h-60 rounded-lg border-2 overflow-hidden mx-auto mb-4"
                        style="border-color: #7B61FF; box-shadow: 0 10px 25px rgba(123, 97, 255, 0.2);"
                      >
                        <img
                          src={dealtCard.card.image}
                          alt={dealtCard.card.name}
                          loading="lazy"
                          class={`w-full h-full object-cover ${dealtCard.reversed ? 'reversed-card-image' : ''}`}
                        />
                      </div>

                      <!-- Card Name and Reversed Indicator -->
                      <p class="text-lg font-semibold text-center" style="color: #EDEBFF;">{dealtCard.card.name}</p>
                      {#if dealtCard.reversed}
                        <p class="text-sm text-center" style="color: #FF4EDB;">🔄 Reversed</p>
                      {/if}

                      <!-- Card Meaning -->
                      {#if reading.analysis && reading.analysis.cards}
                        {@const cardMeaning = (reading.analysis.cards as CardInterpretation[]).find((c) => c.name === dealtCard.card.name)}
                        {#if cardMeaning}
                          <div class="mt-4 p-4 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                            <p class="text-sm leading-relaxed" style="color: #EDEBFF;">
                              {cardMeaning.meaning}
                            </p>
                          </div>
                        {/if}
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
      <div class="lg:col-span-3 overflow-x-hidden" style="background: linear-gradient(135deg, rgba(77, 242, 176, 0.08), rgba(123, 97, 255, 0.12)); border: 2px solid rgba(123, 97, 255, 0.3); border-radius: 2rem; padding: 2.5rem 1.5rem; backdrop-filter: blur(10px);">
        {#if reading}
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-4xl font-bold flex items-center gap-3" style="color: #EDEBFF;">
              <span>✨</span>
              Your Reading
            </h2>
            <button
              on:click={() => speakReading(getReadingText())}
              class="px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 hover:shadow-lg"
              style="background: linear-gradient(135deg, #7B61FF, #FF4EDB); color: #EDEBFF; opacity: {isSpeaking ? 0.7 : 1}; cursor: pointer; box-shadow: 0 5px 15px rgba(123, 97, 255, 0.2);"
            >
              {isSpeaking ? '🔊 Stop' : '🔊 Listen'}
            </button>
          </div>

          <!-- Cards Display Section (Top) -->
          {#if drawnCards.length > 0}
            <div bind:this={cardsContainerElement} class="mb-12 pb-8 border-b-2" style="border-color: rgba(123, 97, 255, 0.3);">
              <h3 class="text-2xl font-bold mb-6 flex items-center gap-2" style="color: #C6A7FF;">
                <span>🎴</span>
                Your Cards
              </h3>
              <div class="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
                {#each drawnCards as card, index}
                  <div
                    class="flex flex-col items-center"
                    on:mouseenter={() => showCardHoverToast(card, index)}
                    on:mouseleave={hideCardHoverToast}
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="w-24 h-36 rounded-lg border-2 overflow-hidden mb-2 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                      style="border: 2px solid #7B61FF; box-shadow: 0 10px 25px rgba(123, 97, 255, 0.3); background: linear-gradient(135deg, rgba(123, 97, 255, 0.1), rgba(255, 78, 219, 0.05));"
                    >
                      <img
                        src={card.card.image}
                        alt={card.card.name}
                        loading="lazy"
                        class={`w-full h-full object-cover ${card.reversed ? 'reversed-card-image' : ''}`}
                      />
                    </div>
                    <p class="text-xs font-semibold text-center" style="color: #EDEBFF;">{card.card.name}</p>
                    {#if card.reversed}
                      <p class="text-xs" style="color: #FF4EDB;">Reversed</p>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="space-y-8">
            <!-- Question Display -->
            {#if question}
              <div class="p-6 rounded-lg" style="background: linear-gradient(135deg, rgba(255, 78, 219, 0.15), rgba(123, 97, 255, 0.1)); border: 2px solid #FF4EDB;">
                <p class="text-lg font-semibold mb-2" style="color: #FF4EDB;">Your Question</p>
                <p class="text-xl" style="color: #EDEBFF;">"{question}"</p>
              </div>
            {/if}

            <!-- Combined Interpretation (Cards + Horoscope) -->
            {#if reading.combinedReading}
              <div class="p-8 rounded-xl mb-8" style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.15), rgba(255, 78, 219, 0.1)); border: 2px solid #7B61FF; box-shadow: 0 10px 30px rgba(123, 97, 255, 0.2);">
                <h3 class="text-3xl font-bold mb-6 flex items-center gap-2" style="color: #FF4EDB;">
                  <span>✨</span>
                  Your Reading
                </h3>
                <p class="text-lg leading-relaxed" style="color: #EDEBFF; line-height: 1.8;">
                  {reading.combinedReading}
                </p>
                <div class="mt-6 pt-4 border-t" style="border-color: rgba(123, 97, 255, 0.3);">
                  <p class="text-sm italic" style="color: rgba(237, 235, 255, 0.7);">
                    Disclaimer: This reading is for entertainment purposes only. Tarot and astrology are not substitutes for professional advice.
                  </p>
                </div>
              </div>
            {/if}

            {#if showTraditionalReading && reading.reading}
              <div class="p-7 rounded-xl mb-8" style="background: linear-gradient(135deg, rgba(77, 242, 176, 0.12), rgba(123, 97, 255, 0.08)); border: 2px solid rgba(77, 242, 176, 0.4); box-shadow: 0 8px 24px rgba(77, 242, 176, 0.15);">
                <h3 class="text-2xl font-bold mb-4 flex items-center gap-2" style="color: #4DF2B0;">
                  <span>🔍</span>
                  Traditional Tarot Insight
                </h3>
                <p class="text-lg leading-relaxed" style="color: #EDEBFF; line-height: 1.8;">
                  {reading.reading}
                </p>
                <div class="mt-6 pt-4 border-t" style="border-color: rgba(77, 242, 176, 0.3);">
                  <p class="text-sm italic" style="color: rgba(237, 235, 255, 0.7);">
                    Disclaimer: This reading is for entertainment purposes only. Tarot and astrology are not substitutes for professional advice.
                  </p>
                </div>
              </div>
            {/if}

            <!-- Astro-Tarot Synthesis Panel -->
            <AstroTarotPanel astroTarot={reading.astroTarot} />



            <!-- Feedback Component -->
            {#if reading && readingId && drawnCards.length > 0}
              <ReadingFeedback
                {readingId}
                cards={drawnCards.map((d) => d.card.name)}
                themes={reading.analysis?.themes || []}
                astroTarotThemes={reading.astroTarot?.astro_summary?.themes || []}
                {userZodiac}
                onFeedbackSubmitted={() => {
                  // Optional: Show success message or refresh
                }}
              />
            {/if}

            <!-- Reading Explainer (Conversation) -->
            {#if reading && readingId && drawnCards.length > 0}
              <ReadingExplainer {reading} />
            {/if}
          </div>
        {:else if !loading}
          <div class="text-center py-20">
            <div class="text-6xl mb-6">🔮</div>
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

<ShuffleOverlay visible={showShuffleOverlay} cards={shuffleCards} />

<VideoIntroPopup open={showVideoPopup} onClose={() => (showVideoPopup = false)} />

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

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-switch .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background-color: rgba(123, 97, 255, 0.4);
    border-radius: 9999px;
    transition: background-color 0.2s ease;
  }

  .toggle-switch .slider::before {
    content: "";
    position: absolute;
    height: 18px;
    width: 18px;
    left: 4px;
    top: 3px;
    background-color: #0B0724;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }

  .toggle-switch input:checked + .slider {
    background: linear-gradient(135deg, #7B61FF, #FF4EDB);
  }

  .toggle-switch input:checked + .slider::before {
    transform: translateX(20px);
  }

  .toggle-banner {
    padding: 0.4rem 0.75rem;
    background: rgba(11, 7, 36, 0.65);
    border: 1px solid rgba(123, 97, 255, 0.5);
    border-radius: 9999px;
    box-shadow: 0 10px 25px rgba(11, 7, 36, 0.35);
    backdrop-filter: blur(8px);
  }

  .info-icon-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    transition: transform 0.2s ease, opacity 0.2s ease;
    opacity: 0.7;
    line-height: 1;
  }

  .info-icon-button:hover {
    opacity: 1;
    transform: scale(1.2);
  }

  .toast-notification {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 11000;
    max-width: 420px;
    padding: 0.9rem 1.2rem;
    background: linear-gradient(135deg, rgba(123, 97, 255, 0.92), rgba(255, 78, 219, 0.88));
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    color: #EDEBFF;
    font-size: 0.95rem;
    line-height: 1.5;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
    animation: toastFade 0.25s ease-out;
  }

  @keyframes toastFade {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes cardAppear {
    0% {
      opacity: 0;
      transform: scale(0) rotateY(90deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotateY(0deg);
    }
  }
</style>
