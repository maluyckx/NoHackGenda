import Database from "better-sqlite3";
import * as path from "node:path";

const db = new Database(path.resolve(__dirname, "data/db"));
db.pragma("journal_mode = WAL");

export async function createUser({
  usernameHashed,
  passwordHashed,
  privateKeyEncryptedArmored,
  publicKeyArmored,
  metadataEncryptedSigned,
}: {
  usernameHashed: string;
  passwordHashed: string;
  privateKeyEncryptedArmored: string;
  publicKeyArmored: string;
  metadataEncryptedSigned: string;
}): Promise<void> {
  await db.prepare("BEGIN TRANSACTION").run();
  await db
    .prepare(
      "INSERT OR ROLLBACK INTO Credentials (usernameHashed, passwordHashed) VALUES (?, ?)"
    )
    .run([usernameHashed, passwordHashed]);
  await db
    .prepare(
      "INSERT OR ROLLBACK INTO PrivateKeyEncryptedArmored (usernameHashed, privateKeyEncryptedArmored) VALUES (?, ?)"
    )
    .run([usernameHashed, privateKeyEncryptedArmored]);
  await db
    .prepare(
      "INSERT OR ROLLBACK INTO PublicKeyArmored (usernameHashed, publicKeyArmored) VALUES (?, ?)"
    )
    .run([usernameHashed, publicKeyArmored]);
  await db
    .prepare(
      "INSERT OR ROLLBACK INTO MetadataEncryptedSigned (usernameHashed, metadataEncryptedSigned) VALUES (?, ?)"
    )
    .run([usernameHashed, metadataEncryptedSigned]);
  await db.prepare("COMMIT").run();
}

export async function deleteUser({
  usernameHashed,
}: {
  usernameHashed: string;
}): Promise<void> {
  await db.prepare("BEGIN TRANSACTION").run();
  await db
    .prepare("DELETE FROM Credentials WHERE usernameHashed = ?")
    .run([usernameHashed]);
  await db
    .prepare("DELETE FROM PrivateKeyEncryptedArmored WHERE usernameHashed = ?")
    .run([usernameHashed]);
  await db
    .prepare("DELETE FROM PublicKeyArmored WHERE usernameHashed = ?")
    .run([usernameHashed]);
  await db
    .prepare("DELETE FROM MetadataEncryptedSigned WHERE usernameHashed = ?")
    .run([usernameHashed]);
  await db
    .prepare("DELETE FROM EventEncryptedSigned WHERE usernameHashed = ?")
    .run([usernameHashed]);
  await db.prepare("COMMIT").run();
}

export async function isCredentialsExists({
  usernameHashed,
  passwordHashed,
}: {
  usernameHashed: string;
  passwordHashed: string;
}): Promise<boolean> {
  return (
    (await db
      .prepare(
        "SELECT 1 FROM Credentials WHERE usernameHashed = ? AND passwordHashed = ?"
      )
      .get([usernameHashed, passwordHashed])) !== undefined
  );
}

export async function getPrivateKeyEncryptedArmored({
  usernameHashed,
}: {
  usernameHashed: string;
}): Promise<string> {
  return await db
    .prepare(
      "SELECT privateKeyEncryptedArmored FROM PrivateKeyEncryptedArmored WHERE usernameHashed = ?"
    )
    .get([usernameHashed]).privateKeyEncryptedArmored;
}

export async function getPublicKeyArmored({
  usernameHashed,
}: {
  usernameHashed: string;
}): Promise<string> {
  return await db
    .prepare(
      "SELECT publicKeyArmored FROM PublicKeyArmored WHERE usernameHashed = ?"
    )
    .get([usernameHashed]).publicKeyArmored;
}

export async function getMetadataEncryptedSigned({
  usernameHashed,
}: {
  usernameHashed: string;
}): Promise<string> {
  return await db
    .prepare(
      "SELECT metadataEncryptedSigned FROM MetadataEncryptedSigned WHERE usernameHashed = ?"
    )
    .get([usernameHashed]).metadataEncryptedSigned;
}

export async function createMetadataEncryptedSigned({
  usernameHashed,
  metadataEncryptedSigned,
}: {
  usernameHashed: string;
  metadataEncryptedSigned: string;
}): Promise<void> {
  await db
    .prepare(
      "INSERT OR ROLLBACK INTO MetadataEncryptedSigned (usernameHashed, metadataEncryptedSigned) VALUES (?, ?)"
    )
    .run([usernameHashed, metadataEncryptedSigned]);
}

