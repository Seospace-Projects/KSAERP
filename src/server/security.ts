import cors from 'cors';
import type { Express } from 'express';
import helmet from 'helmet';
import { getAppUrl, getSupabaseUrl, isProduction } from './env';

export function applySecurityMiddleware(app: Express): void {
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const appUrl = getAppUrl();
  const supabaseUrl = getSupabaseUrl();
  const supabaseWss = supabaseUrl?.replace(/^https:/i, 'wss:');
  const allowedOrigins = new Set(
    [appUrl].filter(Boolean).map(origin => origin.replace(/\/$/, '')),
  );

  app.use(helmet({
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
    hsts: isProduction()
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    contentSecurityPolicy: isProduction()
      ? {
          useDefaults: false,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            fontSrc: ["'self'", 'data:'],
            connectSrc: ["'self'", supabaseUrl, supabaseWss].filter((value): value is string => Boolean(value)),
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
  }));

  app.use(cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (!isProduction() || allowedOrigins.has(origin.replace(/\/$/, ''))) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }));
}
