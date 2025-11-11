import type { Schema, Struct } from '@strapi/strapi';

export interface SettingsTaxRates extends Struct.ComponentSchema {
  collectionName: 'components_settings_tax_rates';
  info: {
    displayName: 'Tax Rate';
    icon: 'percent';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    rate: Schema.Attribute.Decimal & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'settings.tax-rates': SettingsTaxRates;
    }
  }
}
