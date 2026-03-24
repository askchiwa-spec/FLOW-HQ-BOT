import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Only capture errors, not performance traces in client
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
  });
}
