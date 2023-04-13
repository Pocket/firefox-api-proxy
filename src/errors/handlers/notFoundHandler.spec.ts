import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';

import { ErrorHandler } from './errorHandler';
import { RestResponseError } from '../restResponseError';
import { NotFoundHandler } from './notFoundHandler';

describe('NotFoundError', () => {
  describe('custom error', () => {
    const app = express();
    app.get('/good', (req: Request, res: Response, next: NextFunction) => {
      // set a status code and response
      res.status(200);
      res.send('nice');
      return next();
    });
    app.use(
      NotFoundHandler({
        defaultError: new RestResponseError('non default!', {
          status: 404,
          stringResponse: 'This route does not exist!',
        }),
      })
    );
    app.use(ErrorHandler());

    it('does nothing when route exists', async () => {
      const res = await request(app).get('/good').send();

      expect(res.status).toEqual(200);
      expect(res.res.text).toEqual('nice');
    });

    it('returns the custom not found error if route does not exist', async () => {
      const res = await request(app).get('/not-found').send();

      expect(res.status).toEqual(404);
      expect(res.res.text).toEqual('This route does not exist!');
    });
  });

  describe('default error', () => {
    const app = express();
    app.get('/good', (req: Request, res: Response, next: NextFunction) => {
      // set a status code and response
      res.status(200);
      res.send('nice');
      return next();
    });
    app.use(NotFoundHandler());
    app.use(ErrorHandler());
    it('does nothing when route exists', async () => {
      const res = await request(app).get('/good').send();

      expect(res.status).toEqual(200);
      expect(res.res.text).toEqual('nice');
    });

    it('returns the default not found error if route does not exist', async () => {
      const res = await request(app).get('/not-found').send();

      expect(res.status).toEqual(404);
      expect(res.res.text).toEqual('Not Found');
    });
  });
});
