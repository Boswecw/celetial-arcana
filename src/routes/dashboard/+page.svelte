<script lang="ts">
  import { onMount } from 'svelte';

  let stats: any = null;
  let recommendations: string[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-stats' }),
      });

      if (response.ok) {
        const data = await response.json();
        stats = data.stats;
        recommendations = data.recommendations;
      } else {
        error = 'Failed to load stats';
      }
    } catch (err) {
      error = `Error: ${err}`;
    } finally {
      loading = false;
    }
  });

  function goHome() {
    window.location.href = '/';
  }
</script>

<div class="min-h-screen p-8" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-12">
      <h1 class="text-5xl font-bold mb-4" style="color: #C6A7FF;">
        🧠 AI Training Dashboard
      </h1>
      <p class="text-xl" style="color: #B3A9C7;">
        Monitor how the AI learns from your readings
      </p>
    </div>

    {#if loading}
      <div class="text-center py-20">
        <p class="text-2xl" style="color: #C6A7FF;">📊 Loading stats...</p>
      </div>
    {:else if error}
      <div class="p-6 rounded-lg text-lg" style="background-color: rgba(255, 78, 219, 0.1); border-left: 4px solid #FF4EDB; color: #EDEBFF;">
        {error}
      </div>
    {:else if stats}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <!-- Total Feedback -->
        <div class="card-surface p-8 rounded-2xl">
          <div class="text-5xl mb-4">📝</div>
          <h3 class="text-2xl font-bold mb-2" style="color: #C6A7FF;">Total Feedback</h3>
          <p class="text-4xl font-bold" style="color: #7B61FF;">{stats.totalFeedback}</p>
          <p class="text-sm mt-2" style="color: #B3A9C7;">readings rated</p>
        </div>

        <!-- Average Rating -->
        <div class="card-surface p-8 rounded-2xl">
          <div class="text-5xl mb-4">⭐</div>
          <h3 class="text-2xl font-bold mb-2" style="color: #C6A7FF;">Average Rating</h3>
          <p class="text-4xl font-bold" style="color: #7B61FF;">
            {stats.averageRating.toFixed(1)}/5
          </p>
          <p class="text-sm mt-2" style="color: #B3A9C7;">user satisfaction</p>
        </div>

        <!-- Successful Patterns -->
        <div class="card-surface p-8 rounded-2xl">
          <div class="text-5xl mb-4">✅</div>
          <h3 class="text-2xl font-bold mb-2" style="color: #C6A7FF;">Successful Patterns</h3>
          <p class="text-4xl font-bold" style="color: #7B61FF;">{stats.successfulPatterns}</p>
          <p class="text-sm mt-2" style="color: #B3A9C7;">learned patterns</p>
        </div>

        <!-- Failed Patterns -->
        <div class="card-surface p-8 rounded-2xl">
          <div class="text-5xl mb-4">⚠️</div>
          <h3 class="text-2xl font-bold mb-2" style="color: #C6A7FF;">Failed Patterns</h3>
          <p class="text-4xl font-bold" style="color: #FF4EDB;">{stats.failedPatterns}</p>
          <p class="text-sm mt-2" style="color: #B3A9C7;">patterns to avoid</p>
        </div>

        <!-- Card Combinations -->
        <div class="card-surface p-8 rounded-2xl">
          <div class="text-5xl mb-4">🃏</div>
          <h3 class="text-2xl font-bold mb-2" style="color: #C6A7FF;">Card Combos</h3>
          <p class="text-4xl font-bold" style="color: #7B61FF;">{stats.uniqueCardCombinations}</p>
          <p class="text-sm mt-2" style="color: #B3A9C7;">unique combinations</p>
        </div>

        <!-- Tracked Themes -->
        <div class="card-surface p-8 rounded-2xl">
          <div class="text-5xl mb-4">🎯</div>
          <h3 class="text-2xl font-bold mb-2" style="color: #C6A7FF;">Tracked Themes</h3>
          <p class="text-4xl font-bold" style="color: #7B61FF;">{stats.trackedThemes}</p>
          <p class="text-sm mt-2" style="color: #B3A9C7;">themes analyzed</p>
        </div>
      </div>

      <!-- Recommendations -->
      {#if recommendations.length > 0}
        <div class="card-surface p-8 rounded-2xl mb-12">
          <h2 class="text-3xl font-bold mb-6" style="color: #C6A7FF;">
            💡 AI Improvement Recommendations
          </h2>
          <div class="space-y-4">
            {#each recommendations as rec}
              <div class="p-4 rounded-lg" style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;">
                <p class="text-lg" style="color: #EDEBFF;">{rec}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Info Section -->
      <div class="card-surface p-8 rounded-2xl mb-12">
        <h2 class="text-3xl font-bold mb-6" style="color: #C6A7FF;">
          🔮 How It Works
        </h2>
        <div class="space-y-4 text-lg" style="color: #EDEBFF;">
          <p>
            <strong style="color: #C6A7FF;">📊 Data Collection:</strong> Every time you rate a reading, the AI learns from your feedback.
          </p>
          <p>
            <strong style="color: #C6A7FF;">🧠 Pattern Recognition:</strong> The system identifies which card combinations, themes, and interpretations work best.
          </p>
          <p>
            <strong style="color: #C6A7FF;">🎯 Personalization:</strong> Future readings are tailored based on what resonates with you and other users.
          </p>
          <p>
            <strong style="color: #C6A7FF;">✨ Continuous Improvement:</strong> The more feedback provided, the better the readings become.
          </p>
        </div>
      </div>
    {/if}

    <!-- Back Button -->
    <button
      on:click={goHome}
      class="px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200"
      style="background-color: #7B61FF; color: #EDEBFF;"
    >
      ← Back to Home
    </button>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  .card-surface {
    background: linear-gradient(135deg, rgba(123, 97, 255, 0.1), rgba(255, 78, 219, 0.05));
    border: 1px solid rgba(198, 167, 255, 0.2);
    box-shadow: 0 8px 32px rgba(123, 97, 255, 0.1);
  }
</style>

