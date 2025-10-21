<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from 'svelte';

  export let isOpen = false;
  export let videoSrc = '';
  export let onClose: () => void = () => {};

  let videoElement: HTMLVideoElement;

  onMount(() => {
    console.log('VideoPopup mounted');
    console.log('isOpen:', isOpen, 'videoSrc:', videoSrc);
    // Handle escape key to close
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePopup();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  function closePopup() {
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
    isOpen = false;
    onClose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      closePopup();
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    style="background-color: rgba(0, 0, 0, 0.9); pointer-events: auto;"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && closePopup()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Video Container -->
    <div class="relative w-full max-w-4xl mx-4" style="pointer-events: auto;">
      <!-- Close Button -->
      <button
        on:click={closePopup}
        class="absolute -top-12 right-0 text-white text-3xl font-bold hover:text-gray-300 transition-colors z-60"
        aria-label="Close video"
        style="pointer-events: auto;"
      >
        ✕
      </button>

      <!-- Video -->
      <video
        bind:this={videoElement}
        src={videoSrc}
        controls
        autoplay
        muted={false}
        class="w-full rounded-lg shadow-2xl block"
        style="box-shadow: 0 0 50px rgba(123, 97, 255, 0.5); background-color: #000; pointer-events: auto;"
      >
        <track kind="captions" />
      </video>

      <!-- Info Text -->
      <div class="text-center mt-4 text-white">
        <p class="text-sm" style="color: #C6A7FF;">
          Press ESC or click outside to close
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body.video-popup-open) {
    overflow: hidden;
  }
</style>

