<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">General Settings</div>
        <div class="text-subtitle2">Configure general shop details.</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="saveSettings" class="q-gutter-md">
          <q-input v-model="form.shopName" label="Shop Name" filled />
          <q-input v-model="form.address" label="Address" filled />
          <q-input v-model="form.phone" label="Phone" filled />
          <q-input v-model="form.email" label="Email" type="email" filled />
          <q-input v-model="form.taxID" label="Tax ID" filled />
          <!-- TODO: Add q-file for shopLogo -->
          <div class="q-pt-md">
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
