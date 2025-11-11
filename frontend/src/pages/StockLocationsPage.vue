<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-table
        title="Stock Locations"
        :rows="rows"
        :columns="columns"
        row-key="id"
        v-model:pagination="pagination"
        :loading="loading"
        @request="fetchData"
        binary-state-sort
      >
        <template v-slot:top-right>
          <q-btn color="primary" icon="add" label="Add Location" @click="openFormDialog()" />
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense round flat icon="edit" @click="openFormDialog(props.row)"></q-btn>
            <q-btn dense round flat icon="delete" @click="deleteRow(props.row.id)"></q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <q-dialog v-model="formDialog" persistent>
      <q-card style="width: 500px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">{{ form.id ? 'Edit' : 'Add' }} Location</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="save" class="q-gutter-md">
            <q-input filled v-model="form.name" label="Location Name" autofocus />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Save" @click="save" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';

interface StockLocation {
  id: number | null;
  name: string;
}

const $q = useQuasar();
const endpoint = 'stock-locations';

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', align: 'left', field: 'name', sortable: true },
  { name: 'actions', label: 'Actions', align: 'center', field: '' },
];

const rows = ref<StockLocation[]>([]);
const loading = ref(false);
const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const formDialog = ref(false);
const form = ref<StockLocation>({
  id: null,
  name: '',
});

interface FetchProps {
  pagination: {
    page: number;
    rowsPerPage: number;
    sortBy: string;
    descending: boolean;
  };
}

async function fetchData(props?: FetchProps) {
  const { page, rowsPerPage, sortBy, descending } = props?.pagination || pagination.value;
  loading.value = true;

  try {
    const response = await api.get(endpoint, {
      params: {
        'pagination[page]': page,
        'pagination[pageSize]': rowsPerPage,
        'sort': `${sortBy}:${descending ? 'desc' : 'asc'}`,
      },
    });

    rows.value = response.data.data.map((item: { id: number; attributes: StockLocation }) => ({ ...item.attributes, id: item.id }));
    pagination.value.rowsNumber = response.data.meta.pagination.total;
  } catch {
    $q.notify({ color: 'negative', message: 'Failed to fetch locations' });
  } finally {
    loading.value = false;
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.sortBy = sortBy;
    pagination.value.descending = descending;
  }
}

function openFormDialog(row?: StockLocation) {
  form.value = row ? { ...row } : { id: null, name: '' };
  formDialog.value = true;
}

async function save() {
  try {
    const data = { name: form.value.name };
    if (form.value.id) {
      await api.put(`${endpoint}/${form.value.id}`, { data });
    } else {
      await api.post(endpoint, { data });
    }
    $q.notify({ color: 'positive', message: 'Location saved successfully' });
    formDialog.value = false;
    void fetchData({ pagination: pagination.value });
  } catch {
    $q.notify({ color: 'negative', message: 'Failed to save location' });
  }
}

function deleteRow(id: number) {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to delete this location?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`${endpoint}/${id}`);
        $q.notify({ color: 'positive', message: 'Deleted successfully' });
        void fetchData({ pagination: pagination.value });
      } catch {
        $q.notify({ color: 'negative', message: 'Failed to delete' });
      }
    })();
  });
}

onMounted(() => {
  void fetchData({ pagination: pagination.value });
});
</script>
