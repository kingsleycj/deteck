<script lang="ts">
	import Upload from '#lib/ui/Upload.svelte';
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';

	import { fmt } from '#lib/i18n.ts';
	import { lagosToday } from '@deteck/core/dates.ts';

	let { data, form }: PageProps = $props();
	const t = $derived(data.t);
	const rp = $derived(t.report);
	const v = $derived((form?.values ?? {}) as Record<string, string | boolean | undefined>);
	const today = lagosToday();
</script>

<svelte:head>
	<title>{rp.metaTitle}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="shell shell-narrow">
	<header class="page-head">
		<a href={data.from ? `/r/${data.from}` : '/check'} class="back" aria-label={t.common.back}
			><Icon name="back" /></a
		>
		<h1 class="report-title">{rp.title}</h1>
	</header>

	<div class="hero-row" style="margin-top: 0">
		<div class="hero-mascot" style="flex-basis: 70px; width: 70px">
			<Mascot mood={form?.message ? 'concerned' : 'thinking'} />
		</div>
		<p class="bubble bubble-left" role={form?.message ? 'alert' : undefined}>
			{form?.message ?? rp.intro}
		</p>
	</div>

	<form method="post" enctype="multipart/form-data" class="stack" style="--gap: 14px">
		<input type="hidden" name="from" value={data.from} />
		<section class="card stack" style="--gap: 12px">
			<h2 style="font-size: 18px">{rp.medicine}</h2>
			{#if data.drug}
				<p>
					<strong>{data.drug}</strong>{#if data.maker}<span class="small muted"
							>&nbsp;· {data.maker}</span
						>{/if}
				</p>
				<input type="hidden" name="productDescription" value={data.drug} />
			{:else}
				<div class="field">
					<label for="productDescription">{rp.nameLabel}</label>
					<input
						id="productDescription"
						name="productDescription"
						required
						maxlength="200"
						value={v.productDescription ?? ''}
						placeholder={rp.namePlaceholder}
					/>
				</div>
			{/if}
			<Upload
				id="photos"
				name="photos"
				title={fmt(rp.photosLabel, { n: data.maxPhotos })}
				hint={rp.photosHelp}
				accept="image/*"
				multiple
			/>
		</section>

		<section class="card stack" style="--gap: 12px">
			<h2 style="font-size: 18px">{rp.where}</h2>
			<div class="field">
				<label for="placeName">{rp.place}</label>
				<input id="placeName" name="placeName" required maxlength="200" value={v.placeName ?? ''} />
			</div>
			<div class="field">
				<label for="state">{rp.state}</label>
				<select id="state" name="state">
					<option value="">{rp.chooseState}</option>
					{#each data.states as s (s)}<option value={s} selected={v.state === s}>{s}</option>{/each}
				</select>
			</div>
			<div class="field">
				<label for="town">{rp.town}</label>
				<input id="town" name="town" maxlength="100" value={v.town ?? ''} />
			</div>
			<div class="field">
				<label for="boughtOn">{rp.boughtOn}</label>
				<input id="boughtOn" name="boughtOn" type="date" max={today} value={v.boughtOn ?? ''} />
			</div>
			<div class="field">
				<label for="details">{rp.details}</label>
				<textarea id="details" name="details" maxlength="2000">{v.details ?? ''}</textarea>
			</div>
		</section>

		<section class="card stack" style="--gap: 12px">
			<h2 style="font-size: 18px">{rp.reach}</h2>
			<p class="small muted">{rp.reachNote}</p>
			<div class="field">
				<label for="contactName">{rp.name}</label>
				<input id="contactName" name="contactName" maxlength="120" value={v.contactName ?? ''} />
			</div>
			<div class="field">
				<label for="contactEmail">{rp.email}</label>
				<input
					id="contactEmail"
					name="contactEmail"
					type="email"
					maxlength="200"
					value={v.contactEmail ?? ''}
				/>
			</div>
			<div class="field">
				<label for="contactPhone">{rp.phone}</label>
				<input
					id="contactPhone"
					name="contactPhone"
					type="tel"
					maxlength="30"
					value={v.contactPhone ?? ''}
				/>
			</div>
		</section>

		<label class="option"
			><input type="checkbox" name="shareConsent" checked={v.shareConsent === true} />
			<span>{rp.consent}</span></label
		>
		<button class="btn btn-primary btn-block">{rp.submit}</button>
		<p class="footer-note">{rp.unwell}</p>
	</form>
	<SiteFooter />
</div>

<style>
	.report-title {
		font-size: 16px;
		letter-spacing: 0;
	}
</style>
