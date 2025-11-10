'use strict';

/**
 * invoice controller
 *
 * @param {import('@strapi/strapi').Strapi} strapi
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::invoice.invoice', ({ strapi }) => ({
  async processSale(ctx) {
    const { cart, customerId } = ctx.request.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return ctx.badRequest('Cart cannot be empty.');
    }

    try {
      // Calculate total from cart items
      let total = 0;
      for (const item of cart) {
        total += item.product.price * item.quantity;
      }

      // Create the Invoice
      const invoice = await strapi.service('api::invoice.invoice').create({
        data: {
          total: total,
          customer: customerId ? customerId : null, // Link customer if provided
          status: 'completed', // Assuming immediate completion for POS
          sale_date: new Date(),
          publishedAt: new Date(), // Publish immediately
        },
      });

      // Create Invoice Items and update product stock
      const invoiceItems = [];
      for (const item of cart) {
        const subtotal = item.product.price * item.quantity;
        const invoiceItem = await strapi.service('api::invoice-item.invoice-item').create({
          data: {
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            subtotal: subtotal,
            invoice: invoice.id,
            product: item.product.id, // Link to original product
            publishedAt: new Date(), // Publish immediately
          },
        });
        invoiceItems.push(invoiceItem);

        // Update product stock
        const product = await strapi.entityService.findOne('api::product.product', item.product.id);
        if (product) {
          const newStock = product.stock - item.quantity;
          await strapi.entityService.update('api::product.product', item.product.id, {
            data: {
              stock: newStock >= 0 ? newStock : 0, // Prevent negative stock
            },
          });
        }
      }

      // Link invoice items to the invoice (if not done automatically by Strapi)
      // This step might be redundant depending on Strapi's relation handling, but good for explicit linking
      await strapi.service('api::invoice.invoice').update(invoice.id, {
        data: {
          invoice_items: invoiceItems.map(item => item.id),
        },
      });


      return { invoice, invoiceItems };

    } catch (err) {
      strapi.log.error('Error processing sale:', err);
      return ctx.internalServerError('Failed to process sale.', { details: err.message });
    }
  },

  async getDashboardStats(ctx) {
    try {
      const totalSalesResult = await strapi.db.query('api::invoice.invoice').sum('total');
      const totalSales = totalSalesResult ? parseFloat(totalSalesResult) : 0;

      // Calculate Total Inventory Value
      const products = await strapi.entityService.findMany('api::product.product', {
        fields: ['price', 'stock', 'cost'],
      });
      let totalInventoryValue = 0;
      let totalPotentialProfit = 0;
      products.forEach(product => {
        totalInventoryValue += product.price * product.stock;
        totalPotentialProfit += (product.price - (product.cost || 0)) * product.stock; // Use cost if available
      });

      // Calculate Total Profit from sales (requires fetching invoice items)
      const completedInvoices = await strapi.entityService.findMany('api::invoice.invoice', {
        filters: { status: 'completed' },
        populate: { invoice_items: { populate: ['product'] } },
      });

      let totalActualProfit = 0;
      completedInvoices.forEach(invoice => {
        invoice.invoice_items.forEach(item => {
          const productCost = item.product && item.product.cost ? item.product.cost : 0;
          totalActualProfit += (item.price - productCost) * item.quantity;
        });
      });


      return {
        totalSales: totalSales.toFixed(2),
        totalProfit: totalActualProfit.toFixed(2),
        totalInventoryValue: totalInventoryValue.toFixed(2),
        totalPotentialProfit: totalPotentialProfit.toFixed(2),
      };

    } catch (err) {
      strapi.log.error('Error fetching dashboard stats:', err);
      return ctx.internalServerError('Failed to fetch dashboard statistics.', { details: err.message });
    }
  },
}));
