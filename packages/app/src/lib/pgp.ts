import * as openpgp from 'openpgp';
import type { PrivateKey as OpenPGPPrivateKey, PublicKey as OpenPGPPublicKey } from 'openpgp';

export type PrivateKey = OpenPGPPrivateKey;
export type PublicKey = OpenPGPPublicKey;

export async function encryptAndSignAsymetric({
	text,
	encryptionKey,
	signingKey
}: {
	text: string;
	encryptionKey: PublicKey;
	signingKey: PrivateKey;
}): Promise<string> {
	const encrypted = await openpgp.encrypt({
		message: await openpgp.createMessage({ text, format: 'text' }),
		encryptionKeys: encryptionKey,
		signingKeys: signingKey
	});

	return encrypted.toString();
}

export async function encryptAndSignSymetric({
	text,
	publicKey,
	password
}: {
	text: string;
	publicKey: PublicKey;
	password: string;
}): Promise<string> {
	const encrypted = await openpgp.encrypt({
		message: await openpgp.createMessage({ text, format: 'text' }),
		encryptionKeys: publicKey,
		passwords: password
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

export async function parsePublicKey({
	publicKeyArmored
}: {
	publicKeyArmored: string;
}): Promise<openpgp.PublicKey> {
	return await openpgp.readKey({ armoredKey: publicKeyArmored });
}

export async function decryptAsymetric({
	armoredMessage,
	privateKey
}: {
	armoredMessage: string;
	privateKey: PrivateKey;
}): Promise<string> {
	const { data } = await openpgp.decrypt({
		message: await openpgp.readMessage({ armoredMessage }),
		decryptionKeys: privateKey,
		expectSigned: false
	});

	return data.toString();
}

export async function decryptAsymetricSigned({
	armoredMessage,
	privateKey,
	publicKey
}: {
	armoredMessage: string;
	privateKey: PrivateKey;
	publicKey: PublicKey;
}): Promise<string> {
	const { data, signatures } = await openpgp.decrypt({
		message: await openpgp.readMessage({ armoredMessage }),
		decryptionKeys: privateKey,
		expectSigned: true,
		verificationKeys: publicKey
	});

	const { verified } = signatures[0];
	if (!verified) {
		throw new Error('Invalid signature');
	}

	return data.toString();
}

export async function decryptSymetric({
	armoredMessage,
	password
}: {
	armoredMessage: string;
	password: string;
}): Promise<string> {
	const { data } = await openpgp.decrypt({
		message: await openpgp.readMessage({ armoredMessage }),
		passwords: password
	});

	return data.toString();
}
