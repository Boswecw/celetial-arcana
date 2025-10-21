<script lang="ts">
  import { onMount } from 'svelte';

  let date = new Date().toISOString().split('T')[0];
  let time = '12:00';
  let latitude = 0;
  let longitude = 0;
  let locationLoading = false;
  let locationError = '';
  let loading = false;
  let chartData: any = null;
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
      chartData = data;
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
        Cosmic Alignment
      </h1>
      <p class="text-2xl" style="color: #C6A7FF;">Discover your birth chart and planetary positions</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Input Form -->
      <div class="lg:col-span-1 card-surface p-10 rounded-2xl">
        <h2 class="text-3xl font-bold mb-8" style="color: #EDEBFF;">Birth Information</h2>

        <div class="space-y-6">
          <!-- Date -->
          <div>
            <label for="date" class="block text-lg font-semibold mb-3" style="color: #C6A7FF;">Birth Date</label>
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
            <label for="time" class="block text-lg font-semibold mb-3" style="color: #C6A7FF;">Birth Time</label>
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
            <h3 class="text-3xl font-bold mb-6" style="color: #C6A7FF;">☀️ Planetary Positions</h3>
            <div class="grid grid-cols-2 gap-4">
              {#each Object.entries(chartData.planets) as [planet, longitude]}
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
            <h3 class="text-3xl font-bold mb-6" style="color: #C6A7FF;">📐 Angles</h3>
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
              <h3 class="text-3xl font-bold mb-6" style="color: #C6A7FF;">⚡ Aspects</h3>
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
          <div class="card-surface p-8 rounded-2xl text-center">
            <p style="color: #B3A9C7;">Enter your birth information and click "Calculate Chart" to see your cosmic alignment</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
