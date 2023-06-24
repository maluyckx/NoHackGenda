import express, { Request, Response } from "express";
import * as db from "../lib/db.js";
import {
  isValidIdFormat,
  isValidPasswordHashedFormat,
  isValidPGPMessageFormat,
  isValidUsernameHashedFormat,
} from "../lib/validate.js";

const router = express.Router();

router.post("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { passwordHashed } = req.body;
  if (
    typeof id !== "string" ||
    typeof passwordHashed !== "string" ||
    !isValidIdFormat({ id }) ||
    !isValidPasswordHashedFormat({ passwordHashed })
  ) {
    console.log(
      `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
    );
    return res.sendStatus(400);
  }

  try {
    const eventEncryptedSigned = await db.getEventEncryptedSigned({
      id,
      passwordHashed,
    });

    return res.status(200).send(eventEncryptedSigned);
  } catch (error) {
    return res.sendStatus(404);
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { id, passwordHashed, eventEncryptedSigned } = req.body;
  const usernameHashed: string = res.locals.usernameHashed;

  if (
    typeof id !== "string" ||
    typeof usernameHashed !== "string" ||
    typeof passwordHashed !== "string" ||
    typeof eventEncryptedSigned !== "string" ||
    !isValidIdFormat({ id }) ||
    !isValidUsernameHashedFormat({ usernameHashed }) ||
    !isValidPasswordHashedFormat({ passwordHashed }) ||
    !isValidPGPMessageFormat({ message: eventEncryptedSigned })
  ) {
    console.log(
      `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
    );
    return res.sendStatus(400);
  }
  try {
    await db.createEventEncryptedSigned({
      id,
      usernameHashed,
      passwordHashed,
      eventEncryptedSigned,
    });

    return res.sendStatus(201);
  } catch (error) {
    return res.sendStatus(404);
  }
});

router.put("/", async (req: Request, res: Response) => {
  const { id, passwordHashed, eventEncryptedSigned } = req.body;
  const usernameHashed: string = res.locals.usernameHashed;

  if (
    typeof id !== "string" ||
    typeof eventEncryptedSigned !== "string" ||
    typeof usernameHashed !== "string" ||
    typeof passwordHashed !== "string" ||
    !isValidIdFormat({ id }) ||
    !isValidUsernameHashedFormat({ usernameHashed }) ||
    !isValidPasswordHashedFormat({ passwordHashed }) ||
    !isValidPGPMessageFormat({ message: eventEncryptedSigned })
  ) {
    console.log(
      `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
    );
    return res.sendStatus(400);
  }

  try {
    await db.getEventEncryptedSigned({
      id,
      passwordHashed,
    });
  } catch (error) {
    return res.sendStatus(403);
  }

  try {
    await db.updateEventEncryptedSigned({
      id,
      usernameHashed,
      passwordHashed,
      eventEncryptedSigned,
    });

    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(404);
  }
});

router.delete("/", async (req: Request, res: Response) => {
  const { id, passwordHashed } = req.body;
  const usernameHashed: string = res.locals.usernameHashed;

  if (
    typeof id !== "string" ||
    typeof usernameHashed !== "string" ||
    typeof passwordHashed !== "string" ||
    !isValidIdFormat({ id }) ||
    !isValidUsernameHashedFormat({ usernameHashed }) ||
    !isValidPasswordHashedFormat({ passwordHashed })
  ) {
    console.log(
      `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
    );
    return res.sendStatus(400);
  }

  try {
    await db.deleteEventEncryptedSigned({
      id,
      usernameHashed,
      passwordHashed,
    });

    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(404);
  }
});

export default router;
