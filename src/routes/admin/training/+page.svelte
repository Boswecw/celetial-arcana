<script lang="ts">
  import { onMount } from 'svelte';

  interface TrainingStats {
    totalFeedback: number;
    averageRating: number;
    successfulPatterns: number;
    failedPatterns: number;
    uniqueCardCombinations: number;
    trackedThemes: number;
  }

  interface Recommendations {
    recommendations: string[];
  }

  let stats: TrainingStats | null = null;
  let recommendations: Recommendations | null = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      // Fetch training stats and recommendations in one call
      const statsRes = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-stats' }),
      });

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const data = await statsRes.json();

      // Extract stats from response
      if (data.stats) {
        stats = data.stats;
      }

      // Extract recommendations from response
      if (data.recommendations) {
        recommendations = { recommendations: data.recommendations };
      }

      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      loading = false;
    }
  });

  function getRatingColor(rating: number): string {
    if (rating >= 4.5) return '#4DF2B0'; // Green
    if (rating >= 3.5) return '#FFC857'; // Yellow
    if (rating >= 2.5) return '#FF9500'; // Orange
    return '#FF4EDB'; // Pink
  }

  function getProgressPercentage(current: number, total: number): number {
    return total > 0 ? (current / total) * 100 : 0;
  }
</script>

<div class="min-h-screen p-8" style="background: linear-gradient(135deg, #1a0033 0%, #2d0052 100%);">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-12">
      <h1 class="text-5xl font-bold mb-2" style="color: #EDEBFF;">🧠 AI Training Dashboard</h1>
      <p class="text-xl" style="color: #C6A7FF;">Monitor how Celestia learns from user feedback</p>
    </div>

    {#if loading}
      <div class="text-center py-20">
        <p class="text-2xl" style="color: #C6A7FF;">📊 Loading training data...</p>
      </div>
    {:else if error}
      <div class="p-8 rounded-lg" style="background-color: rgba(255, 78, 219, 0.1); border: 2px solid #FF4EDB;">
        <p class="text-xl" style="color: #FF4EDB;">❌ Error: {error}</p>
      </div>
    {:else if stats}
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <!-- Total Feedback -->
        <div class="p-8 rounded-lg" style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.2), rgba(255, 78, 219, 0.1)); border: 2px solid #7B61FF;">
          <p class="text-sm font-semibold mb-2" style="color: #C6A7FF;">Total Feedback Collected</p>
          <p class="text-4xl font-bold" style="color: #EDEBFF;">{stats.totalFeedback}</p>
          <p class="text-xs mt-2" style="color: #B3A9C7;">readings rated by users</p>
        </div>

        <!-- Average Rating -->
        <div class="p-8 rounded-lg" style="background: linear-gradient(135deg, rgba(77, 242, 176, 0.2), rgba(123, 97, 255, 0.1)); border: 2px solid #4DF2B0;">
          <p class="text-sm font-semibold mb-2" style="color: #C6A7FF;">Average Rating</p>
          <p class="text-4xl font-bold" style="color: {getRatingColor(stats.averageRating)};">{stats.averageRating.toFixed(2)}/5</p>
          <div class="mt-3 flex gap-1">
            {#each [1, 2, 3, 4, 5] as star}
              <span style="opacity: {star <= Math.round(stats.averageRating) ? 1 : 0.3};">⭐</span>
            {/each}
          </div>
        </div>

        <!-- Successful Patterns -->
        <div class="p-8 rounded-lg" style="background: linear-gradient(135deg, rgba(255, 200, 87, 0.2), rgba(123, 97, 255, 0.1)); border: 2px solid #FFC857;">
          <p class="text-sm font-semibold mb-2" style="color: #C6A7FF;">Successful Patterns</p>
          <p class="text-4xl font-bold" style="color: #FFC857;">{stats.successfulPatterns}</p>
          <p class="text-xs mt-2" style="color: #B3A9C7;">high-rated combinations</p>
        </div>

        <!-- Failed Patterns -->
        <div class="p-8 rounded-lg" style="background: linear-gradient(135deg, rgba(255, 78, 219, 0.2), rgba(123, 97, 255, 0.1)); border: 2px solid #FF4EDB;">
          <p class="text-sm font-semibold mb-2" style="color: #C6A7FF;">Failed Patterns</p>
          <p class="text-4xl font-bold" style="color: #FF4EDB;">{stats.failedPatterns}</p>
          <p class="text-xs mt-2" style="color: #B3A9C7;">low-rated combinations</p>
        </div>

        <!-- Card Combinations -->
        <div class="p-8 rounded-lg" style="background: linear-gradient(135deg, rgba(77, 242, 176, 0.2), rgba(255, 78, 219, 0.1)); border: 2px solid #4DF2B0;">
          <p class="text-sm font-semibold mb-2" style="color: #C6A7FF;">Unique Card Combos</p>
          <p class="text-4xl font-bold" style="color: #4DF2B0;">{stats.uniqueCardCombinations}</p>
          <p class="text-xs mt-2" style="color: #B3A9C7;">tracked combinations</p>
        </div>

        <!-- Tracked Themes -->
        <div class="p-8 rounded-lg" style="background: linear-gradient(135deg, rgba(255, 200, 87, 0.2), rgba(77, 242, 176, 0.1)); border: 2px solid #FFC857;">
          <p class="text-sm font-semibold mb-2" style="color: #C6A7FF;">Tracked Themes</p>
          <p class="text-4xl font-bold" style="color: #FFC857;">{stats.trackedThemes}</p>
          <p class="text-xs mt-2" style="color: #B3A9C7;">themes being monitored</p>
        </div>
      </div>

      <!-- Recommendations -->
      {#if recommendations && recommendations.recommendations.length > 0}
        <div class="p-8 rounded-lg" style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.15), rgba(255, 78, 219, 0.1)); border: 2px solid #7B61FF;">
          <h2 class="text-2xl font-bold mb-6" style="color: #EDEBFF;">💡 AI Improvement Recommendations</h2>
          <div class="space-y-4">
            {#each recommendations.recommendations as rec}
              <div class="p-4 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                <p style="color: #EDEBFF;">{rec}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Info Section -->
      <div class="mt-12 p-8 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border: 2px solid #7B61FF;">
        <h3 class="text-xl font-bold mb-4" style="color: #EDEBFF;">📈 How AI Training Works</h3>
        <ul class="space-y-3" style="color: #EDEBFF;">
          <li>✅ <strong>Feedback Collection:</strong> Users rate readings 1-5 stars</li>
          <li>✅ <strong>Pattern Recognition:</strong> System identifies successful card combinations and themes</li>
          <li>✅ <strong>Prompt Optimization:</strong> ChatGPT prompts are enhanced based on patterns</li>
          <li>✅ <strong>Continuous Learning:</strong> Each rating improves future readings</li>
          <li>✅ <strong>User Preferences:</strong> System learns what each zodiac sign prefers</li>
        </ul>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
