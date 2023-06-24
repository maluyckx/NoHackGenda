function usernamePattern(username: string) {
	return `SuperSec0reUsern4meIs${username}`;
}
function passwordPattern(password: string) {
	return `SuperSec0reP4ssw0rdIs${password}`;
}

export async function hashUsername(username: string) {
	return sha256(usernamePattern(username));
}

export async function hashPassword(username: string, password: string) {
	return pbkdf2(passwordPattern(password), username);
}

function arrayBufferToHex(arrayBuffer: ArrayBuffer) {
	const hashArray = Array.from(new Uint8Array(arrayBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
async function sha256(text: string) {
	const encodedUsername = new TextEncoder().encode(text);
	const buffer = await crypto.subtle.digest('SHA-256', encodedUsername);
	return arrayBufferToHex(buffer);
}

// https://webkit.org/demos/webcrypto/pbkdf2.html
async function pbkdf2(password: string, salt: string, iterations = 310 * 1000) {
	const textEncoder = new TextEncoder();
	const encodedPassword = textEncoder.encode(password);
	const encodedSalt = textEncoder.encode(salt);

	const key = await crypto.subtle.importKey('raw', encodedPassword, { name: 'PBKDF2' }, false, [
		'deriveBits'
	]);

	const buffer = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: encodedSalt,
			iterations,
			hash: 'SHA-256'
		},
		key,
		256
	);

	return arrayBufferToHex(buffer);
}
