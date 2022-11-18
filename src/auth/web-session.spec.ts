import { NextFunction, Request, Response } from 'express';

import WebSessionAuth from './web-session';

describe('web-session', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = jest.fn();

  const cookies = {
    sess_guid: 'someCookie1',
    a95b4b6: 'someCookie2',
    d4a79ec: 'someCookie3',
    '159e76e': 'someCookie4',
  };
  const headers = {
    consumer_key: 'someKey',
    cookie: Object.entries(cookies)
      .reduce((acc, [key, value]) => {
        return acc + ` ${key}=${value};`;
      }, '')
      .trim(),
  };

  beforeEach(() => {
    mockRequest = {
      cookies: { ...cookies },
      headers: { ...headers },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('returns 401 status error if no sess_guid', () => {
    delete mockRequest.cookies.sess_guid;
    WebSessionAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction
    );

    expect(nextFunction).toBeCalledTimes(0);
    expect(mockResponse.status).toBeCalledWith(401);
    expect(mockResponse.json).toBeCalledWith(
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

  it('returns 401 status error if no a95b4b6', () => {
    delete mockRequest.cookies.a95b4b6;

    WebSessionAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction
    );

    expect(nextFunction).toBeCalledTimes(0);
    expect(mockResponse.status).toBeCalledWith(401);
    expect(mockResponse.json).toBeCalledWith(
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

  it('returns 401 status error if no d4a79ec', () => {
    delete mockRequest.cookies.d4a79ec;

    WebSessionAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction
    );

    expect(nextFunction).toBeCalledTimes(0);
    expect(mockResponse.status).toBeCalledWith(401);
    expect(mockResponse.json).toBeCalledWith(
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

  it('returns 401 status error if no 159e76e', () => {
    delete mockRequest.cookies['159e76e'];

    WebSessionAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction
    );

    expect(nextFunction).toBeCalledTimes(0);
    expect(mockResponse.status).toBeCalledWith(401);
    expect(mockResponse.json).toBeCalledWith(
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

  it('returns 401 status error if no consumer_key', () => {
    delete mockRequest.headers.consumer_key;

    WebSessionAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction
    );

    expect(nextFunction).toBeCalledTimes(0);
    expect(mockResponse.status).toBeCalledWith(401);
    expect(mockResponse.json).toBeCalledWith(
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

  it('populates WebSessionAuth if all auth is present', () => {
    WebSessionAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction
    );

    expect(nextFunction).toBeCalledTimes(1);
    expect(mockRequest.auth).toEqual({
      cookie: headers.cookie,
      consumer_key: headers.consumer_key,
    });
  });
});
