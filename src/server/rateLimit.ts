import { rateLimit } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { sendPublicError } from './http';

function tooMany(message: string) {
  return (_req: Request, res: Response) => {
    sendPublicError(res, 429, message);
  };
}

/** Login / username lookup: 5 attempts per minute per IP. */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany('Too many sign-in attempts. Try again in a minute.'),
});

/** Password reset: 3 attempts per hour per IP. */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany('Too many password reset attempts. Try again later.'),
});

/** Authenticated user-create (signup): 10 per minute per IP. */
export const signupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany('Too many account requests. Try again in a minute.'),
});
