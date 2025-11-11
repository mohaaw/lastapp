import type { I18n } from 'vue-i18n';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    readonly $t: typeof I18n.prototype.global.t;
    readonly $i18n: I18n;
  }
}

export {};
