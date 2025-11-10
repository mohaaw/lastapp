<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col text-h5">Maintenance Management</div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" label="Add Ticket" @click="openAddDialog" />
      </div>
    </div>

    <q-table
      :rows="maintenanceTickets"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :filter="filter"
      no-data-label="No maintenance tickets found"
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

    <!-- Add/Edit Maintenance Ticket Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ isEditing ? 'Edit Maintenance Ticket' : 'Add Maintenance Ticket' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveMaintenanceTicket" class="q-gutter-md">
            <q-input filled v-model="editedTicket.customer_name" label="Customer Name" lazy-rules :rules="[val => !!val || 'Customer Name is required']" />
            <q-input filled v-model="editedTicket.device" label="Device" lazy-rules :rules="[val => !!val || 'Device is required']" />
            <q-input filled v-model="editedTicket.problem_description" label="Problem Description" type="textarea" lazy-rules :rules="[val => !!val || 'Problem Description is required']" />
            <q-select
              filled
              v-model="editedTicket.status"
              :options="['pending', 'in_progress', 'completed', 'cancelled']"
              label="Status"
              lazy-rules
              :rules="[val => !!val || 'Status is required']"
            />
            <q-select
              filled
              v-model="editedTicket.customer"
              :options="customerOptions"
              label="Link Customer (Optional)"
              emit-value
              map-options
              option-value="id"
              option-label="name"
              clearable
            />
            <q-input filled v-model="editedTicket.assigned_to" label="Assigned To" />
            <q-input filled v-model="editedTicket.start_date" label="Start Date" type="datetime-local" />
            <q-input filled v-model="editedTicket.end_date" label="End Date" type="datetime-local" />
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
  email: string;
  phone?: string;
  address?: string;
}

interface MaintenanceTicket {
  id: number;
  customer_name: string;
  device: string;
  problem_description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  customer?: Customer; // Relation to Customer
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

const maintenanceTickets = ref<MaintenanceTicket[]>([]);
const customers = ref<Customer[]>([]);
const loading = ref(false);
const filter = ref('');
const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const editedTicket = ref<Partial<MaintenanceTicket>>({
  customer_name: '',
  device: '',
  problem_description: '',
  status: 'pending',
});

const customerOptions = ref<{ label: string; value: number }[]>([]);

const columns: QTableColumn<MaintenanceTicket>[] = [
  { name: 'customer_name', required: true, label: 'Customer Name', align: 'left', field: 'customer_name', sortable: true },
  { name: 'device', label: 'Device', align: 'left', field: 'device', sortable: true },
  { name: 'problem_description', label: 'Problem', align: 'left', field: 'problem_description', sortable: true },
  { name: 'status', label: 'Status', align: 'left', field: 'status', sortable: true },
  { name: 'assigned_to', label: 'Assigned To', align: 'left', field: 'assigned_to', sortable: true },
  { name: 'start_date', label: 'Start Date', align: 'left', field: 'start_date', sortable: true, format: (val: string) => val ? new Date(val).toLocaleString() : '' },
  { name: 'end_date', label: 'End Date', align: 'left', field: 'end_date', sortable: true, format: (val: string) => val ? new Date(val).toLocaleString() : '' },
  { name: 'actions', label: 'Actions', align: 'right', field: (row) => row.id },
];

const fetchMaintenanceTickets = async () => {
  loading.value = true;
  try {
    const response = await api.get('/maintenances?populate=customer', { // Populate customer relation
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    maintenanceTickets.value = response.data.data;
  } catch (error: unknown) {
    let errorMessage = 'Failed to fetch maintenance tickets.';
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

const fetchCustomers = async () => {
  try {
    const response = await api.get('/customers', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    customers.value = response.data.data;
    customerOptions.value = customers.value.map(c => ({ label: c.name, value: c.id }));
  } catch (error: unknown) {
    let errorMessage = 'Failed to fetch customers for selection.';
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    $q.notify({ type: 'negative', message: errorMessage });
  }
};

const openAddDialog = () => {
  isEditing.value = false;
  editedTicket.value = {
    customer_name: '',
    device: '',
    problem_description: '',
    status: 'pending',
    customer: undefined,
    assigned_to: '',
    start_date: new Date().toISOString().slice(0, 16), // Current datetime for default
    end_date: undefined,
  };
  showDialog.value = true;
};

const openEditDialog = (ticket: MaintenanceTicket) => {
  isEditing.value = true;
  // Ensure customer relation is handled correctly for q-select
  editedTicket.value = {
    ...ticket,
    customer: ticket.customer ? ticket.customer.id : undefined, // Pass ID for q-select
    start_date: ticket.start_date ? new Date(ticket.start_date).toISOString().slice(0, 16) : undefined,
    end_date: ticket.end_date ? new Date(ticket.end_date).toISOString().slice(0, 16) : undefined,
  };
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editedTicket.value = {
    customer_name: '',
    device: '',
    problem_description: '',
    status: 'pending',
  };
};

const saveMaintenanceTicket = async () => {
  saving.value = true;
  try {
    const ticketData = { data: editedTicket.value }; // Strapi expects data wrapped in 'data'
    if (isEditing.value && editedTicket.value.id) {
      await api.put(`/maintenances/${editedTicket.value.id}`, ticketData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      $q.notify({ type: 'positive', message: 'Maintenance ticket updated successfully!' });
    } else {
      await api.post('/maintenances', ticketData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      $q.notify({ type: 'positive', message: 'Maintenance ticket added successfully!' });
    }
    await fetchMaintenanceTickets(); // Refresh list
    closeDialog();
  } catch (error: unknown) {
    let errorMessage = 'Failed to save maintenance ticket.';
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
    message: 'Are you sure you want to delete this maintenance ticket?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/maintenances/${id}`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });
        $q.notify({ type: 'positive', message: 'Maintenance ticket deleted successfully!' });
        await fetchMaintenanceTickets(); // Refresh list
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete maintenance ticket.';
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
  fetchMaintenanceTickets().catch(err => console.error('Error fetching maintenance tickets on mount:', err));
  fetchCustomers().catch(err => console.error('Error fetching customers on mount:', err));
});
</script>
