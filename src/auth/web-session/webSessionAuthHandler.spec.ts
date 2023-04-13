import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';

import WebSessionAuthHandler from './webSessionAuthHandler';
import { WebSessionAuth } from './webSessionAuth';
import { WebAuth } from '../types';
import { ErrorHandler } from '../../errors/handlers/errorHandler';

// set up required express middlewares
const app = express();
app.use((req: Request, res: Response, next: NextFunction): void => {
  // initialize empty sentryTags, this is done by server.ts normally
  // since it extends the express types, but we don't need all that
  // weight here.
  req.user = {};
  return next();
});
app.use(cookieParser());
app.use(WebSessionAuthHandler);

let auth: WebAuth;
let userTags: Record<string, string>;

app.get('/authenticated', (req: express.Request, res: express.Response) => {
  auth = req.auth;
  userTags = req.user;
  res.status(200).json({ yay: true });
});
app.use(ErrorHandler());

describe('WebSessionAuthHandler', () => {
  const cookies = {
    a95b4b6: 'tag appropriate user identifier',
    d4a79ec: 'secret session identifier',
    '159e76e': 'secret lookup identifier',
  };
  const buildHeaders = (cookies) => ({
    cookie: Object.entries(cookies)
      .reduce((acc, [key, value]) => {
        return acc + ` ${key}=${value};`;
      }, '')
      .trim(),
  });

  beforeEach(() => {
    // separate describes ensure these do not clash over
    // auth contents, also WebSessionAuthHandler rejects before
    // route handler as well.
    auth = undefined;
    userTags = undefined;
  });

  describe('happy path', () => {
    it('populates auth on express Request if all auth cookies are present', async () => {
      const res = await request(app)
        .get('/authenticated')
        .set(buildHeaders(cookies))
        .send();

      expect(res.status).toEqual(200);
      expect(auth).toBeInstanceOf(WebSessionAuth);
      expect(userTags).toEqual({
        id: 'tag appropriate user identifier',
      });
    });
  });
});
