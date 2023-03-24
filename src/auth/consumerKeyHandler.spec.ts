import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

import ConsumerKeyHandler from './consumerKeyHandler';

// set up required express middlewares
const app = express();
app.use(cookieParser());
app.use(ConsumerKeyHandler);

let consumer_key: string;

app.get('/anything', (req: express.Request, res: express.Response) => {
  consumer_key = req.consumer_key;
  res.status(200).json({ yay: true });
});

const headers = {
  consumer_key: 'someConsumerKey',
};

describe('ConsumerKeyHandler', () => {
  beforeEach(() => {
    // separate describes ensure these do not clash over
    // consumer_key contents, also ConsumerKeyHandler rejects before
    // route handler as well.
    consumer_key = undefined;
  });
  describe('unhappy path', () => {
    it('returns a 401 status error if no consumer_key is present', async () => {
      const res = await request(app)
        .get('/anything')
        // no headers are set
        .send();

      expect(consumer_key).toBeUndefined();
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
    it('populates consumer_key on express Request if present', async () => {
      const res = await request(app).get('/anything').set(headers).send();

      expect(res.status).toEqual(200);
      expect(consumer_key).toEqual(headers.consumer_key);
    });
  });
});
