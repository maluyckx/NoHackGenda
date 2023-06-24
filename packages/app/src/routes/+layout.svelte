<script lang="ts">
	import '../styles/index.css';

	import { onMount } from 'svelte';
	import { store } from '$lib/store';
	import { base } from '$app/paths';
	const storeMetadata = store.metadata;

	let askPassword = false;
	onMount(async () => {
		const password = window.sessionStorage.getItem('password');
		window.sessionStorage.removeItem('password');

		if (password === null) {
			askPassword = true;
			return;
		}

		await load(password);
	});

	let showPassword = false;
	let userPassword: string = '';
	function changeUserPassword(value: string) {
		userPassword = value;
		error = undefined;
	}
	let error: string | undefined = undefined;
	async function load(password: string) {
		try {
			await storeMetadata.load({ password });
			askPassword = false;
		} catch (e) {
			const err = e as Error;
			error = err.message;
		}
	}
</script>

<div class="flex h-screen flex-col">
	<header class="flex h-16 justify-between bg-slate-400">
		<div />
		<div>
			<a href={`${base}/`}>nohackgenda</a>
		</div>
		<div class="flex flex-col items-end">
			<a href={`${base}/profile`}
				>Profile ({$storeMetadata?.username !== undefined
					? $storeMetadata?.username
					: 'not connected'})</a
			>
			<a href={`${base}/invitation`}>Invitation</a>
			<a href={`${base}/contact`}>Contacts</a>
		</div>
	</header>
	<main class="flex flex-grow flex-col items-center justify-center gap-4">
		{#if $storeMetadata !== undefined}
			<slot />
		{:else if askPassword}
			<form
				on:submit|preventDefault={async () => {
					await load(userPassword);
				}}
			>
				<label for="password">Password</label>
				<div>
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						value={userPassword}
						on:input={({ currentTarget }) => changeUserPassword(currentTarget.value)}
						class="rounded border-2  bg-slate-100"
					/>
					<button type="button" on:click={() => (showPassword = !showPassword)}>show</button>
				</div>
				<button on:click={() => load(userPassword)}>Load</button>
			</form>
		{:else}
			<div>Loading...</div>
		{/if}

		{#if error}
			<div>{error}</div>
		{/if}
	</main>
</div>
