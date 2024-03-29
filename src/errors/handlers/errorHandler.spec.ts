import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';

import { ErrorHandler } from './errorHandler';
import { RestResponseError } from '../restResponseError';

describe('ErrorHandler', () => {
  describe('custom default error', () => {
    // set up server for testing
    const app = express();
    app.get('/bad', (req: Request, res: Response, next: NextFunction) => {
      // return something that isn't even an error
      return next(0);
    });
    app.get('/unhandled', (req: Request, res: Response, next: NextFunction) => {
      // return a node Error
      return next(new Error('this could be an unhandled error from a library'));
    });
    app.get('/handled', (req: Request, res: Response, next: NextFunction) => {
      // return a RestResponseError
      return next(
        new RestResponseError('Error message for sentry', {
          status: 401,
          stringResponse: 'response for the end user',
        })
      );
    });
    app.get('/good', (req: Request, res: Response, next: NextFunction) => {
      // set a status code and response
      res.status(200);
      res.send('nice');
      return next();
    });
    // register error handler as terminal middleware with non default error
    app.use(
      ErrorHandler({
        defaultError: new RestResponseError('non default', {
          status: 500,
          stringResponse: 'non-default default error response',
        }),
      })
    );

    it('returns a default 404 error if a route calls next on a non-error type', async () => {
      // just documenting some weird edge behavior
      const res = await request(app).get('/bad').send();

      expect(res.status).toEqual(404);
    });

    it('returns custom default error if it handles an Error', async () => {
      const res = await request(app).get('/unhandled').send();

      expect(res.status).toEqual(500);
      expect(res.res.text).toEqual('non-default default error response');
    });

    it('returns the handled error if it receives a RestResponseError', async () => {
      const res = await request(app).get('/handled').send();

      expect(res.status).toEqual(401);
      expect(res.res.text).toEqual('response for the end user');
    });

    it('does nothing in non-error cases', async () => {
      const res = await request(app).get('/good').send();

      expect(res.status).toEqual(200);
      expect(res.res.text).toEqual('nice');
    });
  });

  describe('errorCallback', () => {
    let handlerErr;
    let handlerReq;
    let handlerRes;
    let callbackErr;
    let callbackReq;
    let callbackRes;

    const app = express();
    app.get(
      '/unhandled',
      (req: Request, res: Response, next: NextFunction): void => {
        handlerErr = new Error('this is an unhandled error');
        handlerReq = req;
        handlerRes = res;
        return next(handlerErr);
      }
    );
    app.use(
      ErrorHandler({
        errorCallback: (err: Error, req: Request, res: Response) => {
          callbackErr = err;
          callbackReq = req;
          callbackRes = res;
          return;
        },
      })
    );
    it('executes errorCallback if one is provided', async () => {
      await request(app).get('/unhandled').send();
      expect(handlerErr).toBe(callbackErr);
      expect(handlerReq).toBe(callbackReq);
      expect(handlerRes).toBe(callbackRes);
    });
  });

  describe('default default error', () => {
    // set up a smaller test server to test default handler behavior
    const app = express();
    app.get(
      '/unhandled',
      (req: Request, res: Response, next: NextFunction): void => {
        return next(
          new Error('this could be an unhandled error from a library')
        );
      }
    );
    app.use(ErrorHandler());
    it('returns default default error if it handles a non-Error', async () => {
      const res = await request(app).get('/unhandled').send();

      expect(res.status).toEqual(500);
      expect(res.res.text).toEqual('Internal Server Error');
    });
  });
});
