<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    // /dashboard and /admin/training rendered the same stats UI.
    // Keeping a single canonical page (the admin training dashboard).
    window.location.replace('/admin/training');
  });
</script>

<div class="min-h-screen flex items-center justify-center p-8" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
  <p class="text-xl" style="color: #C6A7FF;">Redirecting to the training dashboard…</p>
</div>
