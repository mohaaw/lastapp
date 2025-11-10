<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col text-h5">Customer Management</div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" label="Add Customer" @click="openAddDialog" />
      </div>
    </div>

    <q-table
      :rows="customers"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :filter="filter"
      no-data-label="No customers found"
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn icon="edit" size="sm" flat dense @click="openEditDialog(props.row)" />
          <q-btn icon="delete" size="sm" flat dense @click="confirmDelete(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <!-- Add/Edit Customer Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ isEditing ? 'Edit Customer' : 'Add Customer' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveCustomer" class="q-gutter-md">
            <q-input filled v-model="editedCustomer.name" label="Customer Name" lazy-rules :rules="[val => !!val || 'Name is required']" />
            <q-input filled v-model="editedCustomer.phone" label="Phone" />
            <q-input filled v-model="editedCustomer.email" label="Email" type="email" lazy-rules :rules="[val => !!val || 'Email is required', val => /.+@.+\..+/.test(val) || 'Email must be valid']" />
            <q-input filled v-model="editedCustomer.address" label="Address" type="textarea" />
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" @click="closeDialog" />
          <q-btn flat label="Save" type="submit" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios';
import { type QTableColumn, useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import axios from 'axios';

const $q = useQuasar();
const authStore = useAuthStore();

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

const customers = ref<Customer[]>([]);
const loading = ref(false);
const filter = ref('');
const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const editedCustomer = ref<Partial<Customer>>({
  name: '',
  phone: '',
  email: '',
  address: '',
});

const columns: QTableColumn<Customer>[] = [
  { name: 'name', required: true, label: 'Customer Name', align: 'left', field: 'name', sortable: true },
  { name: 'phone', label: 'Phone', align: 'left', field: 'phone', sortable: true },
  { name: 'email', label: 'Email', align: 'left', field: 'email', sortable: true },
  { name: 'address', label: 'Address', align: 'left', field: 'address', sortable: true },
  { name: 'actions', label: 'Actions', align: 'right', field: (row) => row.id },
];

const fetchCustomers = async () => {
  loading.value = true;
  try {
    const response = await api.get('/customers', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    customers.value = response.data.data;
  } catch (error: unknown) {
    let errorMessage = 'Failed to fetch customers.';
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
  editedCustomer.value = { name: '', phone: '', email: '', address: '' };
  showDialog.value = true;
};

const openEditDialog = (customer: Customer) => {
  isEditing.value = true;
  editedCustomer.value = { ...customer }; // Copy customer data
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editedCustomer.value = { name: '', phone: '', email: '', address: '' };
};

const saveCustomer = async () => {
  saving.value = true;
  try {
    const customerData = { data: editedCustomer.value }; // Strapi expects data wrapped in 'data'
    if (isEditing.value && editedCustomer.value.id) {
      await api.put(`/customers/${editedCustomer.value.id}`, customerData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      $q.notify({ type: 'positive', message: 'Customer updated successfully!' });
    } else {
      await api.post('/customers', customerData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      $q.notify({ type: 'positive', message: 'Customer added successfully!' });
    }
    await fetchCustomers(); // Refresh list
    closeDialog();
  } catch (error: unknown) {
    let errorMessage = 'Failed to save customer.';
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
    title: 'Confirm',
    message: 'Are you sure you want to delete this customer?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/customers/${id}`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });
        $q.notify({ type: 'positive', message: 'Customer deleted successfully!' });
        await fetchCustomers(); // Refresh list
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete customer.';
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
  fetchCustomers().catch(err => console.error('Error fetching customers on mount:', err));
});
</script>