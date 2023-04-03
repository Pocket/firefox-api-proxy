/**
 * Enum allows overriding default sentry error reporting
 * behavior.
 */
export enum SENTRY_BEHAVIOR {
  // handle as sentry config defaults suggest
  DEFAULT,
  // never report to sentry
  SUPPRESS,
  // always report so sentry
  FORCE,
}

/**
 * A default error implementation that is compatible with
 * errorHandler and the default pocket sentry express config.
 *
 * This marks up errors with instructions on how to respond
 * to the request, and gives sentry extra instructions on how
 * to report the error.
 */
export class RestResponseError extends Error {
  status: number;
  stringResponse: string;
  sentryBehavior: SENTRY_BEHAVIOR;
  /**
   *
   * @param message error message intended for sentry
   * @param param1 options, sets response intended for users and sentry behavior
   */
  constructor(
    message,
    {
      status = 500,
      stringResponse = 'Internal Server Error',
      sentryBehavior = SENTRY_BEHAVIOR.DEFAULT,
    }: {
      // status code for HTTP response
      status?: number;
      // string content for HTTP response
      stringResponse?: string;
      // sets sentry reporting behavior
      sentryBehavior?: SENTRY_BEHAVIOR;
    } = {
      status: 500,
      stringResponse: 'Internal Server Error',
      sentryBehavior: SENTRY_BEHAVIOR.DEFAULT,
    }
  ) {
    super(message);
    this.status = status;
    this.stringResponse = stringResponse;
    this.sentryBehavior = sentryBehavior;
  }

  static SENTRY_BEHAVIOR = SENTRY_BEHAVIOR;
}
