import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

import WebSessionAuthHandler from './webSessionAuthHandler';
import { WebSessionAuth } from './webSessionAuth';
import { WebAuth } from '../types';

// set up required express middlewares
const app = express();
app.use(cookieParser());
app.use(WebSessionAuthHandler);

let auth: WebAuth;

app.get('/authenticated', (req: express.Request, res: express.Response) => {
  auth = req.auth;
  res.status(200).json({ yay: true });
});

describe('WebSessionAuthHandler', () => {
  const cookies = {
    sess_guid: 'someCookie1',
    a95b4b6: 'someCookie2',
    d4a79ec: 'someCookie3',
    '159e76e': 'someCookie4',
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
  });

  describe('unhappy path', () => {
    it('returns 401 status error if no consumer_key is present', async () => {
      // remove sess_guid
      const requestCookies = { ...cookies };
      delete requestCookies.sess_guid;

      const res = await request(app)
        .get('/authenticated')
        .set(buildHeaders(requestCookies))
        .send();

      expect(auth).toBeUndefined();
      expect(res.status).toEqual(401);
      expect(res.text).toBeTruthy();
      const errors = JSON.parse(res.text);
      expect(errors).toStrictEqual(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              status: '401',
              title: 'Unauthorized',
            }),
          ]),
        })
      );
    });
  });

  describe('happy path', () => {
    it('populates auth on express Request if all auth cookies are present', async () => {
      const res = await request(app)
        .get('/authenticated')
        .set(buildHeaders(cookies))
        .send();

      expect(res.status).toEqual(200);
      expect(auth).toBeInstanceOf(WebSessionAuth);
    });
  });
});
