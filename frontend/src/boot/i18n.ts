import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import enUS from '../i18n/en-US';
import arEG from '../i18n/ar-EG';

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('app-locale') || 'en-US',
  globalInjection: true,
  messages: {
    'en-US': enUS,
    'ar-EG': arEG,
  },
});

export default boot(({ app }) => {
  app.use(i18n);
});

export { i18n };
