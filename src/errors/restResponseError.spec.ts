import { RestResponseError, SENTRY_BEHAVIOR } from './restResponseError';

describe('RestResponseError', () => {
  it('contains a 500 response by default', () => {
    const error = new RestResponseError('ahh!', {});
    expect(error instanceof Error).toBeTruthy();
    expect(error.message).toEqual('ahh!');
    expect(error.status).toEqual(500);
    expect(error.stringResponse).toEqual('Internal Server Error');
    expect(error.sentryBehavior).toEqual(SENTRY_BEHAVIOR.DEFAULT);
  });

  it('allows setting non-default values', () => {
    const error = new RestResponseError('hmm?', {
      status: 401,
      stringResponse: 'Unauthorized',
      sentryBehavior: SENTRY_BEHAVIOR.SUPPRESS,
    });
    expect(error.message).toEqual('hmm?');
    expect(error.status).toEqual(401);
    expect(error.stringResponse).toEqual('Unauthorized');
    expect(error.sentryBehavior).toEqual(SENTRY_BEHAVIOR.SUPPRESS);
  });

  it('has flexible initialization', () => {
    const error1 = new RestResponseError('no options are required');
    expect(error1.status).toEqual(500);
    expect(error1.stringResponse).toEqual('Internal Server Error');
    expect(error1.sentryBehavior).toEqual(SENTRY_BEHAVIOR.DEFAULT);

    const error2 = new RestResponseError('empty options are okay');
    expect(error2.status).toEqual(500);
    expect(error2.stringResponse).toEqual('Internal Server Error');
    expect(error2.sentryBehavior).toEqual(SENTRY_BEHAVIOR.DEFAULT);

    const error3 = new RestResponseError('partial options are okay, too', {
      status: 424,
    });
    expect(error3.status).toEqual(424);
    expect(error3.stringResponse).toEqual('Internal Server Error');
    expect(error3.sentryBehavior).toEqual(SENTRY_BEHAVIOR.DEFAULT);
  });
});
