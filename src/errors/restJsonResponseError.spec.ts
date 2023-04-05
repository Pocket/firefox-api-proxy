import { RestJsonResponseError } from './restJsonResponseError';
import { RestResponseError, SENTRY_BEHAVIOR } from './restResponseError';

// create a structured response type
type StructuredResponse = {
  errorIdentifier: string;
  status: string;
  code: string;
};

// make a RestJsonResponseError that only accepts StructuredResponse
const StructuredResponseError = RestJsonResponseError<StructuredResponse>;

describe('RestJsonResponseError', () => {
  it('behaves like a RestResponseError, but with JSON responses', () => {
    const res: StructuredResponse = {
      errorIdentifier: 'abc',
      status: 'abnormal',
      code: 'XYZ',
    };
    const error = new StructuredResponseError('okay', {
      status: 418,
      jsonResponse: res,
      sentryBehavior: SENTRY_BEHAVIOR.FORCE,
    });
    expect(error instanceof Error).toBeTruthy();
    expect(error instanceof RestResponseError).toBeTruthy();
    expect(error.message).toEqual('okay');
    expect(error.status).toEqual(418);
    expect(error.stringResponse).toEqual(JSON.stringify(res));
    expect(error.sentryBehavior).toEqual(SENTRY_BEHAVIOR.FORCE);
  });
});
