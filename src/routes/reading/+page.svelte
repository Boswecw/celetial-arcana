<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { celestiaArcanaCards } from '$lib/decks/celestia-arcana';
  import ReadingFeedback from '$lib/components/ReadingFeedback.svelte';
  import ReadingExplainer from '$lib/components/ReadingExplainer.svelte';
  import type { CardInterpretation } from '$lib/rulesEngine';

  type ShuffleCard = {
    id: number;
    image: string;
    radius: number;
    duration: number;
    start: number;
    direction: 'normal' | 'reverse';
    delay: number;
  };

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
  let videoSrc = '/reading-animation.mp4';
  let videoElement: HTMLVideoElement;
  const astroTarotModel = import.meta.env.VITE_ASTRO_TAROT_MODEL || 'gpt-4o-mini';
  let userZodiac = '';
  let showTraditionalReading = true;
  let showToast = false;
  let toastTimeout: number | null = null;
  let toastMessage = '';
  let cardsContainerElement: HTMLDivElement;

  $: if (typeof document !== 'undefined') {
    if (showVideoPopup) {
      document.body.classList.add('video-popup-open');
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.muted = false;
        videoElement.volume = 1;
        const playPromise = videoElement.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((err) => console.error('Video autoplay blocked:', err));
        }
      }
    } else {
      document.body.classList.remove('video-popup-open');
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    }
  }

  let showShuffleOverlay = false;
  let shuffleCards: ShuffleCard[] = [];
  let shuffleResults: { id: string; image: string; name: string }[] = [];
  let isSpeaking = false;
  let speechSynthesis: SpeechSynthesisUtterance | null = null;
  let combinedReading = '';
  let maxDaysInMonth = 31;
  let availableVoices: SpeechSynthesisVoice[] = [];
  let narratedReadingId: string | null = null;

  // Calculate max days in selected month
  $: {
    const month = parseInt(birthMonth) || 0;
    const year = parseInt(birthYear) || 2024;

    if (month === 2) {
      // February - check for leap year
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      maxDaysInMonth = isLeapYear ? 29 : 28;
    } else if ([4, 6, 9, 11].includes(month)) {
      // April, June, September, November
      maxDaysInMonth = 30;
    } else {
      // All other months
      maxDaysInMonth = 31;
    }

    // Ensure day doesn't exceed max days
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
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVideoPopup) {
        showVideoPopup = false;
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  });

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

  const zodiacData = [
    { name: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 }, element: 'Earth' },
    { name: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 }, element: 'Air' },
    { name: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 }, element: 'Water' },
    { name: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 }, element: 'Fire' },
    { name: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 }, element: 'Earth' },
    { name: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 }, element: 'Air' },
    { name: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 }, element: 'Water' },
    { name: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 }, element: 'Fire' },
    { name: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 }, element: 'Earth' },
    { name: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 }, element: 'Air' },
    { name: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 }, element: 'Water' },
    { name: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 }, element: 'Fire' }
  ];

  const zodiacSigns = zodiacData.map((z) => z.name);

  function formatAscendant(value: number | undefined) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 'Capricorn 12°';
    }
    const normalized = ((value % 360) + 360) % 360;
    const index = Math.floor(normalized / 30) % 12;
    const degrees = Math.floor(normalized % 30);
    const minutes = Math.round((normalized % 1) * 60);
    return `${zodiacSigns[index]} ${degrees}°${String(minutes).padStart(2, '0')}`;
  }

  function isWithinRange(month: number, day: number, start: { month: number; day: number }, end: { month: number; day: number }) {
    if (start.month === end.month && start.day === end.day) {
      return month === start.month && day === start.day;
    }

    if (start.month < end.month || (start.month === end.month && start.day <= end.day)) {
      if (month < start.month || month > end.month) return false;
      if (month === start.month && day < start.day) return false;
      if (month === end.month && day > end.day) return false;
      return true;
    }

    // Range wraps across year end
    if (month > start.month || month < end.month) return true;
    if (month === start.month && day >= start.day) return true;
    if (month === end.month && day <= end.day) return true;
    return false;
  }

  function deriveSunSign(month: number | null, day: number | null) {
    if (!month || !day) return null;
    for (const entry of zodiacData) {
      if (isWithinRange(month, day, entry.start, entry.end)) {
        return entry;
      }
    }
    return null;
  }

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
        idx = Math.floor(Math.random() * celestiaArcanaCards.length);
      } while (used.has(idx));
      used.add(idx);

      drawn.push({
        card: celestiaArcanaCards[idx],
        reversed: Math.random() > 0.5,
      });
    }

    return drawn;
  }

  function createSwirlCard(card: any, index: number): ShuffleCard {
    const cardsPerRing = 13;
    const ring = Math.floor(index / cardsPerRing);
    const ringOffset = index % cardsPerRing;
    const baseRadius = 160 + ring * 110;
    const radius = baseRadius + Math.random() * 60;
    const duration = 12 + ring * 3 + Math.random() * 4;
    const start = (360 / celestiaArcanaCards.length) * index + Math.random() * 15;
    const delay = -(Math.random() * duration);

    return {
      id: Date.now() + Math.random() + index,
      image: card.image,
      radius,
      duration,
      start,
      direction: ring % 2 === 0 ? 'normal' : 'reverse',
      delay,
    };
  }

  function startShuffleOverlay() {
    shuffleResults = [];
    showShuffleOverlay = true;
    // Only use 20 cards for animation (performance optimization)
    const selectedCards = celestiaArcanaCards.slice(0, 20);
    shuffleCards = selectedCards.map((card, index) => createSwirlCard(card, index));
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
      alert('Speech synthesis not supported in your browser');
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
    if (showTraditionalReading) {
      return [reading.reading, reading.combinedReading].filter(Boolean).join(' ');
    }
    return reading.combinedReading || '';
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
      const newDrawnCards = drawCards(spread.positions.length);
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

      const birthMonthNum = parseInt(birthMonth, 10) || null;
      const birthDayNum = parseInt(birthDay, 10) || null;
      const derivedSun = deriveSunSign(birthMonthNum, birthDayNum);
      const fallbackSun = derivedSun ? `${derivedSun.name} 0°` : 'Pisces 0°';
      const fallbackElement = derivedSun ? [derivedSun.element] : [];

      // Format date from individual inputs (YYYY-MM-DD)
      const formattedDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

      // OPTIMIZATION: Start ephemeris and traditional reading in parallel
      const ephemerisPromise = fetch(
        `/api/ephemeris?date=${formattedDate}&time=${time.replace(':', '%3A')}&lat=${latitude}&lon=${longitude}`
      ).then(res => res.json());

      // Prepare spread data early (doesn't depend on ephemeris)
      const spreadData = newDrawnCards.map((d, i) => ({
        position: spread.positions[i],
        card: d.card.name,
        orientation: d.reversed ? 'reversed' : 'upright',
        element: d.card.element || '',
      }));

      // Start traditional reading early (doesn't depend on ephemeris initially)
      const traditionalReadingPromise = fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          draw: newDrawnCards.map((d, i) => ({
            position: spread.positions[i],
            reversed: d.reversed,
            card: d.card,
          })),
          ephemeris: null, // Will be updated later if needed
        }),
      });

      // Wait for ephemeris to prepare astro data
      const ephemeris = await ephemerisPromise;

      // Prepare astro data for Python script
      const astroData = {
        sun: ephemeris.sun || ephemeris.planet_details?.sun?.sign || fallbackSun,
        moon: ephemeris.moon || ephemeris.planet_details?.moon?.sign || 'Taurus 5°',
        asc: ephemeris.asc || formatAscendant(ephemeris.ascendant),
        dominant_elements: ephemeris.dominant_elements || fallbackElement,
        notable_aspects: ephemeris.notable_aspects || [],
        lunar_phase: ephemeris.lunar_phase || 'Waxing Crescent',
      };
      userZodiac = astroData.sun?.split(' ')[0] || derivedSun?.name || '';

      // Call Python Astro-Tarot synthesis API (now with ephemeris data)
      const astroTarotRes = await fetch('/api/astro-tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question || 'What guidance does the universe have for me?',
          timeframe: 'next 30 days',
          astro: astroData,
          spread: spreadData,
          model: astroTarotModel,
          temperature: 0.2,
          num_predict: 1500,
        }),
      });

      if (!astroTarotRes.ok) {
        const errorData = await astroTarotRes.json();
        throw new Error(errorData.message || 'Failed to generate Astro-Tarot reading');
      }

      const astroTarotReading = await astroTarotRes.json();
      if (derivedSun) {
        const expectedSun = derivedSun.name.toLowerCase();
        const currentSun = astroTarotReading?.astro_summary?.core?.sun || '';
        const hasExpectedSun = currentSun.toLowerCase().startsWith(expectedSun);

        if (!hasExpectedSun) {
          const remainder = currentSun.includes(' ')
            ? currentSun.slice(currentSun.indexOf(' ') + 1)
            : '0°';
          const updatedCore = {
            ...(astroTarotReading?.astro_summary?.core ?? {}),
            sun: `${derivedSun.name} ${remainder}`.trim(),
          };

          if (!updatedCore.dominant_elements || updatedCore.dominant_elements.length === 0) {
            updatedCore.dominant_elements = [derivedSun.element];
          }

          const astroSummary = {
            ...(astroTarotReading?.astro_summary ?? {}),
            core: updatedCore,
          };

          astroTarotReading.astro_summary = astroSummary;
        }
      }

      // Wait for traditional reading to complete (started earlier)
      const readingRes = await traditionalReadingPromise;
      const traditionalReading = await readingRes.json();

      // Generate combined reading (cards + horoscope synthesis)
      // This now happens in parallel with traditional reading processing
      const combinedRes = await fetch('/api/combined-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question || 'What guidance does the universe have for me?',
          traditionalReading: traditionalReading.reading,
          astroTarotSynthesis: astroTarotReading,
          cards: newDrawnCards.map((d, i) => ({
            name: d.card.name,
            position: spread.positions[i],
            reversed: d.reversed,
          })),
        }),
      });

      const combinedReadingData = await combinedRes.json();

      // Merge readings
      reading = {
        ...traditionalReading,
        astroTarot: astroTarotReading,
        combinedReading: combinedReadingData.reading,
      };

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
    if (typeof document !== 'undefined') {
      document.body.classList.remove('video-popup-open');
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

            <!-- Astro-Tarot Reading (Primary) -->
            {#if reading.astroTarot}
              <div class="p-8 rounded-xl mb-8" style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.15), rgba(255, 78, 219, 0.1)); border: 2px solid #7B61FF; box-shadow: 0 10px 30px rgba(123, 97, 255, 0.2);">
                <h3 class="text-3xl font-bold mb-6 flex items-center gap-2" style="color: #FF4EDB;">
                  <span>🌙</span>
                  Astro-Tarot Synthesis
                </h3>

                <!-- Theme -->
                {#if reading.astroTarot.interpretation?.theme}
                  <div class="mb-6 p-4 rounded-lg" style="background-color: rgba(198, 167, 255, 0.1); border-left: 4px solid #C6A7FF;">
                    <p class="text-lg font-semibold mb-2" style="color: #C6A7FF;">Theme</p>
                    <p class="text-base" style="color: #EDEBFF;">{reading.astroTarot.interpretation.theme}</p>
                  </div>
                {/if}

                <!-- Astro Summary -->
                {#if reading.astroTarot.astro_summary?.themes}
                  <div class="mb-6 p-4 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                    <p class="text-lg font-semibold mb-3" style="color: #C6A7FF;">Astrological Themes</p>
                    <div class="space-y-2">
                      {#each reading.astroTarot.astro_summary.themes as theme}
                        <p style="color: #EDEBFF;">• {theme}</p>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Resonance - Matches -->
                {#if reading.astroTarot.resonance?.matches && reading.astroTarot.resonance.matches.length > 0}
                  <div class="mb-6 p-4 rounded-lg" style="background-color: rgba(77, 242, 176, 0.1); border-left: 4px solid #4DF2B0;">
                    <p class="text-lg font-semibold mb-3" style="color: #4DF2B0;">Harmonies & Matches</p>
                    <div class="space-y-3">
                      {#each reading.astroTarot.resonance.matches as match}
                        <div>
                          <p class="font-semibold" style="color: #EDEBFF;">{match.type}</p>
                          <p style="color: #EDEBFF;">{match.detail}</p>
                          <p class="text-sm italic" style="color: #C6A7FF;">Why: {match.why}</p>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Resonance - Tensions -->
                {#if reading.astroTarot.resonance?.tensions && reading.astroTarot.resonance.tensions.length > 0}
                  <div class="mb-6 p-4 rounded-lg" style="background-color: rgba(255, 107, 107, 0.1); border-left: 4px solid #FF6B6B;">
                    <p class="text-lg font-semibold mb-3" style="color: #FF6B6B;">Tensions & Challenges</p>
                    <div class="space-y-3">
                      {#each reading.astroTarot.resonance.tensions as tension}
                        <div>
                          <p class="font-semibold" style="color: #EDEBFF;">{tension.type}</p>
                          <p style="color: #EDEBFF;">{tension.detail}</p>
                          <p class="text-sm italic" style="color: #C6A7FF;">Why: {tension.why}</p>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Action Items (Enriched) -->
                {#if reading.astroTarot.interpretation?.action_items && reading.astroTarot.interpretation.action_items.length > 0}
                  <div class="mb-6 p-4 rounded-lg" style="background-color: rgba(255, 200, 87, 0.1); border-left: 4px solid #FFC857;">
                    <p class="text-lg font-semibold mb-3" style="color: #FFC857;">🎯 Action Items</p>
                    <div class="space-y-2">
                      {#each reading.astroTarot.interpretation.action_items as action}
                        <p style="color: #EDEBFF;">✓ {action}</p>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Affirmations -->
                {#if reading.astroTarot.interpretation?.affirmations && reading.astroTarot.interpretation.affirmations.length > 0}
                  <div class="mb-6 p-4 rounded-lg" style="background-color: rgba(198, 167, 255, 0.1); border-left: 4px solid #C6A7FF;">
                    <p class="text-lg font-semibold mb-3" style="color: #C6A7FF;">💫 Affirmations</p>
                    <div class="space-y-2">
                      {#each reading.astroTarot.interpretation.affirmations as affirmation}
                        <p style="color: #EDEBFF;">✨ {affirmation}</p>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Confidence -->
                {#if reading.astroTarot.confidence}
                  <div class="p-4 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                    <p class="text-lg font-semibold mb-2" style="color: #C6A7FF;">Confidence</p>
                    <p style="color: #EDEBFF;">Overall: {(reading.astroTarot.confidence.overall * 100).toFixed(0)}%</p>
                    {#if reading.astroTarot.confidence.notes}
                      <p class="text-sm mt-2" style="color: #C6A7FF;">{reading.astroTarot.confidence.notes}</p>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}



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

{#if showShuffleOverlay}
  <div class="shuffle-overlay">
    <div class="shuffle-area">
      {#each shuffleCards as card (card.id)}
        <div
          class="shuffling-card"
          style={`background-image: url('${card.image}'); --radius: ${card.radius}px; --duration: ${card.duration}s; --start: ${card.start}deg; --direction: ${card.direction}; --delay: ${card.delay}s;`}
        ></div>
      {/each}
    </div>
    <div class="shuffle-caption">
      <h1>✨ Celestia Arcana ✨</h1>
      <p>Drawing every card to weave your cosmic story...</p>
    </div>
  </div>
{/if}

<!-- Video Popup (outside main container for proper z-index) -->
{#if showVideoPopup}
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
    style="background-color: rgba(0, 0, 0, 0.95); pointer-events: auto; display: flex; top: 0; left: 0; right: 0; bottom: 0; padding: 2rem;"
    on:click={() => (showVideoPopup = false)}
    on:keydown={(e) => e.key === 'Escape' && (showVideoPopup = false)}
    role="dialog"
    aria-modal="true"
    tabindex="0"
  >
    <div class="relative w-full max-w-4xl mx-auto my-auto" on:click|stopPropagation role="presentation" style="pointer-events: auto; display: flex; flex-direction: column; align-items: center;">
      <button
        on:click={() => (showVideoPopup = false)}
        class="absolute -top-12 right-0 text-white text-3xl font-bold hover:text-gray-300 transition-colors"
        aria-label="Close video"
        type="button"
        style="pointer-events: auto; z-index: 10000;"
      >
        ✕
      </button>

      <video
        bind:this={videoElement}
        src={videoSrc}
        controls
        autoplay
        playsinline
        preload="none"
        on:ended={() => {
          console.log('Video ended');
          showVideoPopup = false;
        }}
        on:play={() => console.log('Video playing')}
        on:pause={() => console.log('Video paused')}
        on:error={(e) => {
          const mediaError = (e.currentTarget as HTMLVideoElement)?.error;
          console.error('Video error:', mediaError ?? e);
        }}
        on:loadedmetadata={() => {
          console.log('Video metadata loaded, duration:', videoElement?.duration);
        }}
        on:loadeddata={() => {
          if (videoElement) {
            videoElement.muted = false;
            videoElement.volume = 1;
          }
          const playPromise = videoElement?.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch((err) => console.error('Video play after load failed:', err));
          }
        }}
        style="width: 100%; height: auto; max-height: 80vh; border-radius: 0.5rem; box-shadow: 0 0 50px rgba(123, 97, 255, 0.5); background-color: #000; pointer-events: auto; display: block;"
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

  :global(body.video-popup-open) {
    overflow: hidden;
  }

  .shuffle-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: radial-gradient(circle at center, rgba(20, 15, 60, 0.95), rgba(5, 3, 20, 0.98));
    backdrop-filter: blur(8px) saturate(150%);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .shuffle-area {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .shuffling-card {
    position: absolute;
    top: 50%;
    left: 50%;
    width: clamp(60px, 15vw, 150px);
    aspect-ratio: 3 / 4;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    border-radius: clamp(0.375rem, 1vw, 0.75rem);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.7);
    pointer-events: none;
    transform-origin: center;
    opacity: 0.5;
    transform: translate(-50%, -50%) rotate(var(--start)) translateX(calc(var(--radius) * var(--radius-scale, 1)));
    animation: swirlOrbit var(--duration) linear infinite;
    animation-direction: var(--direction, normal);
    animation-delay: var(--delay, 0s);
    animation-fill-mode: both;
    will-change: transform;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .shuffling-card {
      --radius-scale: 0.4;
      width: clamp(40px, 12vw, 80px);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6);
    }

    .shuffle-caption h1 {
      font-size: clamp(1.5rem, 8vw, 2.5rem);
    }

    .shuffle-caption p {
      font-size: clamp(0.875rem, 3.5vw, 1.25rem);
      padding: 0 1rem;
    }
  }

  /* Small phone screens */
  @media (max-width: 480px) {
    .shuffling-card {
      --radius-scale: 0.3;
      width: clamp(35px, 10vw, 60px);
    }
  }

  .shuffle-caption {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #eae4ff;
    text-shadow: 0 0 18px rgba(123, 97, 255, 0.65);
    pointer-events: auto;
  }

  .shuffle-caption h1 {
    font-size: clamp(2.5rem, 6vw, 4rem);
    margin-bottom: 1rem;
  }

  .shuffle-caption p {
    font-size: clamp(1rem, 2vw, 1.5rem);
    color: #d7ceff;
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

  @keyframes swirlOrbit {
    0% {
      transform: translate(-50%, -50%) rotate(var(--start)) translateX(calc(var(--radius) * var(--radius-scale, 1)));
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(calc(var(--start) + 360deg)) translateX(calc(var(--radius) * var(--radius-scale, 1)));
      opacity: 0.55;
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
