import express, { NextFunction, Request, Response } from 'express';
const router = express.Router();

import WebSessionAuthHandler from '../../../auth/web-session/webSessionAuthHandler';
import recentSaves from '../../../graphql-proxy/recent-saves/recent-saves';
import { handleQueryParameters } from './inputs';
import { responseTransformer } from './response';
import { paths } from '../../../generated/openapi/types';
import { RecentSavesQueryVariables } from '../../../generated/graphql/types';
import { APIErrorResponse, BFFFxError } from '../../../bfffxError';
import ConsumerKeyHandler from '../../../auth/consumerKeyHandler';
import { parseGraphQLErrorMessage } from '../../../graphql-proxy/lib/util';
import { Logger, buildLogTags } from '../../../logger';

type RecentSavesResponse =
  paths['/desktop/v1/recent-saves']['get']['responses']['200']['content']['application/json'];

router.get(
  // getRecentSaves v1
  '/v1/recent-saves',
  // request must include a consumer_key
  ConsumerKeyHandler,
  // request must be authenticated via WebSession
  WebSessionAuthHandler,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const variables = handleQueryParameters(req.query);

      if (variables instanceof BFFFxError) {
        next(variables);
      }

      const graphRes = await recentSaves(
        req.auth,
        req.consumer_key,
        variables as RecentSavesQueryVariables
      );

      res.json(responseTransformer(graphRes) as RecentSavesResponse);
    } catch (error) {
      // attempt to extract error message
      const errorMessage = `/desktop/recent-saves: Unexpected upstream GraphQL error: ${parseGraphQLErrorMessage(
        error
      )}`;
      // log error to cloudwatch
      const log = Logger(errorMessage);
      log.addTags(buildLogTags(req));
      log.addOriginalError(error);
      log.error();
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
      next(
        new BFFFxError(errorMessage, {
          status: 500,
          jsonResponse: errorResponse,
        })
      );
    }
  }
);

export default router;
