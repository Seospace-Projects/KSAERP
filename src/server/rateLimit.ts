import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
import { sendPublicError } from './http';

function tooMany(message: string) {
  return (_req: Request, res: Response) => {
    sendPublicError(res, 429, message);
  };
}

const passthrough: RateLimitRequestHandler = ((_req: Request, _res: Response, next: NextFunction) => {
  next();
}) as RateLimitRequestHandler;

/** Skip in-memory rate limits on Vercel (per-instance; also avoid proxy ValidationError crashes). */
const onVercel = Boolean(process.env.VERCEL);

/** Vercel / proxies send multi-hop X-Forwarded-For; disable validations that throw 500s. */
const serverlessSafe = {
  windowMs: 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false as const,
};

/** Login / username lookup: 20 attempts per minute per IP (device switches included). */
export const loginLimiter = onVercel
  ? passthrough
  : rateLimit({
      ...serverlessSafe,
      limit: 20,
      handler: tooMany('Too many sign-in attempts. Try again in a minute.'),
    });

/** Password reset: 3 attempts per hour per IP. */
export const passwordResetLimiter = onVercel
  ? passthrough
  : rateLimit({
      ...serverlessSafe,
      windowMs: 60 * 60 * 1000,
      limit: 3,
      handler: tooMany('Too many password reset attempts. Try again later.'),
    });

/** Authenticated user-create (signup): 10 per minute per IP. */
export const signupLimiter = onVercel
  ? passthrough
  : rateLimit({
      ...serverlessSafe,
      limit: 10,
      handler: tooMany('Too many account requests. Try again in a minute.'),
    });
