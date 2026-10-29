<script lang="ts">
	interface Item {
		key: string;
		label: string;
		state: 'ok' | 'warn' | 'bad';
		detail?: string;
	}
	let { items }: { items: Item[] } = $props();
	const mark = { ok: '✓', warn: '!', bad: '✕' };
</script>

<ul class="checklist">
	{#each items as item (item.key)}
		<li class:warn={item.state === 'warn'} class:bad={item.state === 'bad'}>
			<span class="mark" aria-hidden="true">{mark[item.state]}</span>
			<span>
				<span class="visually-hidden"
					>{item.state === 'ok' ? 'Done:' : item.state === 'warn' ? 'Warning:' : 'Must fix:'}</span
				>
				{item.label}
				{#if item.detail}<br /><span class="small muted">{item.detail}</span>{/if}
			</span>
		</li>
	{/each}
</ul>
