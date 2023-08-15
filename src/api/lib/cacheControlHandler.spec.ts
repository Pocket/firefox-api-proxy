import request from 'supertest';
import express from 'express';

import serverConfig from '../../config';

import CacheControlHandler from './cacheControlHandler';

// generates a new config with the specified environment, does not break
// as config changes.
const getEnvironmentConfig = (environment: string): typeof serverConfig => {
  return {
    ...serverConfig,
    app: {
      ...serverConfig.app,
      environment,
    },
  };
};

describe('CacheControlHandler', () => {
  it("does nothing if environment is 'development'", async () => {
    const config = getEnvironmentConfig('development');

    const app = express();
    app.use(CacheControlHandler('private, max-age=900', config));
    app.get('/', (req, res) => {
      res.status(200).json({ yay: true });
    });

    const res = await request(app).get('/').send();

    expect(res.status).toEqual(200);
    expect(res.headers['cache-control']).toBeUndefined();
  });

  it('sets Cache-control header for other environments', async () => {
    const config = getEnvironmentConfig('production');

    const headerValue = 'private, max-age=900';

    const app = express();
    app.use(CacheControlHandler(headerValue, config));
    app.get('/', (req, res) => {
      res.status(200).json({ yay: true });
    });

    const res = await request(app).get('/').send();

    expect(res.status).toEqual(200);
    expect(res.headers['cache-control']).toEqual(headerValue);
  });

  it('the closest handler to route implementation sets Cache-control header if multiple exist', async () => {
    const config = getEnvironmentConfig('production');

    const headerValue1 = 'private, max-age=900';
    const headerValue2 = 'max-age=900';

    const app = express();
    app.use(CacheControlHandler(headerValue1, config));
    // apply 2nd cache control handler specific to this route
    app.get('/', CacheControlHandler(headerValue2, config), (req, res) => {
      res.status(200).json({ yay: true });
    });

    const res = await request(app).get('/').send();

    expect(res.status).toEqual(200);
    expect(res.headers['cache-control']).toEqual(headerValue2);
  });
});
