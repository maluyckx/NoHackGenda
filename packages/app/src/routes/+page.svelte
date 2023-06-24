<script lang="ts">
	import { getPublicKey, store } from '$lib/store';
	import { sj } from '$lib/utils/string';
	import type * as pgp from '$lib/pgp';

	const storeMetadata = store.metadata;
	const storeEvent = store.event;
	const lastSavedMetadata = storeMetadata.lastSaved;
	const lastSavedEvent = storeEvent.lastSaved;

	let currentAgendaIndex: number | undefined = undefined;
	let agendaEdit = false;

	function addAgenda() {
		if ($storeMetadata === undefined) return;
		storeMetadata.addAgenda({ properties: { name: 'new agenda' } });
		currentAgendaIndex = $storeMetadata.agendas.length - 1;
		agendaEdit = true;
	}

	function addEvent() {
		if (currentAgendaIndex === undefined) return;
		storeMetadata.addEvent({
			agendaIndex: currentAgendaIndex,
			properties: {
				name: 'new event',
				description: '',
				location: '',
				time: {
					begin: new Date().toISOString(),
					end: new Date(new Date().getTime() + 1000 /*ms*/ * 60 /*s*/ * 60 /*m*/).toISOString()
				}
			}
		});
	}

	let inviteUsername: string | undefined = undefined;
	let invitePublicKey: pgp.PublicKey | undefined = undefined;

	function deleteEvent() {
		if (currentAgendaIndex === undefined) return;
		storeMetadata.deleteEvent({ agendaIndex: currentAgendaIndex });
	}
</script>

