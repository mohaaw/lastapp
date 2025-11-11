/**
 * purchase-order controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::purchase-order.purchase-order', ({ strapi }) => ({
  async receive(ctx) {
    const { id } = ctx.params;
    
    try {
      // Find the purchase order with its items
      const purchaseOrder = await strapi.db.query('api::purchase-order.purchase-order').findOne({
        where: { id },
        populate: ['items', 'items.productVariant'],
      });

      if (!purchaseOrder) {
        return ctx.notFound('Purchase order not found');
      }

      // Get inventory settings to find default warehouse
      const inventorySettings = await strapi.db.query('api::inventory-setting.inventory-setting').findOne({
        where: {}
      });

      if (!inventorySettings || !inventorySettings.defaultWarehouse) {
        return ctx.badRequest('Default warehouse not configured in inventory settings');
      }

      // Find supplier location (isSupplierLocation = true)
      const supplierLocation = await strapi.db.query('api::stock-location.stock-location').findOne({
        where: { isSupplierLocation: true }
      });

      if (!supplierLocation) {
        return ctx.badRequest('Supplier location not found. Please configure a location with isSupplierLocation=true');
      }

      // Find the default warehouse location
      const warehouseLocation = await strapi.db.query('api::stock-location.stock-location').findOne({
        where: { name: inventorySettings.defaultWarehouse }
      });

      if (!warehouseLocation) {
        return ctx.badRequest(`Default warehouse location '${inventorySettings.defaultWarehouse}' not found`);
      }

      // Process each purchase order item
      for (const item of purchaseOrder.items) {
        // Create a stock move record
        await strapi.db.query('api::stock-move.stock-move').create({
          data: {
            quantity: item.quantity,
            product_variant: item.productVariant.id,
            from_location: supplierLocation.id,
            to_location: warehouseLocation.id,
          },
        });
      }

      // Update purchase order status to "received"
      await strapi.db.query('api::purchase-order.purchase-order').update({
        where: { id },
        data: { status: 'received' },
      });

      ctx.body = { 
        message: 'Purchase order received successfully', 
        purchaseOrder: { ...purchaseOrder, status: 'received' } 
      };
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      ctx.badRequest('Error receiving purchase order', error.message);
    }
  },
}));
