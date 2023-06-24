import type { PrivateKey as OpenPGPPrivateKey, PublicKey as OpenPGPPublicKey } from 'openpgp';
import * as openpgp from 'openpgp';
import type { Credentials, Identity } from '../types/user';

export type PrivateKey = OpenPGPPrivateKey;
export type PublicKey = OpenPGPPublicKey;

export async function generateKey({
	credentials,
	identity
}: {
	credentials: Credentials;
	identity?: Identity;
}): Promise<{
	privateKey: OpenPGPPrivateKey;
	privateKeyEncrypted: OpenPGPPrivateKey;
	publicKey: OpenPGPPublicKey;
}> {
	const { privateKey: privateKeyEncrypted, publicKey } = await openpgp.generateKey({
		type: 'ecc',
		curve: 'p256',
		userIDs: identity ? [{ name: identity.name, email: identity.email }] : [{}],
		passphrase: credentials.password,
		format: 'object'
	});

	const privateKey = await openpgp.decryptKey({
		privateKey: privateKeyEncrypted,
		passphrase: credentials.password
	});

	return { privateKey, privateKeyEncrypted, publicKey };
}

export async function encryptAndSignAsymetric({
	text,
	publicKey,
	privateKey
}: {
	text: string;
	publicKey: PublicKey;
	privateKey: PrivateKey;
}): Promise<string> {
	const encrypted = await openpgp.encrypt({
		message: await openpgp.createMessage({ text, format: 'text' }),
		encryptionKeys: publicKey,
		signingKeys: privateKey
	});

	return encrypted.toString();
}

export async function sign({
	text,
	privateKey
}: {
	text: string;
	privateKey: PrivateKey;
}): Promise<string> {
	return await openpgp.sign({
		message: await openpgp.createCleartextMessage({ text }),
		signingKeys: privateKey
	});
}

export async function parsePrivateKey({
	privateKeyEncryptedArmored,
	password
}: {
	privateKeyEncryptedArmored: string;
	password: string;
}): Promise<openpgp.PrivateKey> {
	return await openpgp.decryptKey({
		privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyEncryptedArmored }),
		passphrase: password
	});
}
