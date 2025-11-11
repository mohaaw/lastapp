<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ $t('printingSettings.printingSettings') }}</div>
        <div class="text-subtitle2">{{ $t('printingSettings.configurePrinting') }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="saveSettings" class="q-gutter-md">
          <q-input v-model="form.invoiceHeader" :label="$t('printingSettings.invoiceHeader')" filled type="textarea" rows="3" />
          <q-input v-model="form.invoiceFooter" :label="$t('printingSettings.invoiceFooter')" filled type="textarea" rows="3" />
          <!-- TODO: Add q-file for logoForPrint -->
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

interface PrintingSettings {
  invoiceHeader: string;
  invoiceFooter: string;
}

const $q = useQuasar();
const form = ref<Partial<PrintingSettings>>({});

const endpoint = 'printing-setting';

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
