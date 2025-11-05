<script lang="ts">
  import { onMount } from 'svelte';
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';
  import type { EphemerisData } from '$lib/ephemeris';

  let date = new Date().toISOString().split('T')[0];
  let time = '12:00';
  let latitude = 0;
  let longitude = 0;
  let locationLoading = false;
  let locationError = '';
  let loading = false;
  let chartData: EphemerisData | null = null;
  let planetEntries: Array<[string, number]> = [];
  let error = '';

  const planetEmojis: Record<string, string> = {
    sun: '☀️',
    moon: '🌙',
    mercury: '☿️',
    venus: '♀️',
    mars: '♂️',
    jupiter: '♃',
    saturn: '♄',
    uranus: '♅',
    neptune: '♆',
    pluto: '♇',
  };

  const zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const zodiacEmojisMap: Record<string, string> = {
    'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
    'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
    'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓'
  };

  function getZodiacEmoji(sign: string): string {
    return zodiacEmojisMap[sign] || '♈';
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

  function getZodiacSign(longitude: number): string {
    const sign = Math.floor(longitude / 30);
    return zodiacSigns[sign % 12];
  }

  function getZodiacDegree(longitude: number): number {
    return Math.floor(longitude % 30);
  }

  async function calculateChart() {
    loading = true;
    error = '';
    chartData = null;

    try {
      // Validate inputs
      if (!date) {
        throw new Error('Please select a birth date');
      }

      // Format time as HH:MM:SS
      const timeFormatted = time.includes(':') ? `${time}:00` : time;
      const timeEncoded = timeFormatted.replace(/:/g, '%3A');

      const url = `/api/ephemeris?date=${date}&time=${timeEncoded}&lat=${latitude}&lon=${longitude}`;
      console.log('Fetching:', url);

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const ephemerisRes = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      console.log('Response status:', ephemerisRes.status);

      if (!ephemerisRes.ok) {
        throw new Error(`HTTP ${ephemerisRes.status}: Failed to calculate chart`);
      }

      const data = await ephemerisRes.json();
      chartData = data as EphemerisData;
      console.log('Chart data received:', chartData);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        error = 'Error: Request timed out. Please try again.';
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err);
        error = `Error: ${errorMsg}`;
      }
      console.error('Calculate chart error:', error);
    } finally {
      loading = false;
    }
  }

  $: planetEntries = chartData ? (Object.entries(chartData.planets) as Array<[string, number]>) : [];
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
    <div class="text-center mb-12">
      <h1 class="text-7xl font-bold mb-4" style="background: linear-gradient(135deg, #7B61FF, #FF4EDB); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        Cosmic Alignment
      </h1>
      <p class="text-2xl mb-6" style="color: #C6A7FF;">Discover your birth chart and planetary positions</p>

      <!-- Info Banner -->
      <div class="max-w-4xl mx-auto card-surface p-6 rounded-2xl" style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.1), rgba(255, 78, 219, 0.1)); border: 2px solid rgba(123, 97, 255, 0.3);">
        <div class="flex items-start gap-4">
          <div class="text-3xl">✨</div>
          <div class="text-left">
            <h3 class="text-lg font-bold mb-2" style="color: #EDEBFF;">What is a Birth Chart?</h3>
            <p class="text-sm leading-relaxed" style="color: #C6A7FF;">
              Your birth chart is a snapshot of the sky at the exact moment and location of your birth. It reveals the positions of planets, your rising sign (Ascendant), and how celestial energies influence your personality, relationships, and life path. Hover over the info icons (ℹ️) throughout the page for helpful tips!
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Input Form -->
      <div class="lg:col-span-1 card-surface p-10 rounded-2xl">
        <h2 class="text-3xl font-bold mb-8" style="color: #EDEBFF;">Birth Information</h2>

        <div class="space-y-6">
          <!-- Date -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <label for="date" class="text-lg font-semibold" style="color: #C6A7FF;">Birth Date</label>
              <InfoTooltip text="Your birth date determines your Sun sign and all planetary positions. This is the foundation of your birth chart and reveals your core personality traits and life path." />
            </div>
            <input
              id="date"
              type="date"
              bind:value={date}
              class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg transition-all"
              style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
              placeholder="Select your birth date"
            />
            <p class="text-xs mt-2" style="color: #B3A9C7;">
              📅 This will calculate your Sun, Moon, and planetary signs
            </p>
          </div>

          <!-- Time -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <label for="time" class="text-lg font-semibold" style="color: #C6A7FF;">Birth Time</label>
              <InfoTooltip text="Your exact birth time is crucial for calculating your Ascendant (rising sign) and house placements. Even a few minutes can change your rising sign! If unknown, use 12:00 PM as an approximation." />
            </div>
            <input
              id="time"
              type="time"
              bind:value={time}
              class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg transition-all"
              style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
            />
            <p class="text-xs mt-2" style="color: #B3A9C7;">
              ⏰ This calculates your Ascendant (Rising Sign) and Midheaven
            </p>
          </div>

          <!-- Location -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-lg font-semibold" style="color: #C6A7FF;">Your Location</span>
                <InfoTooltip text="Your birth location determines the time zone and affects house calculations. The location where you were born is important, not where you live now. We'll try to detect your current location, or you can enter coordinates manually." />
              </div>
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
                <div class="flex items-center gap-2 mb-2">
                  <label for="latitude" class="text-sm font-semibold" style="color: #C6A7FF;">Latitude</label>
                  <InfoTooltip text="Latitude is your north-south position on Earth. Positive values are north of the equator (e.g., New York is 40.71), negative values are south (e.g., Sydney is -33.87)." />
                </div>
                <input
                  id="latitude"
                  type="number"
                  bind:value={latitude}
                  step="0.01"
                  placeholder="e.g., 40.7128"
                  class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg transition-all"
                  style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
                />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <label for="longitude" class="text-sm font-semibold" style="color: #C6A7FF;">Longitude</label>
                  <InfoTooltip text="Longitude is your east-west position on Earth. Negative values are west of the Prime Meridian (e.g., New York is -74.00), positive values are east (e.g., Tokyo is 139.69)." />
                </div>
                <input
                  id="longitude"
                  type="number"
                  bind:value={longitude}
                  step="0.01"
                  placeholder="e.g., -74.0060"
                  class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg transition-all"
                  style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
                />
              </div>
            </div>
            <p class="text-xs mt-2" style="color: #B3A9C7;">
              🌍 Location helps calculate accurate house placements and local time zone.<br/>
              💡 Tip: Search "[your birth city] coordinates" to find your exact latitude and longitude
            </p>
          </div>

          <!-- Calculate Button -->
          <button
            on:click={calculateChart}
            disabled={loading}
            class="w-full py-4 px-8 text-xl font-bold rounded-2xl transition-all duration-200 disabled:opacity-50"
            style="background: linear-gradient(135deg, #7B61FF, #FF4EDB); color: #EDEBFF;"
          >
            {loading ? '🔮 Calculating...' : '🔮 Calculate Chart'}
          </button>
        </div>
      </div>

      <!-- Chart Display -->
      <div class="lg:col-span-2">
        {#if error}
          <div class="card-surface p-8 rounded-2xl" style="border-left: 4px solid #FF6B6B;">
            <p style="color: #FF6B6B;">{error}</p>
          </div>
        {:else if chartData}
          <!-- Planetary Positions -->
          <div class="card-surface p-8 rounded-2xl mb-8">
            <div class="flex items-center gap-2 mb-6">
              <h3 class="text-3xl font-bold" style="color: #C6A7FF;">☀️ Planetary Positions</h3>
              <InfoTooltip text="These show where each planet was located in the zodiac at your birth time. Each planet represents different aspects of your personality and life." />
            </div>
            <div class="grid grid-cols-2 gap-4">
              {#each planetEntries as [planet, longitude]}
                <div class="p-4 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-2xl">{planetEmojis[planet] || '●'}</span>
                    <span class="text-sm font-semibold" style="color: #C6A7FF;">{planet.charAt(0).toUpperCase() + planet.slice(1)}</span>
                  </div>
                  <p style="color: #EDEBFF;">
                    <span style="color: #FF4EDB;">{getZodiacEmoji(getZodiacSign(longitude))}</span>
                    {getZodiacSign(longitude)} {getZodiacDegree(longitude)}°
                  </p>
                  <p class="text-sm" style="color: #B3A9C7;">{longitude.toFixed(2)}°</p>
                </div>
              {/each}
            </div>
          </div>

          <!-- Angles -->
          <div class="card-surface p-8 rounded-2xl mb-8">
            <div class="flex items-center gap-2 mb-6">
              <h3 class="text-3xl font-bold" style="color: #C6A7FF;">📐 Angles</h3>
              <InfoTooltip text="Ascendant (Rising Sign) is how you appear to others. Midheaven (MC) represents your career path and public image. Both are calculated from your exact birth time and location." />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                <p class="text-sm" style="color: #C6A7FF;">Ascendant</p>
                <p style="color: #EDEBFF;">
                  <span style="color: #FF4EDB;">{getZodiacEmoji(getZodiacSign(chartData.ascendant))}</span>
                  {getZodiacSign(chartData.ascendant)} {getZodiacDegree(chartData.ascendant)}°
                </p>
              </div>
              <div class="p-4 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                <p class="text-sm" style="color: #C6A7FF;">Midheaven</p>
                <p style="color: #EDEBFF;">
                  <span style="color: #FF4EDB;">{getZodiacEmoji(getZodiacSign(chartData.midheaven))}</span>
                  {getZodiacSign(chartData.midheaven)} {getZodiacDegree(chartData.midheaven)}°
                </p>
              </div>
            </div>
          </div>

          <!-- Aspects -->
          {#if chartData.aspects && chartData.aspects.length > 0}
            <div class="card-surface p-8 rounded-2xl">
              <div class="flex items-center gap-2 mb-6">
                <h3 class="text-3xl font-bold" style="color: #C6A7FF;">⚡ Aspects</h3>
                <InfoTooltip text="Aspects are angular relationships between planets. They show how planetary energies interact: harmoniously (trine, sextile) or with tension (square, opposition)." />
              </div>
              <div class="space-y-3">
                {#each chartData.aspects as aspect}
                  <div class="p-4 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                    <div class="flex items-center justify-between">
                      <span style="color: #EDEBFF;">
                        {planetEmojis[aspect.planet1] || '●'} {aspect.planet1}
                        <span style="color: #FF4EDB;"> {aspect.type} </span>
                        {planetEmojis[aspect.planet2] || '●'} {aspect.planet2}
                      </span>
                      <span class="text-sm" style="color: #C6A7FF;">{aspect.angle.toFixed(1)}°</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {:else}
          <!-- Educational Empty State -->
          <div class="space-y-6">
            <!-- Privacy Disclaimer -->
            <div class="card-surface p-6 rounded-2xl privacy-banner" style="background: linear-gradient(135deg, rgba(77, 242, 176, 0.25), rgba(67, 217, 157, 0.2)); border: 3px solid #4DF2B0; box-shadow: 0 0 30px rgba(77, 242, 176, 0.4);">
              <div class="flex items-start gap-4">
                <div class="text-3xl animate-pulse">🔒</div>
                <div class="text-left">
                  <h3 class="text-xl font-bold mb-3" style="color: #4DF2B0; text-shadow: 0 0 10px rgba(77, 242, 176, 0.5);">🛡️ Your Privacy is 100% Protected</h3>
                  <p class="text-base leading-relaxed font-medium" style="color: #EDEBFF;">
                    ✅ All calculations are performed <strong style="color: #4DF2B0;">locally in your browser</strong><br/>
                    ✅ We <strong style="color: #4DF2B0;">never store, transmit, or collect</strong> any personal information<br/>
                    ✅ Your birth data and location details remain <strong style="color: #4DF2B0;">completely private</strong>
                  </p>
                </div>
              </div>
            </div>

            <!-- Educational Content -->
            <div class="card-surface p-8 rounded-2xl">
              <h3 class="text-2xl font-bold mb-6 text-center" style="color: #EDEBFF;">Understanding Your Birth Chart</h3>

              <div class="space-y-6">
                <!-- Planets Section -->
                <div>
                  <h4 class="text-lg font-bold mb-4" style="color: #C6A7FF;">☀️ The Planets</h4>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1);">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xl">{planetEmojis.sun}</span>
                        <span class="font-semibold text-sm" style="color: #EDEBFF;">Sun</span>
                      </div>
                      <p class="text-xs" style="color: #B3A9C7;">Your core self, ego, identity</p>
                    </div>
                    <div class="p-3 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1);">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xl">{planetEmojis.moon}</span>
                        <span class="font-semibold text-sm" style="color: #EDEBFF;">Moon</span>
                      </div>
                      <p class="text-xs" style="color: #B3A9C7;">Emotions, instincts, habits</p>
                    </div>
                    <div class="p-3 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1);">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xl">{planetEmojis.mercury}</span>
                        <span class="font-semibold text-sm" style="color: #EDEBFF;">Mercury</span>
                      </div>
                      <p class="text-xs" style="color: #B3A9C7;">Communication, thinking</p>
                    </div>
                    <div class="p-3 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1);">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xl">{planetEmojis.venus}</span>
                        <span class="font-semibold text-sm" style="color: #EDEBFF;">Venus</span>
                      </div>
                      <p class="text-xs" style="color: #B3A9C7;">Love, beauty, values</p>
                    </div>
                    <div class="p-3 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1);">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xl">{planetEmojis.mars}</span>
                        <span class="font-semibold text-sm" style="color: #EDEBFF;">Mars</span>
                      </div>
                      <p class="text-xs" style="color: #B3A9C7;">Action, energy, drive</p>
                    </div>
                    <div class="p-3 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1);">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xl">{planetEmojis.jupiter}</span>
                        <span class="font-semibold text-sm" style="color: #EDEBFF;">Jupiter</span>
                      </div>
                      <p class="text-xs" style="color: #B3A9C7;">Expansion, luck, growth</p>
                    </div>
                  </div>
                </div>

                <!-- Zodiac Signs Section -->
                <div>
                  <h4 class="text-lg font-bold mb-4" style="color: #C6A7FF;">♈ The Zodiac Signs</h4>
                  <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {#each zodiacSigns as sign}
                      <div class="p-2 rounded-lg text-center" style="background-color: rgba(255, 78, 219, 0.1);">
                        <div class="text-lg mb-1">{getZodiacEmoji(sign)}</div>
                        <p class="text-xs font-semibold" style="color: #EDEBFF;">{sign}</p>
                      </div>
                    {/each}
                  </div>
                  <p class="text-xs mt-3 text-center" style="color: #B3A9C7;">
                    Each planet falls into a zodiac sign, coloring how that planet's energy expresses itself in your life
                  </p>
                </div>

                <!-- CTA -->
                <div class="text-center pt-4">
                  <p class="text-lg" style="color: #C6A7FF;">👈 Fill in your birth information to discover your unique cosmic blueprint!</p>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