export async function updateMetadataEncryptedSigned({
  usernameHashed,
  metadataEncryptedSigned,
}: {
  usernameHashed: string;
  metadataEncryptedSigned: string;
}): Promise<void> {
  await db
    .prepare(
      "UPDATE OR ROLLBACK MetadataEncryptedSigned SET metadataEncryptedSigned = ? WHERE usernameHashed = ?"
    )
    .run([metadataEncryptedSigned, usernameHashed]);
}

export async function getEventEncryptedSigned({
  id,
  passwordHashed,
}: {
  id: string;
  passwordHashed: string;
}): Promise<string> {
  return await db
    .prepare(
      "SELECT eventEncryptedSigned FROM EventEncryptedSigned WHERE id = ? AND passwordHashed = ?"
    )
    .get([id, passwordHashed]).eventEncryptedSigned;
}

export async function createEventEncryptedSigned({
  id,
  usernameHashed,
  passwordHashed,
  eventEncryptedSigned,
}: {
  id: string;
  usernameHashed: string;
  passwordHashed: string;
  eventEncryptedSigned: string;
}): Promise<void> {
  await db
    .prepare(
      "INSERT OR ROLLBACK INTO EventEncryptedSigned (id, usernameHashed, passwordHashed, eventEncryptedSigned) VALUES (?, ?, ?, ?)"
    )
    .run([id, usernameHashed, passwordHashed, eventEncryptedSigned]);
}

export async function updateEventEncryptedSigned({
  id,
  usernameHashed,
  passwordHashed,
  eventEncryptedSigned,
}: {
  id: string;
  usernameHashed: string;
  passwordHashed: string;
  eventEncryptedSigned: string;
}): Promise<void> {
  await db
    .prepare(
      "UPDATE OR ROLLBACK EventEncryptedSigned SET eventEncryptedSigned = ? WHERE id = ? AND usernameHashed = ? AND passwordHashed = ?"
    )
    .run([eventEncryptedSigned, id, usernameHashed, passwordHashed]);
}

export async function deleteEventEncryptedSigned({
  id,
  usernameHashed,
  passwordHashed,
}: {
  id: string;
  usernameHashed: string;
  passwordHashed: string;
}): Promise<void> {
  await db
    .prepare(
      "DELETE FROM EventEncryptedSigned WHERE id = ? AND usernameHashed = ? AND passwordHashed = ?"
    )
    .run([id, usernameHashed, passwordHashed]);
}

export async function createInvitationEncryptedSigned({
  senderUsernameHashed,
  receiverUsernameHashed,
  invitationEncryptedSigned,
}: {
  senderUsernameHashed: string;
  receiverUsernameHashed: string;
  invitationEncryptedSigned: string;
}): Promise<void> {
  await db
    .prepare(
      "INSERT OR ROLLBACK INTO InvitationEncryptedSigned (senderUsernameHashed, receiverUsernameHashed, type, invitationEncryptedSigned) VALUES (?, ?, 'request', ?)"
    )
    .run([
      senderUsernameHashed,
      receiverUsernameHashed,
      invitationEncryptedSigned,
    ]);
}

export async function getRequestInvitationEncryptedSigned({
  receiverUsernameHashed,
}: {
  receiverUsernameHashed: string;
}): Promise<string[]> {
  return await db
    .prepare(
      "SELECT invitationEncryptedSigned FROM InvitationEncryptedSigned WHERE receiverUsernameHashed = ? AND type = 'request'"
    )
    .all([receiverUsernameHashed])
    .map((invitation) => invitation.invitationEncryptedSigned);
}

export async function updateResponseInvitationEncryptedSigned({
  senderUsernameHashed,
  receiverUsernameHashed,
  invitationEncryptedSigned,
}: {
  senderUsernameHashed: string;
  receiverUsernameHashed: string;
  invitationEncryptedSigned: string;
}): Promise<void> {
  await db
    .prepare(
      "UPDATE OR ROLLBACK InvitationEncryptedSigned SET type = 'response', invitationEncryptedSigned = ? WHERE senderUsernameHashed = ? AND receiverUsernameHashed = ?"
    )
    .run([
      invitationEncryptedSigned,
      senderUsernameHashed,
      receiverUsernameHashed,
    ]);
}

export async function deleteInvitationEncryptedSigned({
  senderUsernameHashed,
  receiverUsernameHashed,
}: {
  senderUsernameHashed: string;
  receiverUsernameHashed: string;
}): Promise<void> {
  await db
    .prepare(
      "DELETE FROM InvitationEncryptedSigned WHERE senderUsernameHashed = ? AND receiverUsernameHashed = ?"
    )
    .run([senderUsernameHashed, receiverUsernameHashed]);
}
