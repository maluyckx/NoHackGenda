<script lang="ts">
	import type * as pgp from '$lib/pgp';
	import { getPublicKey, store } from '$lib/store';

	const storeMetadata = store.metadata;

	let inviteUsername: string | undefined = undefined;
	let invitePublicKey: pgp.PublicKey | undefined = undefined;
</script>

{#if $storeMetadata !== undefined}
	<div>
		Contacts
		<div>
			{#if $storeMetadata.contacts.length === 0}
				No contact
			{:else}
				{#each $storeMetadata.contacts as contact}
					<div>
						{contact}
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<div>
		Invite
		{#if invitePublicKey === undefined}
			<form
				on:submit|preventDefault={async () => {
					if (inviteUsername === undefined || inviteUsername === $storeMetadata?.username) return;
					invitePublicKey = await getPublicKey({ username: inviteUsername });
				}}
				class="flex flex-col"
			>
				<label for="username">Username</label>
				<input
					type="text"
					name="username"
					id="username"
					class="rounded border-2  bg-slate-100"
					on:change={({ currentTarget }) => {
						inviteUsername = currentTarget.value;
					}}
				/>
				<button type="submit">Get public key</button>
			</form>
		{:else}
			<form
				on:submit|preventDefault={async () => {
					if (inviteUsername === undefined || invitePublicKey === undefined) return;
					await store.metadata.inviteContact({
						receiverUsername: inviteUsername,
						receiverPublicKey: invitePublicKey
					});
					inviteUsername = undefined;
					invitePublicKey = undefined;
				}}
				class="flex flex-col"
			>
				<div>
					<div class="flex flex-col gap-4 rounded bg-slate-200 p-4">
						<div>Identity</div>
						<div>
							<div>
								Username: {inviteUsername}
							</div>
							<div>
								Fingerprint: {invitePublicKey.getFingerprint()}
							</div>
							{#each invitePublicKey.getUserIDs() as userID}
								<div>
									{userID}
								</div>
							{/each}
						</div>
					</div>
				</div>
				<button type="submit">invite</button>
			</form>
		{/if}
	</div>
{/if}
