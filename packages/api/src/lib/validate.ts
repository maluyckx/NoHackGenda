export function isValidUsernameHashedFormat({
  usernameHashed,
}: {
  usernameHashed: string;
}) {
  return /^[\w\d]{64}$/.test(usernameHashed);
}

export function isValidPasswordHashedFormat({
  passwordHashed,
}: {
  passwordHashed: string;
}) {
  return /^[\w\d]{64}$/.test(passwordHashed);
}

export function isValidPGPPrivateKeyArmoredFormat({
  privateKeyArmored,
}: {
  privateKeyArmored: string;
}) {
  return /^-----BEGIN PGP PRIVATE KEY BLOCK-----\n(.*\n)+-----END PGP PRIVATE KEY BLOCK-----\n$/.test(
    privateKeyArmored
  );
}

export function isValidPGPPublicKeyArmoredFormat({
  publicKeyArmored,
}: {
  publicKeyArmored: string;
}) {
  return /^-----BEGIN PGP PUBLIC KEY BLOCK-----\n(.*\n)+-----END PGP PUBLIC KEY BLOCK-----\n$/.test(
    publicKeyArmored
  );
}

export function isValidPGPMessageFormat({ message }: { message: string }) {
  return /^-----BEGIN PGP MESSAGE-----\n(.*\n)+-----END PGP MESSAGE-----\n$/.test(
    message
  );
}

export function isValidPGPSignedMessageFormat({
  signedMessage,
}: {
  signedMessage: string;
}) {
  return /^-----BEGIN PGP SIGNED MESSAGE-----(.*\n)+-----BEGIN PGP SIGNATURE-----\n(.*\n)+-----END PGP SIGNATURE-----\n$/.test(
    signedMessage
  );
}

export function isValidIdFormat({ id }: { id: string }) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}
