<script lang="ts">
  export let text = '';

  let showTooltip = false;
</script>

<div class="tooltip-container">
  <button
    type="button"
    class="info-icon"
    on:mouseenter={() => showTooltip = true}
    on:mouseleave={() => showTooltip = false}
    on:focus={() => showTooltip = true}
    on:blur={() => showTooltip = false}
    aria-label="More information"
  >
    <span class="text-sm font-bold" style="color: #C6A7FF;">ℹ️</span>
  </button>

  {#if showTooltip && text}
    <div class="tooltip">
      {text}
    </div>
  {/if}
</div>

<style>
  .tooltip-container {
    position: relative;
    display: inline-block;
  }

  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(123, 97, 255, 0.2);
    border: 1px solid rgba(123, 97, 255, 0.4);
    cursor: help;
    transition: all 0.2s ease;
    position: relative;
  }

  .info-icon:hover {
    background: rgba(123, 97, 255, 0.3);
    border-color: rgba(255, 78, 219, 0.6);
    transform: scale(1.1);
  }

  .tooltip {
    position: absolute;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.4;
    color: white;

    /* Positioning - ABOVE the icon */
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%) translateZ(0);

    /* Styling for cosmic theme */
    background: linear-gradient(135deg, rgba(123, 97, 255, 0.98), rgba(255, 78, 219, 0.98));
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(123, 97, 255, 0.6);

    /* Prevent overflow */
    max-width: 320px;
    word-wrap: break-word;
    white-space: normal;

    /* Prevent blur - CRITICAL */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    backface-visibility: hidden;

    /* High z-index */
    z-index: 9999;

    /* Smooth appearance */
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;

    /* Ensure tooltip is pointer-events-none */
    pointer-events: none;
  }

  .tooltip-container:hover .tooltip,
  .info-icon:focus + .tooltip {
    opacity: 1;
    visibility: visible;
  }

  /* Arrow pointing down to the icon */
  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 8px solid transparent;
    border-top-color: rgba(123, 97, 255, 0.98);
  }

  /* Responsive adjustments for small screens */
  @media (max-width: 640px) {
    .tooltip {
      max-width: 250px;
      font-size: 13px;
      padding: 10px 14px;
    }
  }
</style>
