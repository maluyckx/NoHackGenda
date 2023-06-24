<script lang="ts">
	import type { Invitation, InvitationContact, InvitationEvent } from '$lib/types/invitation';
	import * as pgp from '$lib/pgp';
	import { onMount } from 'svelte';
	import { store, getInvitations, deleteInvitation } from '$lib/store';

	let invitations: Invitation[] | undefined = undefined;
	onMount(async () => {
		await fetchInvitations();
	});

	async function fetchInvitations() {
		invitations = undefined;
		const res = await fetch('/api/user/me/invitation');
		if (res.redirected) {
			window.location.href = res.url;
			return;
		}
		if (!res.ok) throw new Error('Cannot load invitation');

		const texts = await res.json();

		invitations = await getInvitations({ texts });
	}

	async function acceptInvitationContact(invitation: Invitation) {
		await store.metadata.addContact({ username: (invitation as InvitationContact).username });
		await deleteInvitation({ receiverUsername: invitation.username });
		await fetchInvitations();
	}

	async function acceptInvitationEvent(invitation: Invitation) {
		await store.metadata.addEventAccess({
			eventAccess: (invitation as InvitationEvent).eventAccess,
			agendaIndex: 0
		});
		await deleteInvitation({ receiverUsername: invitation.username });
		await fetchInvitations();
	}
</script>

{#if invitations}
	<div>
		Invitation
		<div>
			{#if invitations === undefined || invitations.length === 0}
				<div>No invitation</div>
			{:else}
				{#each invitations as invitation}
					{#if invitation.type === 'contact'}
						<div>
							Contact: {invitation.username} ({#await pgp.parsePublicKey( { publicKeyArmored: invitation.publicKeyArmored } )}
								loading...
							{:then publicKey}
								{publicKey.getFingerprint()}
							{/await})
						</div>
						<button on:click={async () => acceptInvitationContact(invitation)}>Accept</button>
					{:else if invitation.type === 'event'}
						<div>
							Event: {invitation.eventAccess.id} from {invitation.username} ({#await pgp.parsePublicKey( { publicKeyArmored: invitation.publicKeyArmored } )}
								loading...
							{:then publicKey}
								{publicKey.getFingerprint()}
							{/await})
							<button on:click={async () => acceptInvitationEvent(invitation)}>Accept</button>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	</div>
{/if}
