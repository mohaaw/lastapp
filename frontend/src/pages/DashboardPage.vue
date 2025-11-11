<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">{{ $t('dashboard.welcome') }}</div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">{{ $t('dashboard.quickOverview') }}</div>
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-grey-2">
              <q-card-section>
                <div class="text-h6">{{ $t('dashboard.totalSales') }}</div>
                <div class="text-h4 text-primary">{{ loading ? '--' : `$${stats.totalSales}` }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-grey-2">
              <q-card-section>
                <div class="text-h6">{{ $t('dashboard.totalProfit') }}</div>
                <div class="text-h4 text-positive">{{ loading ? '--' : `$${stats.totalProfit}` }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-grey-2">
              <q-card-section>
                <div class="text-h6">{{ $t('dashboard.totalInventoryValue') }}</div>
                <div class="text-h4 text-negative">{{ loading ? '--' : `$${stats.totalInventoryValue}` }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section>
        <div class="text-h6">{{ $t('dashboard.recentActivity') }}</div>
      </q-card-section>
      <q-card-section>
        <q-list bordered separator>
          <q-item>
            <q-item-section>{{ $t('dashboard.noRecentActivity') }}</q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import axios from 'axios';

const $q = useQuasar();
const authStore = useAuthStore();

interface DashboardStats {
  totalSales: string;
  totalProfit: string;
  totalInventoryValue: string;
  totalPotentialProfit: string;
}

const stats = ref<DashboardStats>({
  totalSales: '0.00',
  totalProfit: '0.00',
  totalInventoryValue: '0.00',
  totalPotentialProfit: '0.00',
});
const loading = ref(false);

const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const response = await api.get('/invoices/dashboard-stats', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    stats.value = response.data;
  } catch (error: unknown) {
    let errorMessage = 'Failed to fetch dashboard statistics.';
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    $q.notify({ type: 'negative', message: errorMessage });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboardStats().catch(err => console.error('Error fetching dashboard stats on mount:', err));
});
</script>
