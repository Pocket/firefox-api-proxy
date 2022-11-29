import express, { Request, Response } from 'express';
const router = express.Router();

import WebSessionAuth from '../../auth/web-session';
import { paths } from '../../generated/openapi/types';

type RecentSavesResponse =
  paths['/desktop/v1/recent-saves']['get']['responses']['200']['content']['application/json'];

router
  // User must be authenticated via WebSession
  .use(WebSessionAuth)
  // getRecentSaves v1
  .get('/v1/recent-saves', async (req: Request, res: Response) => {
    // mock response for initial deployment
    const mock: RecentSavesResponse = {
      data: [
        {
          __typename: 'Save',
          id: '3687988353',
          resolvedUrl:
            'https://getpocket.com/collections/how-a-500-000-word-harry-potter-fanfiction-blew-up-online',
          givenUrl:
            'https://getpocket.com/collections/how-a-500-000-word-harry-potter-fanfiction-blew-up-online',
          title: 'How a 500,000-Word Harry Potter Fanfiction Blew Up Online',
          excerpt: 'View Original',
          domain: '',
          wordCount: 0,
          timeToRead: 0,
          topImageUrl:
            'https://pocket-image-cache.com/1200x/filters:format(jpg):extract_focal()/https%3A%2F%2Fs3.amazonaws.com%2Fpocket-collectionapi-prod-images%2F6df1efac-c93a-4e40-b14d-d8b99a943c10.jpeg',
        },
        {
          __typename: 'Save',
          id: '3711887929',
          resolvedUrl:
            'https://tastecooking.com/a-maximalist-new-wave-for-instant-noodles/',
          givenUrl:
            'https://tastecooking.com/a-maximalist-new-wave-for-instant-noodles/',
          title: 'A Maximalist New Wave for Instant Noodles',
          excerpt:
            'In 2020, the chef and activist Jenny Dorsey spotted a video about a viral food trend in China: luosifen, affectionately known as “stinky” or “smelly” snail noodles.',
          domain: '',
          wordCount: 1963,
          timeToRead: 9,
          topImageUrl:
            'https://tastecooking.com/wp-content/uploads/2022/09/TASTE_instant_ramen_1200-x-628.jpg',
        },
        {
          __typename: 'Save',
          id: '3732682203',
          resolvedUrl:
            'https://getpocket.com/collections/the-way-out-of-a-disaster-is-with-each-otherand-bikes',
          givenUrl:
            'https://getpocket.com/collections/the-way-out-of-a-disaster-is-with-each-otherand-bikes',
          title: 'The Way Out of a Disaster Is with Each Other—and Bikes',
          excerpt: 'View Original',
          domain: '',
          wordCount: 0,
          timeToRead: 0,
          topImageUrl:
            'https://pocket-image-cache.com/1200x/filters:format(jpg):extract_focal()/https%3A%2F%2Fs3.amazonaws.com%2Fpocket-collectionapi-prod-images%2F3234eb1c-fc4d-4623-b93e-d1bb5c93ee0a.png',
        },
      ],
    };
    res.json(mock);
  });

export default router;
