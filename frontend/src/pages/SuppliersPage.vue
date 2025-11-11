<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <h4 class="q-my-none">{{ $t('purchasing.suppliers') }}</h4>
      <q-space />
      <q-btn color="primary" :label="$t('common.add')" icon="add" @click="openAddDialog" />
    </div>

    <div v-if="loading" class="text-center q-py-lg">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <q-table
      v-else
      :rows="suppliers"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :filter="filter"
      @request="onRequest"
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
      <q-card style="width: 500px; max-width: 90vw">
        <q-card-section class="row items-center">
          <h5 class="q-my-none">
            {{ isEditing ? $t('common.edit') : $t('common.add') }}
            {{ $t('purchasing.supplier') }}
          </h5>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveSupplier">
            <q-input
              v-model="editedSupplier.name"
              :label="`${$t('purchasing.supplierName')} *`"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || $t('validation.required')]"
            />

            <q-input
              v-model="editedSupplier.contactPerson"
              :label="$t('purchasing.contactPerson')"
              outlined
              dense
              class="q-mb-md"
            />

            <q-input
              v-model="editedSupplier.email"
              type="email"
              :label="$t('purchasing.email')"
              outlined
              dense
              class="q-mb-md"
            />

            <q-input
              v-model="editedSupplier.phone"
              :label="$t('purchasing.phone')"
              outlined
              dense
              class="q-mb-md"
            />

            <q-input
              v-model="editedSupplier.address"
              type="textarea"
              :label="$t('purchasing.address')"
              outlined
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

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

const $q = useQuasar();
const authStore = useAuthStore();

const suppliers = ref<Supplier[]>([]);
const loading = ref(false);
const saving = ref(false);
const filter = ref('');
const showDialog = ref(false);
const isEditing = ref(false);

const editedSupplier = ref<Partial<Supplier>>({
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
});

const columns: QTableColumn<Supplier>[] = [
  { name: 'name', label: $t('purchasing.supplierName'), align: 'left', field: 'name', sortable: true },
  { name: 'contactPerson', label: $t('purchasing.contactPerson'), align: 'left', field: 'contactPerson', sortable: true },
  { name: 'email', label: $t('purchasing.email'), align: 'left', field: 'email', sortable: true },
  { name: 'phone', label: $t('purchasing.phone'), align: 'left', field: 'phone', sortable: true },
  { name: 'actions', label: $t('common.actions'), align: 'right', field: (row) => row.id },
];

const fetchSuppliers = async () => {
  loading.value = true;
  try {
    const response = await api.get('/suppliers', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    suppliers.value = response.data.data;
  } catch (error) {
    let errorMessage = $t('purchasing.failedToFetchSuppliers');
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
  editedSupplier.value = { name: '', contactPerson: '', email: '', phone: '', address: '' };
  showDialog.value = true;
};

const openEditDialog = (supplier: Supplier) => {
  isEditing.value = true;
  editedSupplier.value = { ...supplier };
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editedSupplier.value = { name: '', contactPerson: '', email: '', phone: '', address: '' };
};

const saveSupplier = async () => {
  saving.value = true;
  try {
    const data = { data: editedSupplier.value };
    if (isEditing.value && editedSupplier.value.id) {
      await api.put(`/suppliers/${editedSupplier.value.id}`, data, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      $q.notify({ type: 'positive', message: $t('purchasing.supplierUpdatedSuccessfully') });
    } else {
      await api.post('/suppliers', data, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      $q.notify({ type: 'positive', message: $t('purchasing.supplierAddedSuccessfully') });
    }
    await fetchSuppliers();
    closeDialog();
  } catch (error) {
    let errorMessage = $t('purchasing.failedToSaveSupplier');
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
    message: $t('purchasing.confirmDeleteSupplier'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/suppliers/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        $q.notify({ type: 'positive', message: $t('purchasing.supplierDeletedSuccessfully') });
        await fetchSuppliers();
      } catch (error) {
        let errorMessage = $t('purchasing.failedToDeleteSupplier');
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

const onRequest = () => {
  void fetchSuppliers();
};

onMounted(() => {
  void fetchSuppliers();
});
</script>
