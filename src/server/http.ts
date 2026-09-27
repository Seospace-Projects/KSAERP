import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-correlation-id')?.trim();
  const id = incoming || randomUUID();
  res.setHeader('X-Correlation-ID', id);
  next();
}

export function getCorrelationId(res: Response): string {
  const value = res.getHeader('X-Correlation-ID');
  return typeof value === 'string' ? value : '';
}

function errorDetail(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return String(err);
}

export function logServerError(res: Response, context: string, err: unknown): void {
  console.error(JSON.stringify({
    correlationId: getCorrelationId(res),
    context,
    error: errorDetail(err),
  }));
}

/** Public API errors: generic message + correlation ID. Details stay in server logs. */
export function sendPublicError(
  res: Response,
  status: number,
  message: string,
  err?: unknown,
  context?: string,
): void {
  if (err !== undefined) logServerError(res, context || message, err);
  res.status(status).json({ error: message, correlationId: getCorrelationId(res) });
}
