<script lang="ts">
  export let readingId: string;
  export let cards: string[];
  export let themes: string[];
  export let userZodiac: string | undefined;
  export let onFeedbackSubmitted: () => void = () => {};

  let rating = 0;
  let feedback = '';
  let submitted = false;
  let loading = false;

  async function submitFeedback() {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    loading = true;
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingId,
          rating,
          feedback,
          cards,
          themes,
          userZodiac,
        }),
      });

      if (response.ok) {
        submitted = true;
        onFeedbackSubmitted();
        setTimeout(() => {
          submitted = false;
          rating = 0;
          feedback = '';
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      loading = false;
    }
  }
</script>

<div class="card-surface p-8 rounded-2xl mt-8">
  <h3 class="text-2xl font-bold mb-6" style="color: #C6A7FF;">
    ✨ How was this reading?
  </h3>

  {#if submitted}
    <div class="text-center py-6">
      <p class="text-xl" style="color: #7B61FF;">
        Thank you! Your feedback helps us improve. 🙏
      </p>
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Rating Stars -->
      <div>
        <p class="text-lg font-semibold mb-4" style="color: #EDEBFF;">
          Rate this reading:
        </p>
        <div class="flex gap-4 justify-center">
          {#each [1, 2, 3, 4, 5] as star}
            <button
              on:click={() => (rating = star)}
              class="text-4xl transition-transform hover:scale-110"
              style="opacity: {rating >= star ? 1 : 0.3}; cursor: pointer;"
            >
              ⭐
            </button>
          {/each}
        </div>
        {#if rating > 0}
          <p class="text-center mt-2" style="color: #C6A7FF;">
            {rating === 1 && 'Not helpful'}
            {rating === 2 && 'Could be better'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very good'}
            {rating === 5 && 'Excellent!'}
          </p>
        {/if}
      </div>

      <!-- Feedback Text -->
      <div>
        <label for="feedback" class="block text-lg font-semibold mb-3" style="color: #EDEBFF;">
          Additional feedback (optional):
        </label>
        <textarea
          id="feedback"
          bind:value={feedback}
          placeholder="What resonated with you? What could be improved?"
          class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-lg"
          style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
          rows="3"
        ></textarea>
      </div>

      <!-- Submit Button -->
      <button
        on:click={submitFeedback}
        disabled={loading || rating === 0}
        class="w-full py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200"
        style="background-color: #7B61FF; color: #EDEBFF; opacity: {loading || rating === 0 ? 0.6 : 1}; cursor: {loading || rating === 0 ? 'not-allowed' : 'pointer'};"
      >
        {loading ? '📤 Submitting...' : '📤 Submit Feedback'}
      </button>
    </div>
  {/if}
</div>

<style>
  :global(button:disabled) {
    cursor: not-allowed;
  }
</style>

