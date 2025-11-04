<script lang="ts">
  import { fade, fly } from 'svelte/transition';

  export let message = '';
  export let visible = false;
  export let x = 0;
  export let y = 0;

  let adjustedX = x;
  let adjustedY = y;

  $: {
    // Constrain X position to prevent bleeding off screen
    const maxWidth = 320; // max-w-xs = 320px
    const margin = 16; // 16px margin from edges
    const halfWidth = maxWidth / 2;

    // Prevent toast from going off the left edge
    if (x - halfWidth < margin) {
      adjustedX = halfWidth + margin;
    }
    // Prevent toast from going off the right edge
    else if (x + halfWidth > window.innerWidth - margin) {
      adjustedX = window.innerWidth - halfWidth - margin;
    }
    else {
      adjustedX = x;
    }

    // Ensure toast doesn't go off the top
    if (y < 100) {
      adjustedY = Math.max(y + 80, 100);
    } else {
      adjustedY = y;
    }
  }
</script>

{#if visible && message}
  <div
    class="fixed z-50 pointer-events-none"
    style="left: {adjustedX}px; top: {adjustedY}px; transform: translate(-50%, -120%);"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="toast-container px-4 py-3 rounded-lg shadow-xl max-w-xs"
      style="
        background: linear-gradient(135deg, rgba(123, 97, 255, 0.95), rgba(255, 78, 219, 0.95));
        border: 2px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 8px 32px rgba(123, 97, 255, 0.5);
        backdrop-filter: blur(10px);
      "
      transition:fly={{ y: 10, duration: 300 }}
    >
      <p class="text-sm font-medium text-white text-center leading-relaxed">
        {message}
      </p>
    </div>
  </div>
{/if}

<style>
  .toast-container {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 8px 32px rgba(123, 97, 255, 0.5);
    }
    50% {
      box-shadow: 0 8px 32px rgba(255, 78, 219, 0.6);
    }
  }
</style>
