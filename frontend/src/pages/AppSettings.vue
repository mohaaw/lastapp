<template>
  <q-page padding>
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">{{ $t('appSettings.applicationSettings') }}</div>
        <div class="text-subtitle2">{{ $t('appSettings.configureLanguageTheme') }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-md">
        <!-- Language Selector -->
        <div>
          <div class="text-subtitle1 q-mb-md">{{ $t('appSettings.language') }}</div>
          <q-select
            filled
            v-model="selectedLanguage"
            :options="languageOptions"
            @update:model-value="changeLanguage"
            emit-value
            map-options
            option-value="value"
            option-label="label"
          />
        </div>

        <!-- Theme Colors -->
        <div>
          <div class="text-subtitle1 q-mb-md">{{ $t('appSettings.themeColors') }}</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="q-mb-sm">{{ $t('appSettings.primaryColor') }}</div>
              <div class="flex items-center">
                <q-color v-model="primaryColor" @update:model-value="updateThemeColor('primary', primaryColor)" />
                <span class="q-ml-md text-mono">{{ primaryColor }}</span>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="q-mb-sm">{{ $t('appSettings.secondaryColor') }}</div>
              <div class="flex items-center">
                <q-color v-model="secondaryColor" @update:model-value="updateThemeColor('secondary', secondaryColor)" />
                <span class="q-ml-md text-mono">{{ secondaryColor }}</span>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="q-mb-sm">{{ $t('appSettings.backgroundColor') }}</div>
              <div class="flex items-center">
                <q-color v-model="backgroundColor" @update:model-value="updateThemeColor('background', backgroundColor)" />
                <span class="q-ml-md text-mono">{{ backgroundColor }}</span>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="q-mb-sm">{{ $t('appSettings.textColor') }}</div>
              <div class="flex items-center">
                <q-color v-model="textColor" @update:model-value="updateThemeColor('text', textColor)" />
                <span class="q-ml-md text-mono">{{ textColor }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reset Button -->
        <div class="q-pt-md">
          <q-btn :label="$t('appSettings.resetToDefaults')" color="warning" outline @click="resetTheme" />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { i18n } from 'boot/i18n';

const $q = useQuasar();

const languageOptions = [
  { label: 'English', value: 'en-US' },
  { label: 'العربية (Arabic)', value: 'ar-EG' },
];

const selectedLanguage = ref<'en-US' | 'ar-EG'>((localStorage.getItem('app-locale') || 'en-US') as 'en-US' | 'ar-EG');

const primaryColor = ref(localStorage.getItem('theme-primary-color') || '#1976D2');
const secondaryColor = ref(localStorage.getItem('theme-secondary-color') || '#26A69A');
const backgroundColor = ref(localStorage.getItem('theme-background-color') || '#FFFFFF');
const textColor = ref(localStorage.getItem('theme-text-color') || '#000000');

const changeLanguage = (newLanguage: 'en-US' | 'ar-EG') => {
  localStorage.setItem('app-locale', newLanguage);
  if (i18n.global.locale) {
    i18n.global.locale.value = newLanguage;
  }

  // Load Quasar language pack (only en-US available, ar-EG uses i18n)
  if (newLanguage === 'ar-EG') {
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
};

const updateThemeColor = (colorType: string, colorValue: string) => {
  const cssVariableMap: Record<string, string> = {
    primary: '--q-primary',
    secondary: '--q-secondary',
    background: '--q-color-light',
    text: '--q-color-dark',
  };

  const cssVar = cssVariableMap[colorType];
  if (cssVar) {
    document.documentElement.style.setProperty(cssVar, colorValue);
    localStorage.setItem(`theme-${colorType}-color`, colorValue);
  }
};

const resetTheme = () => {
  primaryColor.value = '#1976D2';
  secondaryColor.value = '#26A69A';
  backgroundColor.value = '#FFFFFF';
  textColor.value = '#000000';

  updateThemeColor('primary', primaryColor.value);
  updateThemeColor('secondary', secondaryColor.value);
  updateThemeColor('background', backgroundColor.value);
  updateThemeColor('text', textColor.value);

  $q.notify({ color: 'positive', message: 'Theme reset to defaults' });
};

onMounted(() => {
  // Load saved theme colors
  primaryColor.value = localStorage.getItem('theme-primary-color') || '#1976D2';
  secondaryColor.value = localStorage.getItem('theme-secondary-color') || '#26A69A';
  backgroundColor.value = localStorage.getItem('theme-background-color') || '#FFFFFF';
  textColor.value = localStorage.getItem('theme-text-color') || '#000000';

  // Apply saved theme colors
  document.documentElement.style.setProperty('--q-primary', primaryColor.value);
  document.documentElement.style.setProperty('--q-secondary', secondaryColor.value);
  document.documentElement.style.setProperty('--q-color-light', backgroundColor.value);
  document.documentElement.style.setProperty('--q-color-dark', textColor.value);
});
</script>
