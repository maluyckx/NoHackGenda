import express from "express";
import { Request, Response } from "express";
import * as db from "../lib/db.js";
import {
  isValidPGPMessageFormat,
  isValidUsernameHashedFormat,
} from "../lib/validate.js";

const router = express.Router();

router.get(
  "/me/privateKeyEncryptedArmored",
  async (req: Request, res: Response) => {
    const usernameHashed: string = res.locals.usernameHashed;
    if (
      typeof usernameHashed !== "string" ||
      !isValidUsernameHashedFormat({ usernameHashed })
    ) {
      console.log(
        `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
      );
      return res.sendStatus(400);
    }
    try {
      const privateKeyEncryptedArmored = await db.getPrivateKeyEncryptedArmored(
        {
          usernameHashed,
        }
      );
      return res.status(200).send(privateKeyEncryptedArmored);
    } catch (error) {
      return res.sendStatus(400);
    }
  }
);

router.get("/me/publicKeyArmored", async (req: Request, res: Response) => {
  const usernameHashed: string = res.locals.usernameHashed;
  if (
    typeof usernameHashed !== "string" ||
    !isValidUsernameHashedFormat({ usernameHashed })
  ) {
    console.log(
      `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
    );
    return res.sendStatus(400);
  }
  try {
    const publicKeyArmored = await db.getPublicKeyArmored({ usernameHashed });
    return res.status(200).send(publicKeyArmored);
  } catch (error) {
    return res.sendStatus(400);
  }
});

router.get(
  "/:usernameHashed/publicKeyArmored",
  async (req: Request, res: Response) => {
    const usernameHashed: string = req.params.usernameHashed;
    if (
      typeof usernameHashed !== "string" ||
      !isValidUsernameHashedFormat({ usernameHashed })
    ) {
      console.log(
        `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
      );
      return res.sendStatus(400);
    }
    try {
      const publicKeyArmored = await db.getPublicKeyArmored({ usernameHashed });
      return res.status(200).send(publicKeyArmored);
    } catch (error) {
      return res.sendStatus(400);
    }
  }
);

router.get(
  "/me/metadataEncryptedSigned",
  async (req: Request, res: Response) => {
    const usernameHashed: string = res.locals.usernameHashed;
    if (
      typeof usernameHashed !== "string" ||
      !isValidUsernameHashedFormat({ usernameHashed })
    ) {
      console.log(
        `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
      );
      return res.sendStatus(400);
    }
    try {
      const metadataEncryptedSigned = await db.getMetadataEncryptedSigned({
        usernameHashed,
      });
      return res.status(200).send(metadataEncryptedSigned);
    } catch (error) {
      return res.sendStatus(400);
    }
  }
);

router.put(
  "/me/metadataEncryptedSigned",
  async (req: Request, res: Response) => {
    const usernameHashed: string = res.locals.usernameHashed;
    const { metadataEncryptedSigned } = req.body;

    if (
      typeof usernameHashed !== "string" ||
      typeof metadataEncryptedSigned !== "string" ||
      !isValidUsernameHashedFormat({ usernameHashed }) ||
      !isValidPGPMessageFormat({ message: metadataEncryptedSigned })
    ) {
      console.log(
        `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
      );
      return res.sendStatus(400);
    }
    try {
      await db.updateMetadataEncryptedSigned({
        usernameHashed,
        metadataEncryptedSigned,
      });
      return res.sendStatus(204);
    } catch (error) {
      return res.sendStatus(400);
    }
  }
);

router.delete("/me", async (req: Request, res: Response) => {
  const usernameHashed: string = res.locals.usernameHashed;

  if (
    typeof usernameHashed !== "string" ||
    !isValidUsernameHashedFormat({ usernameHashed })
  ) {
    console.log(
      `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
    );
    return res.sendStatus(400);
  }
  try {
    await db.deleteUser({
      usernameHashed,
    });
    return res.redirect(303, "/app");
  } catch (error) {
    return res.sendStatus(400);
  }
});

router.post("/me/invitation", async (req: Request, res: Response) => {
  const { receiverUsernameHashed, invitationEncryptedSigned } = req.body;
  const usernameHashed: string = res.locals.usernameHashed;
  if (
    typeof usernameHashed !== "string" ||
    typeof receiverUsernameHashed !== "string" ||
    typeof invitationEncryptedSigned !== "string" ||
    !isValidUsernameHashedFormat({ usernameHashed }) ||
    !isValidUsernameHashedFormat({ usernameHashed: receiverUsernameHashed }) ||
    !isValidPGPMessageFormat({ message: invitationEncryptedSigned })
  ) {
    return res.sendStatus(400);
  }
  try {
    if (usernameHashed === receiverUsernameHashed) {
      return res.status(400).send("Cannot invite yourself");
    }

    await db.createInvitationEncryptedSigned({
      senderUsernameHashed: usernameHashed,
      receiverUsernameHashed,
      invitationEncryptedSigned,
    });
  } catch (e) {
    return res.status(400).send("Invitation already exist");
  }

  return res.sendStatus(201);
});

router.get("/me/invitation", async (req: Request, res: Response) => {
  const usernameHashed: string = res.locals.usernameHashed;
  if (
    typeof usernameHashed !== "string" ||
    !isValidUsernameHashedFormat({ usernameHashed })
  ) {
    return res.sendStatus(400);
  }
  try {
    const invitations = await db.getRequestInvitationEncryptedSigned({
      receiverUsernameHashed: usernameHashed,
    });

    return res.status(200).send(invitations);
  } catch (e) {
    return res.status(400).send("Invitation don't exist");
  }
});

router.put(
  "/me/invitation/:senderUsernameHashed",
  async (req: Request, res: Response) => {
    const { senderUsernameHashed } = req.params;
    const { invitationEncryptedSigned } = req.body;
    const usernameHashed: string = res.locals.usernameHashed;
    if (
      typeof usernameHashed !== "string" ||
      typeof senderUsernameHashed !== "string" ||
      typeof invitationEncryptedSigned !== "string" ||
      !isValidUsernameHashedFormat({ usernameHashed }) ||
      !isValidUsernameHashedFormat({ usernameHashed: senderUsernameHashed }) ||
      !isValidPGPMessageFormat({ message: invitationEncryptedSigned })
    ) {
      return res.sendStatus(400);
    }

    try {
      await db.getRequestInvitationEncryptedSigned({
        receiverUsernameHashed: usernameHashed,
      });
    } catch (error) {
      return res.status(400).send("Invitation don't exist");
    }

    try {
      await db.updateResponseInvitationEncryptedSigned({
        senderUsernameHashed,
        receiverUsernameHashed: usernameHashed,
        invitationEncryptedSigned: invitationEncryptedSigned,
      });
    } catch (e) {
      return res.sendStatus(400);
    }

    return res.sendStatus(201);
  }
);

router.delete(
  "/me/invitation/:senderUsernameHashed",
  async (req: Request, res: Response) => {
    const { senderUsernameHashed } = req.params;
    const usernameHashed: string = res.locals.usernameHashed;

    if (
      typeof usernameHashed !== "string" ||
      typeof senderUsernameHashed !== "string" ||
      !isValidUsernameHashedFormat({ usernameHashed }) ||
      !isValidUsernameHashedFormat({ usernameHashed: senderUsernameHashed })
    ) {
      return res.sendStatus(400);
    }

    try {
      await db.deleteInvitationEncryptedSigned({
        receiverUsernameHashed: usernameHashed,
        senderUsernameHashed,
      });
      return res.sendStatus(200);
    } catch (error) {
      return res.sendStatus(404);
    }
  }
);

export default router;
