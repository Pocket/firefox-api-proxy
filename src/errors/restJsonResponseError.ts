import { RestResponseError, SENTRY_BEHAVIOR } from './restResponseError';

/**
 * RestResponseError but with support for type-safe JSON responses.
 */
export class RestJsonResponseError<T> extends RestResponseError {
  constructor(
    message,
    {
      status = 500,
      jsonResponse,
      sentryBehavior = SENTRY_BEHAVIOR.DEFAULT,
    }: {
      status?: number;
      // can't really provide a reasonable default, required!
      jsonResponse: T;
      sentryBehavior?: SENTRY_BEHAVIOR;
    }
  ) {
    super(message, {
      status,
      stringResponse: JSON.stringify(jsonResponse),
      sentryBehavior,
    });
  }
}
