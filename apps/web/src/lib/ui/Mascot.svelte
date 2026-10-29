<script lang="ts">
	/** The Deteck mascot from the brand artifacts. Only the active mood is rendered. */
	type Mood = 'wink' | 'happy' | 'thinking' | 'concerned';
	let {
		mood = 'wink',
		color = '#DCFC7E',
		decorative = true
	}: { mood?: Mood; color?: string; decorative?: boolean } = $props();

	const labels: Record<Mood, string> = {
		wink: 'Deteck winking and waving',
		happy: 'Deteck smiling',
		thinking: 'Deteck thinking',
		concerned: 'Deteck looking concerned'
	};
	const hand = '#C9EE5E';
</script>

<svg
	viewBox="0 0 200 232"
	role={decorative ? undefined : 'img'}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={decorative ? undefined : labels[mood]}
	class="mascot"
>
	<path
		d="M44 214 V104 A62 62 0 0 1 168 104 V214 Q168 228 154 228 H58 Q44 228 44 214 Z"
		fill={color}
	/>
	<path
		d="M73 108 L63 102 M147 108 L157 102"
		stroke="#0B0B0F"
		stroke-width="4.5"
		stroke-linecap="round"
	/>
	<circle
		cx="90"
		cy="112"
		r="17"
		fill="#FFFFFF"
		fill-opacity={mood === 'wink' ? 0 : 1}
		stroke="#0B0B0F"
		stroke-width="5"
	/>
	<circle
		cx="130"
		cy="112"
		r="17"
		fill="#FFFFFF"
		fill-opacity={mood === 'wink' ? 0 : 1}
		stroke="#0B0B0F"
		stroke-width="5"
	/>
	<path
		d="M107 109 Q110 104 113 109"
		stroke="#0B0B0F"
		stroke-width="4.5"
		fill="none"
		stroke-linecap="round"
	/>
	{#if mood === 'wink'}
		<path
			d="M81 115 Q90 106 99 115"
			stroke="#0B0B0F"
			stroke-width="4.5"
			fill="none"
			stroke-linecap="round"
		/>
		<circle cx="130" cy="113" r="10" fill="#FFFFFF" /><circle
			cx="131"
			cy="114"
			r="6.5"
			fill="#0B0B0F"
		/><circle cx="133.5" cy="111.5" r="2" fill="#FFFFFF" />
		<path
			d="M100 143 Q110 151 120 143"
			stroke="#0B0B0F"
			stroke-width="3.6"
			fill="none"
			stroke-linecap="round"
		/>
	{:else if mood === 'happy'}
		<circle cx="91" cy="113" r="6.5" fill="#0B0B0F" /><circle
			cx="93.5"
			cy="110.5"
			r="2"
			fill="#FFFFFF"
		/>
		<circle cx="131" cy="113" r="6.5" fill="#0B0B0F" /><circle
			cx="133.5"
			cy="110.5"
			r="2"
			fill="#FFFFFF"
		/>
		<path d="M96 140 Q110 158 124 140 Z" fill="#0B0B0F" />
	{:else if mood === 'thinking'}
		<circle cx="95" cy="106" r="6" fill="#0B0B0F" />
		<circle cx="135" cy="106" r="6" fill="#0B0B0F" />
		<path d="M102 146 H118" stroke="#0B0B0F" stroke-width="3.6" stroke-linecap="round" />
		<circle cx="176" cy="74" r="5" fill={color} /><circle
			cx="186"
			cy="58"
			r="7"
			fill={color}
		/><circle cx="194" cy="36" r="10" fill={color} />
	{:else}
		<path
			d="M76 86 L100 92 M144 86 L120 92"
			stroke="#0B0B0F"
			stroke-width="4.5"
			stroke-linecap="round"
		/>
		<circle cx="90" cy="114" r="6.5" fill="#0B0B0F" />
		<circle cx="130" cy="114" r="6.5" fill="#0B0B0F" />
		<path
			d="M100 148 Q110 142 120 148"
			stroke="#0B0B0F"
			stroke-width="3.6"
			fill="none"
			stroke-linecap="round"
		/>
	{/if}
	<circle cx="110" cy="132" r="3.4" fill="none" stroke="#0B0B0F" stroke-width="2.6" />
	{#if mood === 'wink' || mood === 'happy'}
		<rect
			x="16"
			y="104"
			width="13"
			height="42"
			rx="6.5"
			fill={hand}
			transform="rotate(-22 22 125)"
		/>
		<rect
			x="31"
			y="100"
			width="13"
			height="44"
			rx="6.5"
			fill={hand}
			transform="rotate(-6 37 122)"
		/>
		<circle cx="34" cy="152" r="16" fill={hand} />
	{/if}
</svg>

<style>
	.mascot {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
</style>
