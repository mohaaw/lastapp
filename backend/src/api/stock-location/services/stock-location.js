'use strict';

/**
 * stock-location service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::stock-location.stock-location');