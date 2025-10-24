<script lang="ts">
  import { onMount } from 'svelte';
  import { riderWaiteDeck } from '$lib/decks';
  import ReadingFeedback from '$lib/components/ReadingFeedback.svelte';
  import ReadingExplainer from '$lib/components/ReadingExplainer.svelte';

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
  let deckElement: HTMLDivElement;
  let dealtCards: any[] = [];
  let readingId = '';
  let drawnCards: any[] = [];
  let showVideoPopup = false;
  let videoSrc = '/reading-animation.mp4';
  let videoElement: HTMLVideoElement;
  let videoEnded = false;
  let isSpeaking = false;
  let speechSynthesis: SpeechSynthesisUtterance | null = null;
  let combinedReading = '';
  let maxDaysInMonth = 31;

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

  function speakReading(text: string) {
    // Cancel any existing speech
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      return;
    }

    // Check browser support
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in your browser');
      return;
    }

    isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.2; // Slightly higher pitch for female voice
    utterance.volume = 1;

    // Set female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('female'));
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    } else {
      // Fallback: use first available voice and adjust pitch
      const defaultVoice = voices.find(voice => !voice.name.includes('Male') && !voice.name.includes('male'));
      if (defaultVoice) {
        utterance.voice = defaultVoice;
      }
    }

    utterance.onend = () => {
      isSpeaking = false;
    };

    utterance.onerror = () => {
      isSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
  }

  function getReadingText(): string {
    if (!reading) return '';

    let text = '';

    // Add astro-tarot synthesis
    if (reading.astroTarot) {
      const astro = reading.astroTarot;
      text += `Astro-Tarot Synthesis. `;

      if (astro.interpretation?.theme) {
        text += `Theme: ${astro.interpretation.theme}. `;
      }

      if (astro.astro_summary?.themes) {
        text += `Astrological themes: ${astro.astro_summary.themes.join(', ')}. `;
      }

      if (astro.interpretation?.action_items) {
        text += `Action items: ${astro.interpretation.action_items.join('. ')}. `;
      }

      if (astro.interpretation?.affirmations) {
        text += `Affirmations: ${astro.interpretation.affirmations.join('. ')}. `;
      }
    }

    // Add traditional reading
    if (reading.reading) {
      text += `Traditional reading: ${reading.reading}`;
    }

    return text;
  }

  async function submitReading() {
    loading = true;
    error = '';
    reading = null;
    dealtCards = [];
    videoEnded = false;

    try {
      // Show video popup FIRST
      showVideoPopup = true;
      console.log('Video popup shown:', showVideoPopup);

      // Start a minimum video duration timer (3 seconds)
      const minVideoDuration = 3000;
      const videoStartTime = Date.now();

      // Reset video element to ensure it plays from the beginning
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.play().catch(err => console.error('Video play error:', err));
      }

      const spread = spreads[spreadType as keyof typeof spreads];
      const newDrawnCards = drawCards(spread.positions.length);
      drawnCards = newDrawnCards;

      // Shuffle animation
      await shuffleDeck();

      // Deal animation
      await dealCards(newDrawnCards, spread.positions);

      // Format date from individual inputs (YYYY-MM-DD)
      const formattedDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

      // Get ephemeris data
      const ephemerisRes = await fetch(
        `/api/ephemeris?date=${formattedDate}&time=${time.replace(':', '%3A')}&lat=${latitude}&lon=${longitude}`
      );
      const ephemeris = await ephemerisRes.json();

      // Prepare astro data for Python script
      const astroData = {
        sun: ephemeris.sun || 'Leo 10°',
        moon: ephemeris.moon || 'Taurus 5°',
        asc: ephemeris.asc || 'Capricorn 12°',
        dominant_elements: ephemeris.dominant_elements || [],
        notable_aspects: ephemeris.notable_aspects || [],
        lunar_phase: ephemeris.lunar_phase || 'Waxing Crescent',
      };

      // Prepare spread data for Python script
      const spreadData = newDrawnCards.map((d, i) => ({
        position: spread.positions[i],
        card: d.card.name,
        orientation: d.reversed ? 'reversed' : 'upright',
        element: d.card.element || '',
      }));

      // Call Python Astro-Tarot synthesis API
      const astroTarotRes = await fetch('/api/astro-tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question || 'What guidance does the universe have for me?',
          timeframe: 'next 30 days',
          astro: astroData,
          spread: spreadData,
          model: 'llama3',
          temperature: 0.2,
          num_predict: 2000,
        }),
      });

      if (!astroTarotRes.ok) {
        const errorData = await astroTarotRes.json();
        throw new Error(errorData.message || 'Failed to generate Astro-Tarot reading');
      }

      const astroTarotReading = await astroTarotRes.json();

      // OPTIMIZATION: Parallelize Traditional Reading and Combined Reading API calls
      // Make both requests simultaneously, then handle the dependency
      const readingResPromise = fetch('/api/reading', {
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

      // Wait for traditional reading to complete
      const readingRes = await readingResPromise;
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

      // Wait for video to end OR minimum duration, whichever is longer
      const waitForVideoEnd = new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (videoEnded || (videoElement && videoElement.ended)) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        // Fallback timeout (video duration + buffer)
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 60000); // 60 second max wait
      });

      const elapsedTime = Date.now() - videoStartTime;
      const remainingMinTime = Math.max(0, minVideoDuration - elapsedTime);

      // Wait for both minimum duration AND video to end
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, remainingMinTime)),
        waitForVideoEnd
      ]);

      // Close video popup and show results
      showVideoPopup = false;
    } catch (err) {
      error = `Error: ${err}`;
      showVideoPopup = false;
    } finally {
      loading = false;
    }
  }
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 overflow-hidden">
      <!-- Input Form -->
      <div class="lg:col-span-1 overflow-x-hidden" style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.15), rgba(255, 78, 219, 0.08)); border: 2px solid rgba(123, 97, 255, 0.3); border-radius: 2rem; padding: 2.5rem 1.5rem; backdrop-filter: blur(10px);">
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
          <div>
            <label class="block text-lg font-semibold mb-3 flex items-center gap-2" style="color: #C6A7FF;">
              <span>🎂</span>
              Date of Birth
            </label>
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
          </div>

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
                        style="border-color: #7B61FF; box-shadow: 0 10px 25px rgba(123, 97, 255, 0.2); transform: {dealtCard.reversed ? 'rotateY(180deg)' : 'none'};"
                      >
                        <img
                          src={dealtCard.card.image}
                          alt={dealtCard.card.name}
                          class="w-full h-full object-cover"
                        />
                      </div>

                      <!-- Card Name and Reversed Indicator -->
                      <p class="text-lg font-semibold text-center" style="color: #EDEBFF;">{dealtCard.card.name}</p>
                      {#if dealtCard.reversed}
                        <p class="text-sm text-center" style="color: #FF4EDB;">🔄 Reversed</p>
                      {/if}

                      <!-- Card Meaning -->
                      {#if reading.analysis && reading.analysis.cards}
                        {@const cardMeaning = reading.analysis.cards.find((c) => c.name === dealtCard.card.name)}
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
            <div class="mb-12 pb-8 border-b-2" style="border-color: rgba(123, 97, 255, 0.3);">
              <h3 class="text-2xl font-bold mb-6 flex items-center gap-2" style="color: #C6A7FF;">
                <span>🎴</span>
                Your Cards
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {#each drawnCards as card}
                  <div class="flex flex-col items-center">
                    <div
                      class="w-32 h-48 rounded-xl border-2 overflow-hidden mb-3 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                      style="border: 2px solid #7B61FF; box-shadow: 0 15px 35px rgba(123, 97, 255, 0.3); transform: {card.reversed ? 'rotateY(180deg)' : 'none'}; background: linear-gradient(135deg, rgba(123, 97, 255, 0.1), rgba(255, 78, 219, 0.05));"
                    >
                      <img
                        src={card.card.image}
                        alt={card.card.name}
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <p class="text-sm font-semibold text-center" style="color: #EDEBFF;">{card.card.name}</p>
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



            <!-- Disclaimer -->
            {#if reading.disclaimer}
              <div class="p-6 rounded-xl text-lg" style="background: linear-gradient(135deg, rgba(255, 200, 87, 0.15), rgba(255, 200, 87, 0.05)); border: 2px solid #FFC857; color: #EDEBFF; box-shadow: 0 5px 15px rgba(255, 200, 87, 0.1);">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">💫</span>
                  <p>{reading.disclaimer}</p>
                </div>
              </div>
            {/if}

            <!-- Warnings -->
            {#if reading.warnings && reading.warnings.length > 0}
              <div class="space-y-3">
                {#each reading.warnings as warning}
                  <div class="p-5 rounded-xl text-lg" style="background: linear-gradient(135deg, rgba(77, 242, 176, 0.15), rgba(77, 242, 176, 0.05)); border: 2px solid #4DF2B0; color: #EDEBFF; box-shadow: 0 5px 15px rgba(77, 242, 176, 0.1);">
                    <div class="flex items-start gap-3">
                      <span class="text-xl">✓</span>
                      <p>{warning}</p>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Crisis Resources -->
            {#if reading.resources}
              <div class="p-6 rounded-xl text-lg" style="background: linear-gradient(135deg, rgba(198, 167, 255, 0.15), rgba(198, 167, 255, 0.05)); border: 2px solid #C6A7FF; color: #EDEBFF; box-shadow: 0 5px 15px rgba(198, 167, 255, 0.1);">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">🤝</span>
                  <div>
                    <strong class="text-xl block mb-2">Support Resources:</strong>
                    <p>{reading.resources}</p>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Feedback Component -->
            {#if reading && readingId && drawnCards.length > 0}
              <ReadingFeedback
                {readingId}
                cards={drawnCards.map((d) => d.card.name)}
                themes={reading.analysis?.themes || []}
                astroTarotThemes={reading.astroTarot?.astro_summary?.themes || []}
                {question}
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
        on:ended={() => {
          console.log('Video ended');
          videoEnded = true;
        }}
        on:play={() => console.log('Video playing')}
        on:pause={() => console.log('Video paused')}
        on:error={(e) => console.error('Video error:', e)}
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
</style>
