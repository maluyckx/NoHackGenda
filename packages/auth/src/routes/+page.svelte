<script lang="ts">
	import * as auth from '$lib/auth/index';

	import {
		email,
		mode,
		password,
		passwordError,
		username,
		usernameError,
		name,
		nameError,
		emailError
	} from '$lib/store';

	import * as loginValidation from '$lib/validation/login';
	import * as registerValidation from '$lib/validation/register';
	import { sj } from '$lib/utils/string';
	import type { Credentials, Identity } from '$lib/types/user';
	import { onDestroy } from 'svelte';

	mode.subscribe((value) => {
		if (value === 'login') {
			loginValidation.subscribe();
			registerValidation.unsubscribe();
		} else if (value === 'register') {
			registerValidation.subscribe();
			loginValidation.unsubscribe();
		}
	});

	let error: string | undefined = undefined;

	async function login() {
		loginValidation.usernameValidation($username);
		loginValidation.passwordValidation($password);

		if ($usernameError !== undefined || $passwordError !== undefined) return;

		const credentials: Credentials = {
			username: $username,
			password: $password
		};

		try {
			await auth.login(credentials);
		} catch (e) {
			const err = e as Error;
			error = err.message;
		}
	}

	async function register() {
		registerValidation.usernameValidation($username);
		registerValidation.passwordValidation($password);
		registerValidation.nameValidation($name, false);
		registerValidation.emailValidation($email, false);

		if (
			$usernameError !== undefined ||
			$passwordError !== undefined ||
			$nameError !== undefined ||
			$emailError !== undefined
		)
			return;

		const credentials: Credentials = {
			username: $username,
			password: $password
		};

		const currentName = $name === '' ? undefined : $name;
		const currentEmail = $email === '' ? undefined : $email;

		let identity: Identity | undefined = undefined;
		if (currentName !== undefined || currentEmail !== undefined) {
			identity = {
				name: currentName,
				email: currentEmail
			};
		}

		try {
			await auth.register(credentials, identity);
		} catch (e) {
			const err = e as Error;
			const message = err.message;
			if (/username/i.test(message)) {
				usernameError.set(message);
			} else {
				error = err.message;
			}
		}
	}

	let showPassword = false;
	let currentPassword: string = '';
	const unsubscribePassword = password.subscribe((value) => {
		currentPassword = value;
	});
	onDestroy(unsubscribePassword);
	function changePassword(value: string) {
		password.set(value);
	}
</script>

<form
	on:submit|preventDefault={() => {
		if ($mode === 'register') register();
		if ($mode === 'login') login();
	}}
	class="flex flex-col items-center justify-center gap-4"
>
	<div class="flex flex-col gap-4 rounded bg-slate-200 p-4">
		<div>
			<div>Username</div>
			<input
				type="text"
				bind:value={$username}
				class={sj([
					'rounded border-2  bg-slate-100',
					$usernameError !== undefined ? 'border-red-400' : ''
				])}
			/>
			{#if $usernameError}
				<div>{$usernameError}</div>
			{/if}
		</div>
		<div>
			<div>Password</div>
			<input
				type={showPassword ? 'text' : 'password'}
				value={currentPassword}
				on:change={({ currentTarget }) => changePassword(currentTarget.value)}
				class={sj([
					'rounded border-2  bg-slate-100',
					$passwordError !== undefined ? 'border-red-400' : ''
				])}
			/>
			<button type="button" on:click={() => (showPassword = !showPassword)}>show</button>
			{#if $passwordError}
				<div>{$passwordError}</div>
			{/if}
		</div>
	</div>

	{#if $mode === 'register'}
		<div class="flex flex-col gap-4 rounded bg-slate-200 p-4">
			<div>
				<h3>Public Identity</h3>
			</div>
			<div>
				<div>Name</div>
				<input
					type="text"
					bind:value={$name}
					class={sj([
						'rounded border-2  bg-slate-100',
						$nameError !== undefined ? 'border-red-400' : ''
					])}
				/>
				{#if $nameError}
					<div>{$nameError}</div>
				{/if}
			</div>
			<div>
				<div>Email</div>
				<input
					type="email"
					bind:value={$email}
					class={sj([
						'rounded border-2  bg-slate-100',
						$emailError !== undefined ? 'border-red-400' : ''
					])}
				/>
				{#if $emailError}
					<div>{$emailError}</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if error}
		<div>{error}</div>
	{/if}

	<div class="flex items-center justify-center">
		{#if $mode === 'login'}
			<button
				class="rounded bg-blue-500 px-2 py-1 text-slate-50 disabled:opacity-50"
				disabled={$usernameError !== undefined || $passwordError !== undefined}
				type="submit">Login</button
			>

			<button
				type="button"
				on:click={() => {
					$mode = 'register';
					error = undefined;
				}}>Register</button
			>
		{:else}
			<button
				class="rounded bg-blue-500 px-2 py-1 text-slate-50 disabled:opacity-50"
				disabled={$usernameError !== undefined ||
					$passwordError !== undefined ||
					$nameError !== undefined ||
					$emailError !== undefined}
				type="submit">Register</button
			>
			<button
				type="button"
				on:click={() => {
					$mode = 'login';
					error = undefined;
				}}>Login</button
			>
		{/if}
	</div>
</form>
