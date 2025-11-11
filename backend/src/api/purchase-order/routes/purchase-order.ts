/**
 * purchase-order routes
 */

import { factories } from '@strapi/strapi';

export default {
  type: 'content-api',
  routes: [
    // Core routes
    ...factories.createCoreRouter('api::purchase-order.purchase-order').routes,
    
    // Custom route: POST /api/purchase-orders/:id/receive
    {
      method: 'POST',
      path: '/purchase-orders/:id/receive',
      handler: 'purchase-order.receive',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
