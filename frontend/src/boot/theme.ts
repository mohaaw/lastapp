import { boot } from 'quasar/wrappers';
import { useQuasar } from 'quasar';
import { i18n } from './i18n';

export default boot(() => {
  const $q = useQuasar();

  // Load saved language from localStorage
  const savedLocale = localStorage.getItem('app-locale') || 'en-US';
  if (i18n.global.locale && (savedLocale === 'en-US' || savedLocale === 'ar-EG')) {
    i18n.global.locale.value = savedLocale;
  }

  // Load Quasar language (only en-US is loaded, ar-EG will use i18n)
  if (savedLocale === 'ar-EG') {
    void import('quasar/lang/en-US').then((lang) => {
      $q.lang.set(lang.default);
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }).catch(err => console.error('Failed to load language:', err));
  } else {
    void import('quasar/lang/en-US').then((lang) => {
      $q.lang.set(lang.default);
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }).catch(err => console.error('Failed to load language:', err));
  }

  // Load saved theme colors from localStorage
  const savedPrimaryColor = localStorage.getItem('theme-primary-color') || '#1976D2';
  const savedSecondaryColor = localStorage.getItem('theme-secondary-color') || '#26A69A';
  const savedBackgroundColor = localStorage.getItem('theme-background-color') || '#FFFFFF';
  const savedTextColor = localStorage.getItem('theme-text-color') || '#000000';

  // Apply theme colors using CSS variables
  document.documentElement.style.setProperty('--q-primary', savedPrimaryColor);
  document.documentElement.style.setProperty('--q-secondary', savedSecondaryColor);
  document.documentElement.style.setProperty('--q-color-light', savedBackgroundColor);
  document.documentElement.style.setProperty('--q-color-dark', savedTextColor);
});
