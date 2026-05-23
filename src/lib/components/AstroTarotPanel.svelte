<script lang="ts">
	export let astroTarot: any;
</script>

{#if astroTarot}
	<div
		class="p-8 rounded-xl mb-8"
		style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.15), rgba(255, 78, 219, 0.1)); border: 2px solid #7B61FF; box-shadow: 0 10px 30px rgba(123, 97, 255, 0.2);"
	>
		<h3 class="text-3xl font-bold mb-6 flex items-center gap-2" style="color: #FF4EDB;">
			<span>🌙</span> Astro-Tarot Synthesis
		</h3>

		{#if astroTarot.interpretation?.theme}
			<div
				class="mb-6 p-4 rounded-lg"
				style="background-color: rgba(198, 167, 255, 0.1); border-left: 4px solid #C6A7FF;"
			>
				<p class="text-lg font-semibold mb-2" style="color: #C6A7FF;">Theme</p>
				<p class="text-base" style="color: #EDEBFF;">{astroTarot.interpretation.theme}</p>
			</div>
		{/if}

		{#if astroTarot.astro_summary?.themes}
			<div
				class="mb-6 p-4 rounded-lg"
				style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;"
			>
				<p class="text-lg font-semibold mb-3" style="color: #C6A7FF;">Astrological Themes</p>
				<div class="space-y-2">
					{#each astroTarot.astro_summary.themes as theme}
						<p style="color: #EDEBFF;">• {theme}</p>
					{/each}
				</div>
			</div>
		{/if}

		{#if astroTarot.resonance?.matches?.length}
			<div
				class="mb-6 p-4 rounded-lg"
				style="background-color: rgba(77, 242, 176, 0.1); border-left: 4px solid #4DF2B0;"
			>
				<p class="text-lg font-semibold mb-3" style="color: #4DF2B0;">Harmonies & Matches</p>
				<div class="space-y-3">
					{#each astroTarot.resonance.matches as match}
						<div>
							<p class="font-semibold" style="color: #EDEBFF;">{match.type}</p>
							<p style="color: #EDEBFF;">{match.detail}</p>
							<p class="text-sm italic" style="color: #C6A7FF;">Why: {match.why}</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if astroTarot.resonance?.tensions?.length}
			<div
				class="mb-6 p-4 rounded-lg"
				style="background-color: rgba(255, 107, 107, 0.1); border-left: 4px solid #FF6B6B;"
			>
				<p class="text-lg font-semibold mb-3" style="color: #FF6B6B;">Tensions & Challenges</p>
				<div class="space-y-3">
					{#each astroTarot.resonance.tensions as tension}
						<div>
							<p class="font-semibold" style="color: #EDEBFF;">{tension.type}</p>
							<p style="color: #EDEBFF;">{tension.detail}</p>
							<p class="text-sm italic" style="color: #C6A7FF;">Why: {tension.why}</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if astroTarot.interpretation?.action_items?.length}
			<div
				class="mb-6 p-4 rounded-lg"
				style="background-color: rgba(255, 200, 87, 0.1); border-left: 4px solid #FFC857;"
			>
				<p class="text-lg font-semibold mb-3" style="color: #FFC857;">🎯 Action Items</p>
				<div class="space-y-2">
					{#each astroTarot.interpretation.action_items as action}
						<p style="color: #EDEBFF;">✓ {action}</p>
					{/each}
				</div>
			</div>
		{/if}

		{#if astroTarot.interpretation?.affirmations?.length}
			<div
				class="mb-6 p-4 rounded-lg"
				style="background-color: rgba(198, 167, 255, 0.1); border-left: 4px solid #C6A7FF;"
			>
				<p class="text-lg font-semibold mb-3" style="color: #C6A7FF;">💫 Affirmations</p>
				<div class="space-y-2">
					{#each astroTarot.interpretation.affirmations as affirmation}
						<p style="color: #EDEBFF;">✨ {affirmation}</p>
					{/each}
				</div>
			</div>
		{/if}

		{#if astroTarot.confidence}
			<div
				class="p-4 rounded-lg"
				style="background-color: rgba(123, 97, 255, 0.1); border-left: 4px solid #7B61FF;"
			>
				<p class="text-lg font-semibold mb-2" style="color: #C6A7FF;">Confidence</p>
				<p style="color: #EDEBFF;">Overall: {(astroTarot.confidence.overall * 100).toFixed(0)}%</p>
				{#if astroTarot.confidence.notes}
					<p class="text-sm mt-2" style="color: #C6A7FF;">{astroTarot.confidence.notes}</p>
				{/if}
			</div>
		{/if}
	</div>
{/if}
