/**
 * Common definitions for reused mock components.
 *
 * Different graph models in different domains sometimes have different
 * names despite containing approximately the same data. These try to
 * provide common logical components of responses in places where we
 * want similar mocks across multiple queries.
 */

import { faker } from '@faker-js/faker';

export default Object.freeze({
  /**
   * This is a string representation of a number, common across items and recommendations.
   */
  pocketID: () => faker.datatype.number().toString(),
  itemUrl: () => faker.internet.url(),
  itemImage: () => faker.image.imageUrl(),
  itemTitle: () => faker.lorem.lines(1),
  itemExcerpt: () => faker.lorem.paragraph(),
  itemDomain: () => faker.internet.url(),
});
