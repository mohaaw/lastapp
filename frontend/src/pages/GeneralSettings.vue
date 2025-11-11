<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ $t('generalSettings.generalSettings') }}</div>
        <div class="text-subtitle2">{{ $t('generalSettings.configureGeneralShopDetails') }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="saveSettings" class="q-gutter-md">
          <q-input v-model="form.shopName" :label="$t('generalSettings.shopName')" filled />
          <q-input v-model="form.address" :label="$t('generalSettings.address')" filled />
          <q-input v-model="form.phone" :label="$t('generalSettings.phone')" filled />
          <q-input v-model="form.email" :label="$t('generalSettings.email')" type="email" filled />
          <q-input v-model="form.taxID" :label="$t('generalSettings.taxID')" filled />
          <!-- TODO: Add q-file for shopLogo -->
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

interface GeneralSettings {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  taxID: string;
}

const $q = useQuasar();
const form = ref<Partial<GeneralSettings>>({});

const endpoint = 'general-setting';

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
