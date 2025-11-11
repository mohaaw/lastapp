<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ $t('integrationSettings.integrationSettings') }}</div>
        <div class="text-subtitle2">{{ $t('integrationSettings.configureThirdPartyIntegrations') }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="saveSettings" class="q-gutter-md">
          <q-input v-model="form.googleMapsApiKey" :label="$t('integrationSettings.googleMapsApiKey')" filled password-toggle type="password" />
          <q-input v-model="form.whatsappApiToken" :label="$t('integrationSettings.whatsappApiToken')" filled password-toggle type="password" />
          <div class="q-pt-md">
            <q-btn :label="$t('common.save')" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

interface IntegrationSettings {
  googleMapsApiKey: string;
  whatsappApiToken: string;
}

const $q = useQuasar();
const form = ref<Partial<IntegrationSettings>>({});

const endpoint = 'integration-setting';

const fetchSettings = async () => {
  try {
    const response = await api.get(endpoint);
    if (response.data && response.data.data) {
      form.value = response.data.data.attributes;
    }
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    $q.notify({
      color: 'negative',
      message: 'Failed to load settings.',
      icon: 'report_problem',
    });
  }
};

const saveSettings = async () => {
  try {
    await api.put(endpoint, { data: form.value });
    $q.notify({
      color: 'positive',
      message: 'Settings saved successfully.',
      icon: 'check',
    });
  } catch (error) {
    console.error(`Error saving ${endpoint}:`, error);
    $q.notify({
      color: 'negative',
      message: 'Failed to save settings.',
      icon: 'report_problem',
    });
  }
};

onMounted(fetchSettings);
</script>
