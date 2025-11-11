<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Financial Settings</div>
        <div class="text-subtitle2">Configure currency, fiscal year, and tax rates.</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="saveSettings" class="q-gutter-md">
          <q-input v-model="form.defaultCurrency" label="Default Currency" filled />
          <q-input v-model="form.fiscalYearStart" label="Fiscal Year Start" filled type="date" stack-label />

          <div class="q-pt-md text-h6">Tax Rates</div>
          <div v-for="(taxRate, index) in form.taxRates" :key="index" class="row items-center q-gutter-sm q-mb-sm">
            <q-input v-model="taxRate.name" label="Tax Name" filled class="col" />
            <q-input v-model.number="taxRate.rate" label="Rate (%)" type="number" step="0.01" filled class="col" />
            <q-btn icon="delete" flat round dense @click="removeTaxRate(index)" />
          </div>
          <q-btn label="Add Tax Rate" color="primary" outline @click="addTaxRate" />

          <div class="q-pt-xl">
            <q-btn label="Save" type="submit" color="primary" />
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

interface TaxRate {
  id?: number;
  name: string;
  rate: number;
}

interface FinancialSettings {
  defaultCurrency: string;
  fiscalYearStart: string;
  taxRates: TaxRate[];
}

const $q = useQuasar();
const form = ref<Partial<FinancialSettings>>({ taxRates: [] });

const endpoint = 'financial-setting';

const addTaxRate = () => {
  form.value.taxRates?.push({ name: '', rate: 0 });
};

const removeTaxRate = (index: number) => {
  form.value.taxRates?.splice(index, 1);
};

const fetchSettings = async () => {
  try {
    const response = await api.get(endpoint);
    if (response.data && response.data.data) {
      const settings = response.data.data.attributes;
      // Ensure taxRates is an array even if it's null from the API
      settings.taxRates = settings.taxRates ?? [];
      form.value = settings;
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
