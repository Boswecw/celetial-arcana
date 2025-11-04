<!-- @component
no description yet
-->
<script lang="ts">
  import { animate } from "motion";

  export let title: string;
  export let face: string; // image url
  export let reversed = false;

  let el: HTMLDivElement;

  function flip() {
    animate(el, { rotateY: [0, 180] }, { duration: 0.6 });
  }
</script>

<div
  bind:this={el}
  class="w-48 h-72 [perspective:1000px] cursor-pointer group"
  on:click={flip}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === "Enter" && flip()}
>
  <div
    class="relative w-full h-full transition-transform [transform-style:preserve-3d]"
  >
    <img
      src={face}
      alt={title}
      loading="lazy"
      class={`absolute inset-0 w-full h-full rounded-xl border-2 [backface-visibility:hidden] transition-all duration-300 ${reversed ? 'reversed-card-image' : ''}`}
      style="border-color: rgba(123, 97, 255, 0.5);"
      on:mouseenter={(e) => {
        e.currentTarget.style.borderColor = '#FF4EDB';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(255, 78, 219, 0.5)';
      }}
      on:mouseleave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(123, 97, 255, 0.5)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
    <div
      class="absolute inset-0 grid place-items-center rounded-xl [transform:rotateY(180deg)] [backface-visibility:hidden] font-semibold"
      style="background: linear-gradient(135deg, #7B61FF, #FF4EDB); color: #EDEBFF;"
    >
      Celestia Arcana
    </div>
  </div>
</div>

<style>
  :global([perspective]) {
    perspective: 1000px;
  }
</style>
