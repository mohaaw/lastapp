'use strict';

/**
 * stock-move service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::stock-move.stock-move');