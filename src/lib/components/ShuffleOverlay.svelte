<script lang="ts" context="module">
	import { celestiaArcanaCards } from '$lib/decks/celestia-arcana';

	export type ShuffleCard = {
		id: number;
		image: string;
		radius: number;
		duration: number;
		start: number;
		direction: 'normal' | 'reverse';
		delay: number;
	};

	function createSwirlCard(card: { image?: string }, index: number): ShuffleCard {
		const cardsPerRing = 13;
		const ring = Math.floor(index / cardsPerRing);
		const baseRadius = 160 + ring * 110;
		const radius = baseRadius + Math.random() * 60;
		const duration = 12 + ring * 3 + Math.random() * 4;
		const start = (360 / celestiaArcanaCards.length) * index + Math.random() * 15;
		const delay = -(Math.random() * duration);

		return {
			id: Date.now() + Math.random() + index,
			image: card.image ?? '',
			radius,
			duration,
			start,
			direction: ring % 2 === 0 ? 'normal' : 'reverse',
			delay
		};
	}

	// Module-level helper so callers can build the swirl deck without needing a
	// mounted component instance.
	export function buildShuffleCards(): ShuffleCard[] {
		const selectedCards = celestiaArcanaCards.slice(0, 20);
		return selectedCards.map((card, index) => createSwirlCard(card, index));
	}
</script>

<script lang="ts">
	export let visible = false;
	export let cards: ShuffleCard[] = [];
</script>

{#if visible}
	<div class="shuffle-overlay">
		<div class="shuffle-area">
			{#each cards as card (card.id)}
				<div
					class="shuffling-card"
					style={`background-image: url('${card.image}'); --radius: ${card.radius}px; --duration: ${card.duration}s; --start: ${card.start}deg; --direction: ${card.direction}; --delay: ${card.delay}s;`}
				></div>
			{/each}
		</div>
		<div class="shuffle-caption">
			<h1>✨ Celestia Arcana ✨</h1>
			<p>Drawing every card to weave your cosmic story...</p>
		</div>
	</div>
{/if}

<style>
	.shuffle-overlay {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: radial-gradient(circle at center, rgba(20, 15, 60, 0.95), rgba(5, 3, 20, 0.98));
		backdrop-filter: blur(8px) saturate(150%);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.shuffle-area {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.shuffling-card {
		position: absolute;
		top: 50%;
		left: 50%;
		width: clamp(60px, 15vw, 150px);
		aspect-ratio: 3 / 4;
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
		border-radius: clamp(0.375rem, 1vw, 0.75rem);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.7);
		pointer-events: none;
		transform-origin: center;
		opacity: 0.5;
		transform: translate(-50%, -50%) rotate(var(--start))
			translateX(calc(var(--radius) * var(--radius-scale, 1)));
		animation: swirlOrbit var(--duration) linear infinite;
		animation-direction: var(--direction, normal);
		animation-delay: var(--delay, 0s);
		animation-fill-mode: both;
		will-change: transform;
	}

	@media (max-width: 768px) {
		.shuffling-card {
			--radius-scale: 0.4;
			width: clamp(40px, 12vw, 80px);
			box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6);
		}

		.shuffle-caption h1 {
			font-size: clamp(1.5rem, 8vw, 2.5rem);
		}

		.shuffle-caption p {
			font-size: clamp(0.875rem, 3.5vw, 1.25rem);
			padding: 0 1rem;
		}
	}

	@media (max-width: 480px) {
		.shuffling-card {
			--radius-scale: 0.3;
			width: clamp(35px, 10vw, 60px);
		}
	}

	.shuffle-caption {
		position: relative;
		z-index: 1;
		text-align: center;
		color: #eae4ff;
		text-shadow: 0 0 18px rgba(123, 97, 255, 0.65);
		pointer-events: auto;
	}

	.shuffle-caption h1 {
		font-size: clamp(2.5rem, 6vw, 4rem);
		margin-bottom: 1rem;
	}

	.shuffle-caption p {
		font-size: clamp(1rem, 2vw, 1.5rem);
		color: #d7ceff;
	}

	@keyframes swirlOrbit {
		0% {
			transform: translate(-50%, -50%) rotate(var(--start))
				translateX(calc(var(--radius) * var(--radius-scale, 1)));
			opacity: 0.55;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -50%) rotate(calc(var(--start) + 360deg))
				translateX(calc(var(--radius) * var(--radius-scale, 1)));
			opacity: 0.55;
		}
	}
</style>
