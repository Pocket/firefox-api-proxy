import express, { Request, Response } from 'express';
const router = express.Router();
import * as Sentry from '@sentry/node';

import WebSessionAuth from '../../../auth/web-session';
import recentSaves from '../../../graphql-proxy/recent-saves/recent-saves';
import { handleQueryParameters } from './inputs';
import { responseTransformer } from './response';
import { components, paths } from '../../../generated/openapi/types';
import { RecentSavesQueryVariables } from '../../../generated/graphql/types';

type RecentSavesResponse =
  paths['/desktop/v1/recent-saves']['get']['responses']['200']['content']['application/json'];

type APIErrorResponse = components['schemas']['ErrorResponse'];

router
  // User must be authenticated via WebSession
  .use(WebSessionAuth)
  // getRecentSaves v1
  .get('/v1/recent-saves', async (req: Request, res: Response) => {
    try {
      const variables = handleQueryParameters(req.query);

      if ((variables as APIErrorResponse).errors) {
        res.status(400).json(variables);
        return;
      }

      const graphRes = await recentSaves(
        req.auth,
        variables as RecentSavesQueryVariables
      );

      res.json(responseTransformer(graphRes) as RecentSavesResponse);
    } catch (error) {
      // this catch only handles unexpected errors
      // capture error in sentry
      Sentry.captureException(error);
      // send anonymized error to the client
      const errorResponse: APIErrorResponse = {
        errors: [
          {
            // if you are finding this by this id, there is a corresponding sentry
            // error with more details about the cause
            id: 'b72a283e-fd06-4792-aa00-3e0137195cb6',
            status: '500',
            title: 'Bad Implementation',
            detail:
              'This service encountered an error it does not know how to handle',
          },
        ],
      };
      res.json(errorResponse);
      return;
    }
  });

export default router;
