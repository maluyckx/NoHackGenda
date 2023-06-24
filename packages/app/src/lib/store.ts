import { writable } from 'svelte/store';
import {
	type MetadataAgendaProperties,
	type Metadata,
	type MetadataEventAccess,
	parseMetadata
} from '$lib/types/metadata';
import * as pgp from './pgp';
import { type EventId, type Event, type EventProperties, parseEvent } from './types/event';
import { hashPassword, hashUsername, isValidKeyPair } from './crypto';
import {
	parseInvitation,
	type Invitation,
	type InvitationContact,
	type InvitationEvent
} from './types/invitation';

let privateKey: pgp.PrivateKey | undefined = undefined;
let publicKey: pgp.PublicKey | undefined = undefined;

export const store = (() => {
	// METADATA
	const metadata = writable<Metadata | undefined>(undefined);
	const lastSavedMetadata = writable<{ error: boolean; date?: Date }>({ error: false });

	let metadataCurrentState: Metadata | undefined = undefined;
	let saveOnStoreMetadataChangeTimer: ReturnType<typeof setTimeout> | undefined = undefined;
	metadata.subscribe((metadata) => {
		if (metadataCurrentState !== undefined) {
			if (metadata === undefined) return;
			if (saveOnStoreMetadataChangeTimer !== undefined) {
				clearTimeout(saveOnStoreMetadataChangeTimer);
			}
			saveOnStoreMetadataChangeTimer = setTimeout(
				async () => await saveLocalMetadata(metadata),
				5000
			);
		}
		metadataCurrentState = metadata;
	});

	async function saveLocalMetadata(metadata: Metadata) {
		try {
			await saveRemoteMetadata({ metadata });
			lastSavedMetadata.set({
				error: false,
				date: new Date()
			});
		} catch (error) {
			lastSavedMetadata.update((lastSaved) => {
				lastSaved.error = true;
				return lastSaved;
			});
		}
	}

	function getUsername() {
		return metadataCurrentState?.username;
	}

	function getEventAccess({ id }: { id: EventId }) {
		if (metadataCurrentState === undefined) return;
		let event: MetadataEventAccess | undefined = undefined;
		let a = 0;
		while (event === undefined && a < metadataCurrentState.agendas.length) {
			let e = 0;
			const ag = metadataCurrentState.agendas[a];
			while (event === undefined && e < ag.events.length) {
				const ev = ag.events[e];
				if (ev.id === id) {
					event = ev;
				}
				e++;
			}
			a++;
		}
		return event;
	}

	// EVENT

	const event = writable<Event | undefined>(undefined);
	const lastSavedEvent = writable<{ error: boolean; date?: Date }>({ error: false });

	let eventCurrentState: Event | undefined = undefined;
	const currentEventId = writable<EventId | undefined>(undefined);

	let saveOnStoreEventChangeTimer: ReturnType<typeof setTimeout> | undefined = undefined;
	event.subscribe((event) => {
		if (eventCurrentState !== undefined) {
			if (event === undefined) return;

			if (saveOnStoreEventChangeTimer !== undefined) {
				clearTimeout(saveOnStoreEventChangeTimer);
			}
			saveOnStoreEventChangeTimer = setTimeout(() => saveLocalEvent(event), 5000);
		}
		eventCurrentState = event;
	});

	currentEventId.subscribe(async (eventId) => {
		if (eventCurrentState === undefined) return;

		if (saveOnStoreEventChangeTimer !== undefined) {
			clearTimeout(saveOnStoreEventChangeTimer);
		}

		await saveLocalEvent(eventCurrentState);

		if (eventId === undefined) {
			lastSavedEvent.set({
				error: false
			});
			event.set(undefined);
		} else {
			lastSavedEvent.set({
				error: false
			});
			await loadEvent({ id: eventId });
		}
	});

	async function saveLocalEvent(event: Event) {
		const eventAccess = getEventAccess({ id: event.id });
		if (eventAccess === undefined) return;

		const username = getUsername();
		if (username === undefined) return;

		try {
			await saveRemoteEvent({ event, username, password: eventAccess.password });
			lastSavedEvent.set({
				error: false,
				date: new Date()
			});
		} catch (error) {
			lastSavedEvent.update((lastSaved) => {
				lastSaved.error = true;
				return lastSaved;
			});
		}
	}

	async function loadEvent({ id }: { id: EventId }) {
		const eventAccess = getEventAccess({ id });
		if (eventAccess === undefined) return;

		const username = getUsername();
		if (username === undefined) return;

		const password = eventAccess.password;
		const owner = eventAccess.owner;
		const passwordHashed = await hashPassword(owner, password);

		const res = await fetch(`/api/event/${id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				passwordHashed
			})
		});
		if (res.redirected) {
			window.location.href = res.url;
			return;
		}
		if (res.status === 404) {
			// TODO delete from metatdata ?
		}
		if (!res.ok) throw new Error('Cannot load event');
		try {
			const text = await res.text();
			const decryptedEvent = await pgp.decryptSymetric({
				armoredMessage: text,
				password
			});

			const parsedEvent: Event = parseEvent(decryptedEvent);

			event.set(parsedEvent);
		} catch (error) {
			throw new Error('Cannot load event');
		}
	}

	return {
		metadata: {
			subscribe: metadata.subscribe,
			load: async ({ password }: { password: string }) => {
				if (
					privateKey !== undefined &&
					publicKey !== undefined &&
					metadataCurrentState !== undefined
				)
					return;

				try {
					privateKey = await loadPrivateKey(password);
					if (privateKey === undefined) throw new Error();
					publicKey = await loadPublicKey(privateKey);
					if (publicKey === undefined) throw new Error();
					metadata.set(await loadMetadata(privateKey));
				} catch (e) {
					const err = e as Error;
					privateKey = undefined;
					publicKey = undefined;
					metadata.set(undefined);
					throw new Error(err.message);
				}
			},
			lastSaved: {
				subscribe: lastSavedMetadata.subscribe
			},
			addAgenda: ({ properties }: { properties: MetadataAgendaProperties }) => {
				metadata.update((metadata) => {
					if (metadata === undefined) return undefined;
					metadata.agendas.push({ ...properties, events: [] });
					return metadata;
				});
			},
			updateAgendaProperties: ({
				agendaIndex,
				properties
			}: {
				agendaIndex: number;
				properties: Partial<MetadataAgendaProperties>;
			}) => {
				metadata.update((metadata) => {
					if (metadata === undefined) return undefined;
					metadata.agendas[agendaIndex] = { ...metadata.agendas[agendaIndex], ...properties };
					return metadata;
				});
			},
			save: async () => {
				if (metadataCurrentState === undefined) return;
				await saveLocalMetadata(metadataCurrentState);
			},
			addEvent: async ({
				agendaIndex,
				properties
			}: {
				agendaIndex: number;
				properties: EventProperties;
			}) => {
				if (publicKey === undefined) return;

				const username = getUsername();
				if (username === undefined) return;

				const id = crypto.randomUUID();
				const array = new Uint32Array(3);
				const password = crypto.getRandomValues(array).toString(); // TODO check security
				const passwordHashed = await hashPassword(username, password);

				const eventAccess: MetadataEventAccess = {
					id,
					owner: username,
					password
				};

				const event: Event = {
					...properties,
					id,
					owner: username,
					attendees: []
				};

				const eventEncryptedSigned = await pgp.encryptAndSignSymetric({
					text: JSON.stringify(event),
					publicKey,
					password
				});

				const res = await fetch('/api/event', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						id,
						passwordHashed,
						eventEncryptedSigned
					})
				});
				if (res.redirected) {
					window.location.href = res.url;
					return;
				}
				if (!res.ok) throw new Error(await res.text());

				metadata.update((metadata) => {
					if (metadata === undefined) return;
					metadata.agendas[agendaIndex].events.push(eventAccess);
					return metadata;
				});

				loadEvent({ id });
			},
			deleteEvent: async ({ agendaIndex }: { agendaIndex: number }) => {
				if (eventCurrentState === undefined) return;
				const id = eventCurrentState.id;

				const eventAccess = getEventAccess({ id });
				if (eventAccess === undefined) return;

				const username = getUsername();
				if (username === undefined) return;

				const passwordHashed = await hashPassword(username, eventAccess.password);

				const res = await fetch('/api/event', {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						id,
						passwordHashed
					})
				});
				if (res.redirected) {
					window.location.href = res.url;
					return;
				}
				if (!res.ok) throw new Error(await res.text());

				metadata.update((metadata) => {
					if (metadata === undefined) return;
					metadata.agendas[agendaIndex].events = metadata.agendas[agendaIndex].events.filter(
						(event) => event.id !== id
					);
					return metadata;
				});
				event.set(undefined);
			},
			inviteContact: async ({
				receiverUsername,
				receiverPublicKey
			}: {
				receiverUsername: string;
				receiverPublicKey: pgp.PublicKey;
			}) => {
				if (
					privateKey === undefined ||
					publicKey === undefined ||
					metadataCurrentState === undefined
				)
					return;

				const invitation: InvitationContact = {
					type: 'contact',
					username: metadataCurrentState.username,
					publicKeyArmored: publicKey.armor()
				};

				const invitationEncryptedSigned = await pgp.encryptAndSignAsymetric({
					text: JSON.stringify(invitation),
					encryptionKey: receiverPublicKey,
					signingKey: privateKey
				});

				const receiverUsernameHashed = await hashUsername(receiverUsername);

				const res = await fetch('/api/user/me/invitation', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						receiverUsernameHashed,
						invitationEncryptedSigned
					})
				});
				if (res.redirected) {
					window.location.href = res.url;
					return;
				}
				if (!res.ok) throw new Error('Cannot invite');

				metadata.update((metadata) => {
					if (metadata === undefined) return;
					metadata.contacts.push(receiverUsername);
					return metadata;
				});
			},
			addContact: async ({ username }: { username: string }) => {
				metadata.update((metadata) => {
					if (metadata === undefined) return;
					metadata.contacts.push(username);
					return metadata;
				});
			},
			addEventAccess: async ({
				eventAccess,
				agendaIndex
			}: {
				eventAccess: MetadataEventAccess;
				agendaIndex: number;
			}) => {
				metadata.update((metadata) => {
					if (metadata === undefined) return;
					metadata.agendas[agendaIndex].events.push(eventAccess);
					return metadata;
				});
			}
		},
		event: {
			subscribe: event.subscribe,
			load: loadEvent,
			lastSaved: {
				subscribe: lastSavedEvent.subscribe
			},
			updateProperties: ({ properties }: { properties: Partial<EventProperties> }) => {
				event.update((event) => {
					if (event === undefined) return;
					event = {
						...event,
						...properties
					};
					return event;
				});
			},
			save: async () => {
				if (eventCurrentState === undefined) return;
				await saveLocalEvent(eventCurrentState);
			},
			invite: async ({
				receiverUsername,
				receiverPublicKey
			}: {
				receiverUsername: string;
				receiverPublicKey: pgp.PublicKey;
			}) => {
				if (
					privateKey === undefined ||
					publicKey === undefined ||
					metadataCurrentState === undefined ||
					eventCurrentState === undefined
				)
					return;

				const eventAccess = getEventAccess({ id: eventCurrentState.id });

				if (eventAccess === undefined) return;

				const invitation: InvitationEvent = {
					type: 'event',
					username: metadataCurrentState.username,
					publicKeyArmored: publicKey.armor(),
					eventAccess
				};

				const invitationEncryptedSigned = await pgp.encryptAndSignAsymetric({
					text: JSON.stringify(invitation),
					encryptionKey: receiverPublicKey,
					signingKey: privateKey
				});

				const receiverUsernameHashed = await hashUsername(receiverUsername);

				const res = await fetch('/api/user/me/invitation', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						receiverUsernameHashed,
						invitationEncryptedSigned
					})
				});
				if (res.redirected) {
					window.location.href = res.url;
					return;
				}
				if (!res.ok) throw new Error('Cannot invite');

				event.update((event) => {
					if (event === undefined) return;
					event.attendees.push(receiverUsername);
					return event;
				});
			}
		}
	};
})();

export async function saveRemoteMetadata({ metadata }: { metadata: Metadata }) {
	if (metadata === undefined || publicKey === undefined || privateKey === undefined)
		throw new Error('Cannot save metadata');
	const metadataEncryptedSigned = await pgp.encryptAndSignAsymetric({
		text: JSON.stringify(metadata),
		encryptionKey: publicKey,
		signingKey: privateKey
	});

	const res = await fetch('/api/user/me/metadataEncryptedSigned', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			metadataEncryptedSigned
		})
	});
	if (res.redirected) {
		window.location.href = res.url;
		return;
	}
	if (!res.ok) throw new Error('Cannot save metadata');
}

async function saveRemoteEvent({
	event,
	username,
	password
}: {
	event: Event;
	username: string;
	password: string;
}) {
	if (event === undefined || publicKey === undefined || privateKey === undefined)
		throw new Error('Cannot save event');

	const eventEncryptedSigned = await pgp.encryptAndSignSymetric({
		text: JSON.stringify(event),
		publicKey,
		password
	});

	const passwordHashed = await hashPassword(username, password);

	const res = await fetch('/api/event', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			id: event.id,
			passwordHashed,
			eventEncryptedSigned
		})
	});
	if (res.redirected) {
		window.location.href = res.url;
		return;
	}
	if (!res.ok) throw new Error('Cannot save event');
}

async function loadPrivateKey(password: string) {
	const res = await fetch('/api/user/me/privateKeyEncryptedArmored');
	if (res.redirected) {
		window.location.href = res.url;
		return;
	}
	if (!res.ok) throw new Error('Cannot load data');

	const text = await res.text();
	try {
		return await pgp.parsePrivateKey({ privateKeyEncryptedArmored: text, password });
	} catch (error) {
		throw new Error('Invalid password');
	}
}

async function loadPublicKey(privateKey: pgp.PrivateKey) {
	const res = await fetch('/api/user/me/publicKeyArmored');
	if (res.redirected) {
		window.location.href = res.url;
		return;
	}
	if (!res.ok) throw new Error('Cannot load data');

	const text = await res.text();

	const publicKey = await pgp.parsePublicKey({ publicKeyArmored: text });

	const validKeyPair = isValidKeyPair({ publicKey, privateKey });
	if (!validKeyPair) throw new Error('Not a valid key pair');

	return publicKey;
}

async function loadMetadata(privateKey: pgp.PrivateKey) {
	const res = await fetch('/api/user/me/metadataEncryptedSigned');
	if (res.redirected) {
		window.location.href = res.url;
		return;
	}
	if (!res.ok) throw new Error('Cannot load data');

	const text = await res.text();
	try {
		const decryptedMetadata = await pgp.decryptAsymetric({ armoredMessage: text, privateKey });

		const parsedMetadata: Metadata = parseMetadata(decryptedMetadata);

		return parsedMetadata;
	} catch (error) {
		throw new Error('Cannot load data');
	}
}

// INVITATION

export async function getPublicKey({ username }: { username: string }) {
	const usernameHashed = await hashUsername(username);

	const res = await fetch(`/api/user/${usernameHashed}/publicKeyArmored`);
	if (res.redirected) {
		window.location.href = res.url;
		return;
	}
	if (!res.ok) throw new Error('Cannot load data');

	const text = await res.text();

	const publicKey = await pgp.parsePublicKey({ publicKeyArmored: text });

	return publicKey;
}

export async function getInvitations({ texts }: { texts: string[] }) {
	if (privateKey === undefined) return;

	const invitations: Invitation[] = [];

	for (const text of texts) {
		const decryptedInvitation = await pgp.decryptAsymetric({ armoredMessage: text, privateKey });

		const parsedInvitation: Invitation = parseInvitation(decryptedInvitation);

		const publicKey = await pgp.parsePublicKey({
			publicKeyArmored: parsedInvitation.publicKeyArmored
		});

		try {
			await pgp.decryptAsymetricSigned({
				armoredMessage: text,
				privateKey,
				publicKey
			});
		} catch (error) {
			continue;
		}

		invitations.push(parsedInvitation);
	}

	return invitations;
}

export async function deleteInvitation({ receiverUsername }: { receiverUsername: string }) {
	const receiverUsernameHashed = await hashUsername(receiverUsername);

	const res = await fetch(`/api/user/me/invitation/${receiverUsernameHashed}`, {
		method: 'DELETE'
	});
	if (res.redirected) {
		window.location.href = res.url;
		return;
	}
	if (!res.ok) throw new Error('Cannot delete invitation');
}
