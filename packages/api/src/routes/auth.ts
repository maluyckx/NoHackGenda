import { Request, Response, Router } from "express";
import * as db from "../lib/db.js";
import { encodeCookie, parseCookie } from "../lib/cookie.js";
import {
  isValidPasswordHashedFormat,
  isValidPGPMessageFormat,
  isValidPGPPrivateKeyArmoredFormat,
  isValidPGPPublicKeyArmoredFormat,
  isValidPGPSignedMessageFormat,
  isValidUsernameHashedFormat,
} from "../lib/validate.js";

import clearSiteData from "clearsitedata";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const {
    usernameHashed,
    passwordHashed,
    privateKeyEncryptedArmored,
    publicKeyArmored,
    metadataEncryptedSigned,
  } = req.body;

  if (
    typeof usernameHashed !== "string" ||
    typeof passwordHashed !== "string" ||
    typeof privateKeyEncryptedArmored !== "string" ||
    typeof publicKeyArmored !== "string" ||
    typeof metadataEncryptedSigned !== "string" ||
    !isValidUsernameHashedFormat({ usernameHashed }) ||
    !isValidPasswordHashedFormat({ passwordHashed }) ||
    !isValidPGPPrivateKeyArmoredFormat({
      privateKeyArmored: privateKeyEncryptedArmored,
    }) ||
    !isValidPGPPublicKeyArmoredFormat({ publicKeyArmored }) ||
    !isValidPGPMessageFormat({ message: metadataEncryptedSigned })
  ) {
    console.log(`Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`);

    return res.sendStatus(400);
  }

  try {
    await db.createUser({
      usernameHashed,
      passwordHashed,
      privateKeyEncryptedArmored,
      publicKeyArmored,
      metadataEncryptedSigned,
    });
  } catch (e) {
    return res.status(400).send("Username already exist");
  }

  return res.sendStatus(201);
});

router.post("/login", async (req: Request, res: Response) => {
  const { usernameHashed, passwordHashed } = req.body;

  if (
    typeof usernameHashed !== "string" ||
    typeof passwordHashed !== "string" ||
    !isValidUsernameHashedFormat({ usernameHashed }) ||
    !isValidPasswordHashedFormat({ passwordHashed })
  ) {
    console.log(`Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`);
    return res.sendStatus(400);
  }
  try {
  if (!(await db.isCredentialsExists({ usernameHashed, passwordHashed }))) {
    return res.status(403).send("Username or password invalid");
  }

    const privateKeyEncryptedArmored = await db.getPrivateKeyEncryptedArmored({
      usernameHashed,
    });
    return res.status(201).send({ privateKeyEncryptedArmored });
  } catch (error) {
    return res.sendStatus(400);
  }
});

router.post("/cookie", async (req: Request, res: Response) => {
  const { payloadSigned } = req.body;

  if (
    typeof payloadSigned !== "string" ||
    !isValidPGPSignedMessageFormat({ signedMessage: payloadSigned })
  ) {
    console.log(`Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`);
    return res.sendStatus(400);
  }

  try {
    const payload = await parseCookie({ cookie: payloadSigned });
    const encodedCookie = encodeCookie(payloadSigned);

    res.cookie("__Host-auth", encodedCookie, {
      expires: payload.validUntil,
      secure: true,
      httpOnly: true,
      path: "/",
      sameSite: "strict",
    });
  } catch (error) {
    console.error(error);
    return res.sendStatus(400);
  }

  return res.sendStatus(201);
});

router.post(
  "/logout",
  clearSiteData({
    directives: ["cache", "cookies", "storage"],
  }),
  async (req: Request, res: Response) => {
    res.clearCookie("__Host-auth");
    return res.redirect(303, "/app");
  }
);

export default router;
