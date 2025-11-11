<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <h4 class="q-my-none">{{ $t('accounting.chartOfAccounts') }}</h4>
      <q-space />
      <q-btn color="primary" :label="$t('common.add')" icon="add" @click="openAddDialog" />
    </div>

    <div v-if="loading" class="text-center q-py-lg">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <q-table
      v-else
      :rows="accounts"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :filter="filter"
    >
      <template #top-right>
        <q-input
          v-model="filter"
          borderless
          dense
          :placeholder="`${$t('common.search')}...`"
          type="search"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template #body-cell-accountType="props">
        <q-td :props="props">
          <q-chip
            :color="getTypeColor(props.row.accountType)"
            text-color="white"
            :label="$t(`accounting.accountType.${props.row.accountType}`)"
          />
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="edit"
            size="sm"
            color="info"
            @click="openEditDialog(props.row)"
          />
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="sm"
            color="negative"
            @click="confirmDelete(props.row.id)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" @hide="closeDialog">
      <q-card style="width: 500px; max-width: 90vw">
        <q-card-section class="row items-center">
          <h5 class="q-my-none">
            {{ isEditing ? $t('common.edit') : $t('common.add') }}
            {{ $t('accounting.chartOfAccount') }}
          </h5>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveAccount">
            <q-input
              v-model="editedAccount.accountName"
              :label="`${$t('accounting.accountName')} *`"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || $t('validation.required')]"
            />

            <q-input
              v-model="editedAccount.accountCode"
              :label="`${$t('accounting.accountCode')} *`"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || $t('validation.required')]"
            />

            <q-select
              v-model="editedAccount.accountType"
              :label="`${$t('accounting.accountType')} *`"
              :options="['asset', 'liability', 'equity', 'revenue', 'expense']"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || $t('validation.required')]"
            />

            <q-card-actions align="right">
              <q-btn flat :label="$t('common.cancel')" color="grey-7" @click="closeDialog" />
              <q-btn flat :label="$t('common.save')" type="submit" color="primary" :loading="saving" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { api } from 'boot/axios';
import { useAuthStore } from 'stores/auth';
import axios from 'axios';

interface ChartOfAccount {
  id: number;
  accountName: string;
  accountCode: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

const $q = useQuasar();
const authStore = useAuthStore();

const accounts = ref<ChartOfAccount[]>([]);
const loading = ref(false);
const saving = ref(false);
const filter = ref('');
const showDialog = ref(false);
const isEditing = ref(false);

const editedAccount = ref<Partial<ChartOfAccount>>({
  accountName: '',
  accountCode: '',
  accountType: 'asset',
});

const columns: QTableColumn<ChartOfAccount>[] = [
  { name: 'accountCode', label: $t('accounting.accountCode'), align: 'left', field: 'accountCode', sortable: true },
  { name: 'accountName', label: $t('accounting.accountName'), align: 'left', field: 'accountName', sortable: true },
  { name: 'accountType', label: $t('accounting.accountType.label'), align: 'left', field: 'accountType', sortable: true },
  { name: 'actions', label: $t('common.actions'), align: 'right', field: (row) => row.id },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'asset':
      return 'blue';
    case 'liability':
      return 'red';
    case 'equity':
      return 'green';
    case 'revenue':
      return 'teal';
    case 'expense':
      return 'orange';
    default:
      return 'grey';
  }
};

const fetchAccounts = async () => {
  loading.value = true;
  try {
    const response = await api.get('/chart-of-accounts', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    accounts.value = response.data.data;
  } catch (error) {
    let errorMessage = $t('accounting.failedToFetchAccounts');
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

const openAddDialog = () => {
  isEditing.value = false;
  editedAccount.value = { accountName: '', accountCode: '', accountType: 'asset' };
  showDialog.value = true;
};

const openEditDialog = (account: ChartOfAccount) => {
  isEditing.value = true;
  editedAccount.value = { ...account };
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editedAccount.value = { accountName: '', accountCode: '', accountType: 'asset' };
};

const saveAccount = async () => {
  saving.value = true;
  try {
    const data = { data: editedAccount.value };
    if (isEditing.value && editedAccount.value.id) {
      await api.put(`/chart-of-accounts/${editedAccount.value.id}`, data, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      $q.notify({ type: 'positive', message: $t('accounting.accountUpdatedSuccessfully') });
    } else {
      await api.post('/chart-of-accounts', data, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      $q.notify({ type: 'positive', message: $t('accounting.accountAddedSuccessfully') });
    }
    await fetchAccounts();
    closeDialog();
  } catch (error) {
    let errorMessage = $t('accounting.failedToSaveAccount');
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    $q.notify({ type: 'negative', message: errorMessage });
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (id: number) => {
  $q.dialog({
    title: $t('common.confirm'),
    message: $t('accounting.confirmDeleteAccount'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/chart-of-accounts/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        $q.notify({ type: 'positive', message: $t('accounting.accountDeletedSuccessfully') });
        await fetchAccounts();
      } catch (error) {
        let errorMessage = $t('accounting.failedToDeleteAccount');
        if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        $q.notify({ type: 'negative', message: errorMessage });
      }
    })();
  });
};

onMounted(() => {
  void fetchAccounts();
});
</script>
