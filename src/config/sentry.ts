import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { getEnvironment } from '../utils/env';

const environment = getEnvironment();

if (["stage", "prod"].includes(environment) && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    beforeSend(event, hint) {
      // Customize error filtering here
      const error: any = hint.originalException;
      const excludeErrors = ['UnauthorizedError', 'Forbidden', 'ValidationError']
      if (error && (excludeErrors.includes(error.name || "") || excludeErrors.includes(error.error) || error.error && error.error.isJoi)) {
        return null; // This will prevent the event from being sent to Sentry
      }
      return event; // Send all other events to Sentry
    },
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    environment
  });
}
