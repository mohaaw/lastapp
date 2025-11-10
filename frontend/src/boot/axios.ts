import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $api: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below
const api = axios.create({ baseURL: 'http://localhost:1337/api' });

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$api
  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file
});

export { api };
