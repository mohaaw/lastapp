'use strict';

/**
 * invoice router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::invoice.invoice', {
  routes: [
    {
      method: 'POST',
      path: '/invoices/process-sale',
      handler: 'invoice.processSale',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/invoices/dashboard-stats',
      handler: 'invoice.getDashboardStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
});
