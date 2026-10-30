<script lang="ts">
	/** Small inline icon set (24px grid, stroke icons as in the artifacts). */
	type Name =
		| 'back'
		| 'chevron'
		| 'check'
		| 'alert'
		| 'info'
		| 'journey'
		| 'scan'
		| 'camera'
		| 'upload'
		| 'retry'
		| 'close'
		| 'question'
		| 'barcode'
		| 'search'
		| 'arrow'
		| 'bell'
		| 'globe'
		| 'signal'
		| 'play'
		| 'menu'
		| 'records'
		| 'tag'
		| 'eye'
		| 'eye-off'
		| 'factory'
		| 'truck'
		| 'plus'
		| 'store';
	let {
		name,
		size = 18,
		color = '#0B0B0F',
		stroke = 2.2
	}: { name: Name; size?: number; color?: string; stroke?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	style="flex: 0 0 auto"
>
	{#if name === 'back'}
		<path d="M15 6l-6 6 6 6" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" />
	{:else if name === 'chevron'}
		<path d="M9 6l6 6-6 6" />
	{:else if name === 'check'}
		<path d="M5 12.5l4.5 4.5L19 7.5" />
	{:else if name === 'alert'}
		<circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" />
	{:else if name === 'info'}
		<circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5h.01" />
	{:else if name === 'question'}
		<circle cx="12" cy="12" r="9" /><path
			d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 16.5h.01"
		/>
	{:else if name === 'journey'}
		<circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path
			d="M7 6h6a4 4 0 0 1 0 8H11a4 4 0 0 0 0 8h6"
		/>
	{:else if name === 'scan'}
		<path
			d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8"
		/>
	{:else if name === 'camera'}
		<path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
	{:else if name === 'upload'}
		<path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
	{:else if name === 'retry'}
		<path d="M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.4 2M18.5 9A7 7 0 0 0 6.1 7" />
	{:else if name === 'close'}
		<path d="M6 6l12 12M18 6L6 18" />
	{:else if name === 'barcode'}
		<path d="M4 6v12M7 6v12M10 6v12M14 6v12M17 6v12M20 6v12" />
	{:else if name === 'arrow'}
		<path d="M5 12h14M13 6l6 6-6 6" />
	{:else if name === 'bell'}
		<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
	{:else if name === 'globe'}
		<circle cx="12" cy="12" r="9" /><path
			d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"
		/>
	{:else if name === 'signal'}
		<path d="M5 19v-3M9.5 19v-6M14 19v-9M18.5 19V6" />
	{:else if name === 'play'}
		<path d="M8 5.5v13l10.5-6.5z" />
	{:else if name === 'menu'}
		<path d="M4 7h16M4 12h16M4 17h16" />
	{:else if name === 'records'}
		<path d="M6 3.5h9l3.5 3.5v13.5H6zM14.5 3.5V7.5H18.5M9 12h6M9 16h6" />
	{:else if name === 'tag'}
		<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z" /><circle cx="8.5" cy="8.5" r="1.5" />
	{:else if name === 'factory'}
		<path d="M3 21V9l6 4V9l6 4V5h6v16z" />
	{:else if name === 'truck'}
		<path d="M2 7h12v10H2zM14 10h4l4 4v3h-8z" /><circle cx="6" cy="18" r="1.6" /><circle
			cx="18"
			cy="18"
			r="1.6"
		/>
	{:else if name === 'store'}
		<path d="M4 10v10h16V10M3 10l2-6h14l2 6zM9 20v-6h6v6" />
	{:else if name === 'plus'}
		<path d="M12 5v14M5 12h14" />
	{:else if name === 'eye'}
		<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle
			cx="12"
			cy="12"
			r="3"
		/>
	{:else if name === 'eye-off'}
		<path
			d="M9.9 5.8A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.6 6.6C4 8.4 2.5 12 2.5 12S6 18.5 12 18.5a8.8 8.8 0 0 0 5.4-1.9"
		/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
	{/if}
</svg>
