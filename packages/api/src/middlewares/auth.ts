import { NextFunction, Request, Response } from "express";
import { decodeCookie, parseCookie, verifyCookie } from "../lib/cookie.js";
import * as rateLimit from "../lib/rateLimit.js";
import * as db from "../lib/db.js";
import * as pgp from "../lib/pgp.js";

export async function checkCookie(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const encodedCookie = req.cookies?.["__Host-auth"];

  if (encodedCookie === undefined) {
    redirectLogin(res);
    return;
  }

  try {
    const cookie = decodeCookie(encodedCookie);
    const { usernameHashed, validUntil } = await parseCookie({
      cookie,
    });

    const publicKey = await pgp.parsePublicKey({
      publicKeyArmored: await db.getPublicKeyArmored({ usernameHashed }),
    });

    const verified = await verifyCookie({ cookie, publicKey });

    if (!verified) {
      invalidCookie(req, res);
      return;
    }

    if (validUntil < new Date()) {
      redirectLogin(res);
      return;
    }

    res.locals.usernameHashed = usernameHashed;
    next();
  } catch (error) {
    invalidCookie(req, res);
    return;
  }
}

export async function tryRedirectApp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cookie = req.cookies?.auth;

  if (cookie !== undefined) return res.redirect(303, "/app");

  next();
}

function invalidCookie(req: Request, res: Response) {
  rateLimit.block({ ip: req.ip });

  console.log(
    `Forgery attempt from ${req.method.toUpperCase()} ${req.path} ${req.ip}`
  );

  redirectLogin(res);
}

function redirectLogin(res: Response) {
  res.clearCookie("__Host-auth");
  res.redirect(303, "/auth");
}
