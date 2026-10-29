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
		| 'barcode';
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
	{/if}
</svg>
