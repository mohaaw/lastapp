<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <h4 class="q-my-none">{{ $t('accounting.journalEntries') }}</h4>
      <q-space />
      <q-btn color="primary" :label="$t('common.add')" icon="add" @click="openAddDialog" />
    </div>

    <div v-if="loading" class="text-center q-py-lg">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <q-table
      v-else
      :rows="entries"
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
      <q-card style="width: 600px; max-width: 90vw">
        <q-card-section class="row items-center">
          <h5 class="q-my-none">
            {{ isEditing ? $t('common.edit') : $t('common.add') }}
            {{ $t('accounting.journalEntry') }}
          </h5>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveEntry">
            <q-input
              v-model="editedEntry.date"
              type="date"
              :label="`${$t('accounting.date')} *`"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || $t('validation.required')]"
            />

            <q-input
              v-model="editedEntry.description"
              :label="`${$t('accounting.description')} *`"
              outlined
              dense
              type="textarea"
              class="q-mb-md"
              :rules="[val => !!val || $t('validation.required')]"
            />

            <div class="text-h6 q-mb-md">{{ $t('accounting.entries') }}</div>
            <q-table
              :rows="editedEntry.entries || []"
              :columns="entryColumns"
              row-key="id"
              flat
              bordered
              class="q-mb-md"
            >
              <template #body-cell-actions="entryProps">
                <q-td :props="entryProps">
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click="deleteEntryRow(entryProps.row.id)"
                  />
                </q-td>
              </template>
            </q-table>

            <q-btn
              color="secondary"
              :label="$t('common.add')"
              icon="add"
              size="sm"
              @click="addEntryRow"
              class="q-mb-md"
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

interface JournalEntryRecord {
  id?: string;
  debitAccount: number | null;
  creditAccount: number | null;
  amount: number;
}

interface JournalEntry {
  id: number;
  date: string;
  description: string;
  entries: JournalEntryRecord[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

const $q = useQuasar();
const authStore = useAuthStore();

const entries = ref<JournalEntry[]>([]);
const loading = ref(false);
const saving = ref(false);
const filter = ref('');
const showDialog = ref(false);
const isEditing = ref(false);

const editedEntry = ref<Partial<JournalEntry> & { date: string }>({
  date: new Date().toISOString().split('T')[0],
  description: '',
  entries: [],
});

const columns: QTableColumn<JournalEntry>[] = [
  { name: 'date', label: $t('accounting.date'), align: 'left', field: 'date', sortable: true },
  { name: 'description', label: $t('accounting.description'), align: 'left', field: 'description', sortable: true },
  { name: 'actions', label: $t('common.actions'), align: 'right', field: (row) => row.id },
];

const entryColumns: QTableColumn<JournalEntryRecord>[] = [
  { name: 'debitAccount', label: $t('accounting.debitAccount'), align: 'right', field: 'debitAccount' },
  { name: 'creditAccount', label: $t('accounting.creditAccount'), align: 'right', field: 'creditAccount' },
  { name: 'amount', label: $t('accounting.amount'), align: 'right', field: 'amount', format: (val: number) => `$${val.toFixed(2)}` },
  { name: 'actions', label: $t('common.actions'), align: 'right', field: (row) => row.id },
];

const fetchEntries = async () => {
  loading.value = true;
  try {
    const response = await api.get('/journal-entries', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    entries.value = response.data.data;
  } catch (error) {
    let errorMessage = $t('accounting.failedToFetchEntries');
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
  editedEntry.value = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    entries: [],
  };
  showDialog.value = true;
};

const openEditDialog = (entry: JournalEntry) => {
  isEditing.value = true;
  editedEntry.value = { ...entry };
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editedEntry.value = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    entries: [],
  };
};

const addEntryRow = () => {
  if (!editedEntry.value.entries) {
    editedEntry.value.entries = [];
  }
  editedEntry.value.entries.push({
    id: Math.random().toString(),
    debitAccount: null,
    creditAccount: null,
    amount: 0,
  });
};

const deleteEntryRow = (id?: string) => {
  if (editedEntry.value.entries) {
    editedEntry.value.entries = editedEntry.value.entries.filter(e => e.id !== id);
  }
};

const saveEntry = async () => {
  saving.value = true;
  try {
    const data = { data: editedEntry.value };
    if (isEditing.value && editedEntry.value.id) {
      await api.put(`/journal-entries/${editedEntry.value.id}`, data, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      $q.notify({ type: 'positive', message: $t('accounting.entryUpdatedSuccessfully') });
    } else {
      await api.post('/journal-entries', data, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      $q.notify({ type: 'positive', message: $t('accounting.entryAddedSuccessfully') });
    }
    await fetchEntries();
    closeDialog();
  } catch (error) {
    let errorMessage = $t('accounting.failedToSaveEntry');
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
    message: $t('accounting.confirmDeleteEntry'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/journal-entries/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        $q.notify({ type: 'positive', message: $t('accounting.entryDeletedSuccessfully') });
        await fetchEntries();
      } catch (error) {
        let errorMessage = $t('accounting.failedToDeleteEntry');
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
  void fetchEntries();
});
</script>
