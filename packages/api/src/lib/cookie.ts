import * as pgp from "./pgp.js";

export async function parseCookie({
  cookie,
}: {
  cookie: string;
}): Promise<{ usernameHashed: string; validUntil: Date }> {
  const cleartextMessage = await pgp.getCleartextMessage({
    cleartextMessage: cookie,
  });

  const { usernameHashed, validUntil } = JSON.parse(cleartextMessage.getText());
  if (typeof usernameHashed !== "string")
    throw new Error("usernameHashed is not a string");
  if (typeof validUntil !== "string")
    throw new Error("validUntil is not a string");

  return {
    usernameHashed,
    validUntil: new Date(validUntil),
  };
}

export async function verifyCookie({
  cookie,
  publicKey,
}: {
  cookie: string;
  publicKey: pgp.PublicKey;
}): Promise<boolean> {
  return pgp.verifyCleartextMessage({ cleartextMessage: cookie, publicKey });
}

export function encodeCookie(cookie: string) {
  return encodeURI(Buffer.from(cookie).toString("base64"));
}

export function decodeCookie(cookie: string) {
  return Buffer.from(decodeURI(cookie), "base64").toString();
}
