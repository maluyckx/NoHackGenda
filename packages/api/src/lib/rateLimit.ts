import { NextFunction, Request, Response } from "express";

const period = 15 /*m*/ * 60; /*s*/

import { RateLimiterMemory } from "rate-limiter-flexible";
const rateLimiter = new RateLimiterMemory({
  points: 150,
  duration: period,
});

export async function block({ ip }: { ip: string }) {
  // TODO check if proxy
  // return await rateLimiter.block(ip, period);
}

export function middleware(policy: "normal" | "sensitive" = "normal") {
  const points = policy === "sensitive" ? 10 : 1;
  return async (req: Request, res: Response, next: NextFunction) => {
    rateLimiter
      .consume(req.ip, points)
      .then(() => {
        next();
      })
      .catch(() => {
        res.sendStatus(429);
      });
  };
}
