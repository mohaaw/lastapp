<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col text-h5">{{ $t('maintenance.maintenanceManagement') }}</div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" :label="$t('maintenance.addTicket')" @click="openAddDialog" />
      </div>
    </div>

    <q-table
      :rows="maintenanceTickets"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :filter="filter"
      :no-data-label="$t('maintenance.noMaintenanceTicketsFound')"
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" :placeholder="$t('common.search')">
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
          <div class="text-h6">{{ isEditing ? $t('maintenance.editMaintenanceTicket') : $t('maintenance.addMaintenanceTicket') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveMaintenanceTicket" class="q-gutter-md">
            <q-input filled v-model="editedTicket.customer_name" :label="$t('maintenance.customerName')" lazy-rules :rules="[val => !!val || $t('maintenance.customerName') + ' is required']" />
            <q-input filled v-model="editedTicket.device" :label="$t('maintenance.device')" lazy-rules :rules="[val => !!val || $t('maintenance.device') + ' is required']" />
            <q-input filled v-model="editedTicket.problem_description" :label="$t('maintenance.problemDescription')" type="textarea" lazy-rules :rules="[val => !!val || $t('maintenance.problemDescription') + ' is required']" />
            <q-select
              filled
              v-model="editedTicket.status"
              :options="['pending', 'in_progress', 'completed', 'cancelled']"
              :label="$t('maintenance.status')"
              lazy-rules
              :rules="[val => !!val || 'Status is required']"
            />
            <q-select
              filled
              v-model="editedTicket.customer"
              :options="customerOptions"
              :label="$t('maintenance.linkCustomer')"
              emit-value
              map-options
              clearable
            />
            <q-input filled v-model="editedTicket.assigned_to" :label="$t('maintenance.assignedTo')" />
            <q-input filled v-model="editedTicket.start_date" :label="$t('maintenance.startDate')" type="datetime-local" />
            <q-input filled v-model="editedTicket.end_date" :label="$t('maintenance.endDate')" type="datetime-local" />
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat :label="$t('common.cancel')" @click="closeDialog" />
          <q-btn flat :label="$t('common.save')" type="submit" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios';
import { type QTableColumn, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import axios from 'axios';

const $q = useQuasar();
const authStore = useAuthStore();
const { t: $t } = useI18n();

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
  customer?: Customer;
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Separate interface for the form model to handle the customer ID from q-select
interface MaintenanceTicketForm {
  id?: number;
  customer_name: string;
  device: string;
  problem_description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  customer?: number; // This will hold the ID
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
}

const maintenanceTickets = ref<MaintenanceTicket[]>([]);
const customers = ref<Customer[]>([]);
const loading = ref(false);
const filter = ref('');
const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);

// Use the new form interface for the editedTicket ref
const editedTicket = ref<MaintenanceTicketForm>({
  customer_name: '',
  device: '',
  problem_description: '',
  status: 'pending',
});

const customerOptions = ref<{ label: string; value: number }[]>([]);

const columns: QTableColumn<MaintenanceTicket>[] = [
  { name: 'customer_name', required: true, label: $t('maintenance.customerName'), align: 'left', field: 'customer_name', sortable: true },
  { name: 'device', label: $t('maintenance.device'), align: 'left', field: 'device', sortable: true },
  { name: 'problem_description', label: $t('maintenance.problemDescription'), align: 'left', field: 'problem_description', sortable: true },
  { name: 'status', label: $t('common.status'), align: 'left', field: 'status', sortable: true },
  { name: 'assigned_to', label: $t('maintenance.assignedTo'), align: 'left', field: 'assigned_to', sortable: true },
  { name: 'start_date', label: $t('maintenance.startDate'), align: 'left', field: 'start_date', sortable: true, format: (val: string) => val ? new Date(val).toLocaleString() : '' },
  { name: 'end_date', label: $t('maintenance.endDate'), align: 'left', field: 'end_date', sortable: true, format: (val: string) => val ? new Date(val).toLocaleString() : '' },
  { name: 'actions', label: $t('common.actions'), align: 'right', field: (row) => row.id },
];

const fetchMaintenanceTickets = async () => {
  loading.value = true;
  try {
    const response = await api.get('/maintenances?populate=customer', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    maintenanceTickets.value = response.data.data;
  } catch (error: unknown) {
    let errorMessage = $t('maintenance.failedToFetchTickets');
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
    customerOptions.value = customers.value.map(c => ({ label: `${c.name} (${c.email})`, value: c.id }));
  } catch (error: unknown) {
    let errorMessage = $t('maintenance.failedToFetchCustomers');
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
    assigned_to: '',
    start_date: new Date().toISOString().slice(0, 16),
  };
  showDialog.value = true;
};

const openEditDialog = (ticket: MaintenanceTicket) => {
  isEditing.value = true;

  // Build the form object conditionally to satisfy exactOptionalPropertyTypes
  const formValue: MaintenanceTicketForm = {
    id: ticket.id,
    customer_name: ticket.customer_name,
    device: ticket.device,
    problem_description: ticket.problem_description,
    status: ticket.status,
    start_date: ticket.start_date ? new Date(ticket.start_date).toISOString().slice(0, 16) : '',
  };

  if (ticket.customer) {
    formValue.customer = ticket.customer.id;
  }
  if (ticket.assigned_to) {
    formValue.assigned_to = ticket.assigned_to;
  }
  if (ticket.end_date) {
    formValue.end_date = new Date(ticket.end_date).toISOString().slice(0, 16);
  }

  editedTicket.value = formValue;
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
    const ticketData = { data: editedTicket.value };
    if (isEditing.value && editedTicket.value.id) {
      await api.put(`/maintenances/${editedTicket.value.id}`, ticketData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      $q.notify({ type: 'positive', message: $t('maintenance.ticketUpdatedSuccessfully') });
    } else {
      await api.post('/maintenances', ticketData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      $q.notify({ type: 'positive', message: $t('maintenance.ticketAddedSuccessfully') });
    }
    await fetchMaintenanceTickets();
    closeDialog();
  } catch (error: unknown) {
    let errorMessage = $t('maintenance.failedToSaveTicket');
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
    message: $t('maintenance.confirmDeleteTicket'),
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
        $q.notify({ type: 'positive', message: $t('maintenance.ticketDeletedSuccessfully') });
        await fetchMaintenanceTickets();
      } catch (error: unknown) {
        let errorMessage = $t('maintenance.failedToDeleteTicket');
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
