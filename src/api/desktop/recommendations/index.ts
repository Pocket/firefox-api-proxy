import express, { NextFunction, Request, Response } from 'express';
import config from '../../../config';
import CacheControlHandler from '../../lib/cacheControlHandler';
import ConsumerKeyHandler from '../../../auth/consumerKeyHandler';
import { GraphQLErrorHandler } from '../../error/graphQLErrorHandler';
import { handleQueryParameters } from './inputs';
import { BFFFxError } from '../../../bfffxError';
import Recommendations from '../../../graphql-proxy/recommendations/recommendations';
import { RecommendationsResponse, responseTransformer } from './response';

const router = express.Router();

router.get(
  '/v1/recommendations',
  // request must include a consumer
  ConsumerKeyHandler,
  CacheControlHandler('public, max-age=1800', config),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const variables = handleQueryParameters(req.query);

      if (variables instanceof BFFFxError) {
        return next(variables);
      }

      const graphRes = await Recommendations(variables);

      res.json(responseTransformer(graphRes) as RecommendationsResponse);
    } catch (error) {
      const responseError = GraphQLErrorHandler(error);
      return next(responseError);
    }
  }
);

export default router;
