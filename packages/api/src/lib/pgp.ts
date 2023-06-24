import * as openpgp from "openpgp";

export type PublicKey = openpgp.PublicKey;

export async function parsePublicKey({
  publicKeyArmored,
}: {
  publicKeyArmored: string;
}): Promise<openpgp.PublicKey> {
  return await openpgp.readKey({ armoredKey: publicKeyArmored });
}

export async function getMessage({
  armoredMessage,
}: {
  armoredMessage: string;
}) {
  return await openpgp.readMessage({
    armoredMessage,
  });
}

export async function getCleartextMessage({
  cleartextMessage,
}: {
  cleartextMessage: string;
}) {
  return await openpgp.readCleartextMessage({
    cleartextMessage,
  });
}

export async function verifyMessage({
  armoredMessage,
  publicKey,
}: {
  armoredMessage: string;
  publicKey: openpgp.PublicKey;
}): Promise<boolean> {
  const message = await getMessage({ armoredMessage });

  const verificationResult = await openpgp.verify({
    message,
    verificationKeys: publicKey,
  });

  const { verified } = verificationResult.signatures[0];
  return verified;
}

export async function verifyCleartextMessage({
  cleartextMessage,
  publicKey,
}: {
  cleartextMessage: string;
  publicKey: openpgp.PublicKey;
}): Promise<boolean> {
  const message = (await getCleartextMessage({
    cleartextMessage,
  })) as unknown as openpgp.Message<string>;
  // TODO https://github.com/openpgpjs/openpgpjs/issues/1582

  const verificationResult = await openpgp.verify({
    message,
    verificationKeys: publicKey,
  });

  const { verified } = verificationResult.signatures[0];
  return verified;
}
