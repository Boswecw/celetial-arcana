<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  export let open = false;
  export let src = '/reading-animation.mp4';
  export let onClose: () => void = () => {};

  let videoElement: HTMLVideoElement | undefined;

  $: if (typeof document !== 'undefined') {
    if (open) {
      document.body.classList.add('video-popup-open');
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.muted = false;
        videoElement.volume = 1;
        videoElement.play().catch((err) => console.error('Video autoplay blocked:', err));
      }
    } else {
      document.body.classList.remove('video-popup-open');
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    }
  }

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }

  onMount(() => {
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('video-popup-open');
    }
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
    style="background-color: rgba(0, 0, 0, 0.95); pointer-events: auto; display: flex; top: 0; left: 0; right: 0; bottom: 0; padding: 2rem;"
    on:click={onClose}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="0"
  >
    <div
      class="relative w-full max-w-4xl mx-auto my-auto"
      on:click|stopPropagation
      role="presentation"
      style="pointer-events: auto; display: flex; flex-direction: column; align-items: center;"
    >
      <button
        on:click={onClose}
        class="absolute -top-12 right-0 text-white text-3xl font-bold hover:text-gray-300 transition-colors"
        aria-label="Close video"
        type="button"
        style="pointer-events: auto; z-index: 10000;"
      >
        ✕
      </button>

      <video
        bind:this={videoElement}
        {src}
        controls
        autoplay
        playsinline
        preload="none"
        on:ended={onClose}
        on:error={(e) => {
          const mediaError = (e.currentTarget as HTMLVideoElement)?.error;
          console.error('Video error:', mediaError ?? e);
        }}
        on:loadeddata={() => {
          if (videoElement) {
            videoElement.muted = false;
            videoElement.volume = 1;
          }
          videoElement?.play().catch((err) => console.error('Video play after load failed:', err));
        }}
        style="width: 100%; height: auto; max-height: 80vh; border-radius: 0.5rem; box-shadow: 0 0 50px rgba(123, 97, 255, 0.5); background-color: #000; pointer-events: auto; display: block;"
      >
        <track kind="captions" />
      </video>

      <div class="text-center mt-4 text-white">
        <p class="text-sm" style="color: #C6A7FF;">Press ESC or click outside to close</p>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body.video-popup-open) {
    overflow: hidden;
  }
</style>
