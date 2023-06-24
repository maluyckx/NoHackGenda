import * as pgp from './pgp';
import * as crypto from './crypto';
import type { Credentials, Identity } from '../types/user';
import type { Metadata } from '$lib/types/metadata';
import type { CookiePayload } from '$lib/types/cookie';

let privateKey: pgp.PrivateKey | undefined = undefined;
let privateKeyEncrypted: pgp.PrivateKey | undefined = undefined;
let publicKey: pgp.PublicKey | undefined = undefined;

async function generateKey(credentials: Credentials, identity?: Identity) {
	const key = await pgp.generateKey({ credentials, identity });

	privateKey = key.privateKey;
	privateKeyEncrypted = key.privateKeyEncrypted;
	publicKey = key.publicKey;
}

export async function register(credentials: Credentials, identity?: Identity) {
	await generateKey(credentials, identity);
	if (privateKey === undefined || privateKeyEncrypted === undefined || publicKey === undefined)
		return;

	const usernameHashed = await crypto.hashUsername(credentials.username);
	const passwordHashed = await crypto.hashPassword(credentials.username, credentials.password);

	const metadata: Metadata = {
		username: credentials.username,
		agendas: [
			{
				name: `${credentials.username}'${credentials.username.endsWith('s') ? '' : 's'} agenda`,
				events: []
			}
		],
		contacts: []
	};

	const metadataEncryptedSigned = await pgp.encryptAndSignAsymetric({
		text: JSON.stringify(metadata),
		publicKey,
		privateKey
	});

	const res = await fetch('/api/auth/register', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			usernameHashed,
			passwordHashed,
			privateKeyEncryptedArmored: privateKeyEncrypted.armor(),
			publicKeyArmored: publicKey.armor(),
			metadataEncryptedSigned
		})
	});
	if (!res.ok) throw new Error(await res.text());

	goToApp({
		usernameHashed,
		password: credentials.password,
		privateKey
	});
}

export async function login(credentials: Credentials) {
	const usernameHashed = await crypto.hashUsername(credentials.username);
	const passwordHashed = await crypto.hashPassword(credentials.username, credentials.password);

	const res = await fetch('/api/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			usernameHashed,
			passwordHashed
		})
	});
	if (!res.ok) throw new Error(await res.text());

	const { privateKeyEncryptedArmored } = await res.json();

	if (privateKeyEncryptedArmored === undefined) throw new Error('Unknown error');

	const privateKey = await pgp.parsePrivateKey({
		privateKeyEncryptedArmored,
		password: credentials.password
	});

	goToApp({
		usernameHashed,
		password: credentials.password,
		privateKey
	});
}

async function goToApp({
	usernameHashed,
	password,
	privateKey
}: {
	usernameHashed: string;
	password: string;
	privateKey: pgp.PrivateKey;
}) {
	const validUntil = new Date(new Date().getTime() + 1000 /*ms*/ * 60 /*s*/ * 15 /*m*/);
	const payload: CookiePayload = {
		usernameHashed,
		validUntil
	};
	const payloadSigned: string = await pgp.sign({ text: JSON.stringify(payload), privateKey });

	const res = await fetch('/api/auth/cookie', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			payloadSigned
		})
	});
	if (!res.ok) throw new Error(await res.text());

	window.sessionStorage.setItem('password', password);
	window.location.href = '/app';
}
