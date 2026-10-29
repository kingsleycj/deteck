<script lang="ts">
	/** Shows a dictionary sentence, with its **marked** words in bold. */
	import { richParts } from '@deteck/core/messages/format.ts';

	let { text, tag = 'strong' }: { text: string; tag?: 'strong' | 'mark' } = $props();
</script>

{#each richParts(text) as part, i (i)}{#if part.bold}<svelte:element this={tag}
			>{part.text}</svelte:element
		>{:else}{part.text}{/if}{/each}
