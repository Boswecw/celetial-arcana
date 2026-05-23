<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';

	export let open = false;
	export let src = '/reading-animation.mp4';
	export let onClose: () => void = () => {};

	let videoElement: HTMLVideoElement | undefined;
	let dialogElement: HTMLDivElement | undefined;
	let closeButton: HTMLButtonElement | undefined;
	let previouslyFocused: HTMLElement | null = null;

	const FOCUSABLE_SELECTOR =
		'a[href], button:not([disabled]), textarea, input, select, video[controls], [tabindex]:not([tabindex="-1"])';

	function focusableElements(): HTMLElement[] {
		if (!dialogElement) return [];
		return Array.from(dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
	}

	$: if (typeof document !== 'undefined') {
		if (open) {
			document.body.classList.add('video-popup-open');
			if (videoElement) {
				videoElement.currentTime = 0;
				videoElement.muted = false;
				videoElement.volume = 1;
				videoElement.play().catch((err) => console.error('Video autoplay blocked:', err));
			}
			previouslyFocused = (document.activeElement as HTMLElement) ?? null;
			// Defer focus until the dialog has actually rendered.
			tick().then(() => {
				closeButton?.focus();
			});
		} else {
			document.body.classList.remove('video-popup-open');
			if (videoElement) {
				videoElement.pause();
				videoElement.currentTime = 0;
			}
			previouslyFocused?.focus?.();
			previouslyFocused = null;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			onClose();
			return;
		}
		if (e.key !== 'Tab') return;
		// Simple focus trap: cycle Tab / Shift+Tab through the dialog's
		// focusable elements so keyboard users can't escape into the backdrop.
		const focusables = focusableElements();
		if (focusables.length === 0) {
			e.preventDefault();
			return;
		}
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const active = document.activeElement as HTMLElement | null;
		if (e.shiftKey && active === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.body.classList.remove('video-popup-open');
		}
	});
</script>

{#if open}
	<div
		bind:this={dialogElement}
		class="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
		style="background-color: rgba(0, 0, 0, 0.95); pointer-events: auto; display: flex; top: 0; left: 0; right: 0; bottom: 0; padding: 2rem;"
		on:click={onClose}
		on:keydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		aria-label="Reading intro video"
		tabindex="-1"
	>
		<div
			class="relative w-full max-w-4xl mx-auto my-auto"
			on:click|stopPropagation
			role="presentation"
			style="pointer-events: auto; display: flex; flex-direction: column; align-items: center;"
		>
			<button
				bind:this={closeButton}
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
