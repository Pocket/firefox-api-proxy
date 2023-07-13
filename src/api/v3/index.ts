import express, { NextFunction, Request, Response } from 'express';
import config from '../../config';
import CacheControlHandler from '../lib/cacheControlHandler';
import ConsumerKeyHandler from '../../auth/consumerKeyHandler';
import { GraphQLErrorHandler } from '../error/graphQLErrorHandler';
import { handleQueryParameters } from './inputs';
import { BFFFxError } from '../../bfffxError';
import Recommendations from '../../graphql-proxy/recommendations/recommendations';
import { forwardHeadersMiddleware } from '../../graphql-proxy/lib/client';
import { RecommendationsQueryVariables } from '../../generated/graphql/types';
import { GlobalRecsResponse, responseTransformer } from './response';

const router = express.Router();

router.get(
  '/firefox/global-recs',
  // request must include a consumer
  ConsumerKeyHandler,
  CacheControlHandler('public, max-age=1800', config),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //console.log(req)
      const variables = handleQueryParameters(req.query);

      if (variables instanceof BFFFxError) {
        return next(variables);
      }

      console.log(variables);
      const graphRes = await Recommendations({
        auth: req.auth,
        consumer_key: req.consumer_key,
        forwardHeadersMiddleware: forwardHeadersMiddleware(res),
        variables: variables as RecommendationsQueryVariables,
      });

      res.json(responseTransformer(graphRes) as GlobalRecsResponse);
    } catch (error) {
      console.log(error);
      const responseError = GraphQLErrorHandler(error);
      return next(responseError);
    }
  }
);

export default router;