{#if $storeMetadata === undefined}
	<div>Loading...</div>
{:else}
	<div class="flex h-full w-full flex-col">
		<div class="flex h-12 flex-none items-center justify-center bg-slate-300">
			<h1>
				{#if agendaEdit && currentAgendaIndex !== undefined}
					<input
						type="text"
						value={$storeMetadata.agendas[currentAgendaIndex].name}
						minlength="1"
						on:change={({ currentTarget }) => {
							if (currentAgendaIndex === undefined) return;
							storeMetadata.updateAgendaProperties({
								agendaIndex: currentAgendaIndex,
								properties: {
									name: currentTarget.value
								}
							});
						}}
					/>
					<button on:click={() => (agendaEdit = false)}>close</button>
				{:else}
					<select bind:value={currentAgendaIndex}>
						{#each $storeMetadata.agendas as agenda, a}
							<option value={a}>
								{agenda.name}
							</option>
						{/each}
					</select>
					<button on:click={() => (agendaEdit = true)}>edit</button>
					<button on:click={addAgenda}>add</button>
				{/if}
			</h1>
		</div>
		<div class="flex h-full flex-grow">
			<div class="flex w-36 flex-none flex-col bg-slate-200 p-1">
				<div class="flex flex-grow flex-col items-center">
					{#if currentAgendaIndex !== undefined}
						{#each $storeMetadata.agendas[currentAgendaIndex].events as eventAccess}
							<button
								on:click={() => {
									storeEvent.load({ id: eventAccess.id });
								}}
								class={sj([
									'h-10 w-full truncate rounded border-2 bg-slate-300 px-2 py-0.5',
									$storeEvent !== undefined && eventAccess.id === $storeEvent.id
										? 'opacity-100'
										: 'opacity-60'
								])}
							>
								<p>
									{eventAccess.id}
								</p>
							</button>
						{/each}
						<button on:click={addEvent}>add</button>
					{/if}
				</div>
				<div class="flex flex-none justify-center">
					<button
						on:click={() => {
							storeMetadata.save();
						}}
						disabled={$storeMetadata === undefined}
						class="text-xs opacity-40 disabled:opacity-20"
					>
						{#if $lastSavedMetadata.date === undefined}
							Never saved
						{:else}
							Last saved: {$lastSavedMetadata.date.toLocaleTimeString()}
						{/if}

						{#if $lastSavedMetadata.error}
							(error)
						{/if}
					</button>
				</div>
			</div>
			<div class="flex flex-grow items-center justify-center bg-slate-50">
				{#if $storeEvent !== undefined}
					<div class="flex flex-col items-center justify-center gap-2">
						<div class="inline-flex items-center gap-2">
							<div>Name:</div>
							<input
								type="text"
								value={$storeEvent.name}
								class="rounded border-2  bg-slate-100"
								minlength="1"
								disabled={$storeMetadata.username !== $storeEvent.owner}
								on:change={({ currentTarget }) => {
									if ($storeEvent === undefined) return;
									storeEvent.updateProperties({
										properties: {
											name: currentTarget.value
										}
									});
								}}
							/>
						</div>
						<div class="inline-flex items-center gap-2">
							<div>Description:</div>
							<input
								type="text"
								value={$storeEvent.description}
								class="rounded border-2  bg-slate-100"
								disabled={$storeMetadata.username !== $storeEvent.owner}
								on:change={({ currentTarget }) => {
									if ($storeEvent === undefined) return;
									storeEvent.updateProperties({
										properties: {
											description: currentTarget.value
										}
									});
								}}
							/>
						</div>
						<div class="inline-flex items-center gap-2">
							<div>Location:</div>
							<input
								type="text"
								value={$storeEvent.location}
								class="rounded border-2  bg-slate-100"
								disabled={$storeMetadata.username !== $storeEvent.owner}
								on:change={({ currentTarget }) => {
									if ($storeEvent === undefined) return;
									storeEvent.updateProperties({
										properties: {
											location: currentTarget.value
										}
									});
								}}
							/>
						</div>
						<div class="inline-flex items-center gap-2">
							<div>
								Owner:<input
									type="text"
									disabled
									value={$storeEvent.owner}
									class="rounded border-2  bg-slate-100"
								/>
							</div>
						</div>

						<div class="inline-flex items-center gap-2">
							<div>Begin:</div>
							<input
								type="datetime-local"
								value={new Date(
									new Date($storeEvent.time.begin).getTime() -
										new Date().getTimezoneOffset() * 60000
								)
									.toISOString()
									.slice(0, 16)}
								class="rounded border-2  bg-slate-100"
								min={new Date().toISOString().slice(0, 16)}
								disabled={$storeMetadata.username !== $storeEvent.owner}
								on:change={({ currentTarget }) => {
									if ($storeEvent === undefined) return;
									storeEvent.updateProperties({
										properties: {
											time: {
												...$storeEvent.time,
												begin: new Date(currentTarget.value).toISOString()
											}
										}
									});
								}}
							/>
							<div>GMT</div>
						</div>
						<div class="inline-flex items-center gap-2">
							<div>End:</div>
							<input
								type="datetime-local"
								value={new Date(
									new Date($storeEvent.time.end).getTime() +
										1000 /*ms*/ * 60 /*s*/ * 60 /*m*/ * 1 /*h*/ -
										new Date().getTimezoneOffset() * 60000
								)
									.toISOString()
									.slice(0, 16)}
								class="rounded border-2  bg-slate-100"
								min={new Date(
									new Date($storeEvent.time.end).getTime() +
										1000 /*ms*/ * 60 /*s*/ * 60 /*m*/ * 2 /*h*/ -
										new Date().getTimezoneOffset() * 60000
								)
									.toISOString()
									.slice(0, 16)}
								disabled={$storeMetadata.username !== $storeEvent.owner}
								on:change={({ currentTarget }) => {
									if ($storeEvent === undefined) return;
									storeEvent.updateProperties({
										properties: {
											time: {
												...$storeEvent.time,
												end: new Date(currentTarget.value).toISOString()
											}
										}
									});
								}}
							/>
							<div>GMT</div>
						</div>

						<div class="inline-flex items-center gap-2">
							<div>
								Participants: {$storeEvent.attendees.length > 0
									? $storeEvent.attendees.join(', ')
									: 'none'}
							</div>
						</div>

						<div>
							Invite
							{#if invitePublicKey === undefined}
								<form
									on:submit|preventDefault={async () => {
										if (inviteUsername === undefined || inviteUsername === $storeMetadata?.username)
											return;
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
										await store.event.invite({
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

						<div>
							<button on:click={deleteEvent}>Delete</button>
						</div>
						<div class="flex flex-none justify-center">
							<button
								on:click={() => {
									storeEvent.save();
								}}
								disabled={$storeEvent === undefined}
								class="text-xs opacity-40 disabled:opacity-20"
							>
								{#if $lastSavedEvent.date === undefined}
									Never saved
								{:else}
									Last saved: {$lastSavedEvent.date.toLocaleTimeString()}
								{/if}

								{#if $lastSavedEvent.error}
									(error)
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
