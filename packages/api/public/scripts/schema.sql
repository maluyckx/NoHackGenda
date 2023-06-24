BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "Credentials" (
    "usernameHashed"	TEXT NOT NULL UNIQUE,
    "passwordHashed"	TEXT NOT NULL,
    PRIMARY KEY("usernameHashed")
);

CREATE TABLE IF NOT EXISTS "PrivateKeyEncryptedArmored" (
    "usernameHashed"	TEXT NOT NULL UNIQUE,
    "privateKeyEncryptedArmored"	TEXT NOT NULL,
    PRIMARY KEY("usernameHashed")
);

CREATE TABLE IF NOT EXISTS "PublicKeyArmored" (
    "usernameHashed"	TEXT NOT NULL UNIQUE,
    "publicKeyArmored"	TEXT NOT NULL,
    PRIMARY KEY("usernameHashed")
);

CREATE TABLE IF NOT EXISTS "MetadataEncryptedSigned" (
    "usernameHashed"	TEXT NOT NULL UNIQUE,
    "metadataEncryptedSigned"	TEXT NOT NULL,
    PRIMARY KEY("usernameHashed")
);

CREATE TABLE IF NOT EXISTS "EventEncryptedSigned" (
	"id"	TEXT NOT NULL UNIQUE,
    "usernameHashed"	TEXT NOT NULL,
    "passwordHashed"	TEXT NOT NULL,
	"eventEncryptedSigned"	TEXT NOT NULL,
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "InvitationEncryptedSigned" (
    "senderUsernameHashed"	TEXT NOT NULL,
	"receiverUsernameHashed"	TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK("type" IN ("request", "response")),
	"invitationEncryptedSigned"	TEXT NOT NULL,
	PRIMARY KEY("senderUsernameHashed","receiverUsernameHashed")
);

COMMIT;
