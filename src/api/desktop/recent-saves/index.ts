import express, { NextFunction, Request, Response } from 'express';
const router = express.Router();

import recentSaves from '../../../graphql-proxy/recent-saves/recent-saves';
import { handleQueryParameters } from './inputs';
import { responseTransformer } from './response';
import { paths } from '../../../generated/openapi/types';
import { RecentSavesQueryVariables } from '../../../generated/graphql/types';
import { BFFFxError } from '../../../bfffxError';
import ConsumerKeyHandler from '../../../auth/consumerKeyHandler';
import { forwardHeadersMiddleware } from '../../../graphql-proxy/lib/client';
import { GraphQLErrorHandler } from '../../error/graphQLErrorHandler';

type RecentSavesResponse =
  paths['/desktop/v1/recent-saves']['get']['responses']['200']['content']['application/json'];

router.get(
  // getRecentSaves v1
  '/v1/recent-saves',
  // request must include a consumer_key
  ConsumerKeyHandler,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const variables = handleQueryParameters(req.query);

      if (variables instanceof BFFFxError) {
        next(variables);
      }

      const graphRes = await recentSaves({
        auth: req.auth,
        consumer_key: req.consumer_key,
        forwardHeadersMiddleware: forwardHeadersMiddleware(res),
        variables: variables as RecentSavesQueryVariables,
      });

      res.json(responseTransformer(graphRes) as RecentSavesResponse);
    } catch (error) {
      const responseError = GraphQLErrorHandler(error);
      next(responseError);
    }
  }
);

export default router;
