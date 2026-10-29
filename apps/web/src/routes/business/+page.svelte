<script lang="ts">
	import AuthShell from '#lib/ui/AuthShell.svelte';
</script>

<svelte:head><title>DETECK for business</title></svelte:head>

<AuthShell
	bubble="Manufacturers: share your records once, and anyone can check your medicines against them."
>
	<div>
		<h1 style="font-size: 32px">DETECK for business</h1>
		<p class="muted" style="margin-top: 6px">
			For pharmaceutical manufacturers, pharmacies, hospitals, distributors and the DETECK team.
		</p>
	</div>
	<a href="/business/sign-in" class="btn btn-primary btn-block">Sign in</a>
	<a href="/business/register" class="btn btn-block">Register a manufacturer</a>
	<a href="/business/register/pharmacy" class="btn btn-block"
		>Register a pharmacy, hospital or distributor</a
	>
	<div class="panel stack" style="--gap: 10px">
		<h3>How a manufacturer goes live</h3>
		<ol class="steps">
			<li>
				<span
					><strong>Register.</strong> Company details, NAFDAC certificate and the signed data-sharing
					agreement.</span
				>
			</li>
			<li><span><strong>Get approved.</strong> A DETECK reviewer checks your details.</span></li>
			<li>
				<span
					><strong>Add your data.</strong> Products, batches, serials, supply chain records and packaging
					photos.</span
				>
			</li>
			<li>
				<span
					><strong>Go live.</strong> A DETECK reviewer checks the data, then checks of your serials get
					real answers.</span
				>
			</li>
		</ol>
	</div>
	<p class="small muted">
		Checking a medicine needs no account, for anyone. A pharmacy account is for checking whole
		deliveries and confirming what you received. <a href="/check">Check a medicine</a>.
	</p>
</AuthShell>
