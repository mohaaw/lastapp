<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-table
        title="Stock Moves"
        :rows="rows"
        :columns="columns"
        row-key="id"
        v-model:pagination="pagination"
        :loading="loading"
        @request="fetchData"
        binary-state-sort
      >
        <template v-slot:top-right>
          <q-btn color="primary" icon="add" label="Create Move" @click="openFormDialog()" />
        </template>
      </q-table>
    </div>

    <q-dialog v-model="formDialog" persistent>
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Create Stock Move</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="save" class="q-gutter-md">
            <q-select
              filled
              v-model="form.product_variant"
              :options="variantOptions"
              label="Product Variant"
              option-value="id"
              :option-label="(opt) => `${opt.sku} (${opt.serialNumber || 'no serial'})`"
              emit-value
              map-options
            />
            <q-select
              filled
              v-model="form.from_location"
              :options="locationOptions"
              label="From Location"
              option-value="id"
              option-label="name"
              emit-value
              map-options
            />
            <q-select
              filled
              v-model="form.to_location"
              :options="locationOptions"
              label="To Location"
              option-value="id"
              option-label="name"
              emit-value
              map-options
            />
            <q-input filled v-model.number="form.quantity" label="Quantity" type="number" />
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

interface ProductVariant {
  id: number;
  sku: string;
  serialNumber: string;
  // Add other fields as needed
}

interface StockLocation {
  id: number;
  name: string;
}

interface StockMoveWithRelations {
  id: number;
  quantity: number;
  createdAt: string;
  product_variant: {
    data?: {
      id: number;
      attributes: ProductVariant;
    }
  };
  from_location: {
    data?: {
      id: number;
      attributes: StockLocation;
    }
  };
  to_location: {
    data?: {
      id: number;
      attributes: StockLocation;
    }
  };
}

interface StockMoveForm {
  id: number | null;
  quantity: number;
  product_variant: number | null;
  from_location: number | null;
  to_location: number | null;
}

const $q = useQuasar();
const endpoint = 'stock-moves';
const variantEndpoint = 'product-variants';
const locationEndpoint = 'stock-locations';

const columns: QTableProps['columns'] = [
  { name: 'product', label: 'Product', align: 'left', field: (row: StockMoveWithRelations) => row.product_variant?.data?.attributes?.sku },
  { name: 'from', label: 'From', align: 'left', field: (row: StockMoveWithRelations) => row.from_location?.data?.attributes?.name || 'N/A' },
  { name: 'to', label: 'To', align: 'left', field: (row: StockMoveWithRelations) => row.to_location?.data?.attributes?.name || 'N/A' },
  { name: 'quantity', label: 'Quantity', align: 'right', field: 'quantity', sortable: true },
  { name: 'date', label: 'Date', align: 'left', field: 'createdAt', format: (val: string) => new Date(val).toLocaleString() },
];

const rows = ref<StockMoveWithRelations[]>([]);
const loading = ref(false);
const pagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const formDialog = ref(false);
const form = ref<StockMoveForm>({
  id: null,
  quantity: 1,
  product_variant: null,
  from_location: null,
  to_location: null,
});

const variantOptions = ref<ProductVariant[]>([]);
const locationOptions = ref<StockLocation[]>([]);

async function fetchRelations() {
  try {
    const [variantsRes, locationsRes] = await Promise.all([
      api.get(variantEndpoint, { params: { 'pagination[limit]': -1 } }),
      api.get(locationEndpoint, { params: { 'pagination[limit]': -1 } }),
    ]);
    variantOptions.value = variantsRes.data.data.map((item: { id: number; attributes: ProductVariant }) => ({ ...item.attributes, id: item.id }));
    locationOptions.value = locationsRes.data.data.map((item: { id: number; attributes: StockLocation }) => ({ ...item.attributes, id: item.id }));
  } catch {
    $q.notify({ color: 'negative', message: 'Failed to fetch related data' });
  }
}

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
        'populate': ['product_variant', 'from_location', 'to_location'],
      },
    });

    rows.value = response.data.data.map((item: { id: number; attributes: StockMoveWithRelations }) => ({ ...item.attributes, id: item.id }));
    pagination.value.rowsNumber = response.data.meta.pagination.total;
  } catch {
    $q.notify({ color: 'negative', message: 'Failed to fetch stock moves' });
  } finally {
    loading.value = false;
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.sortBy = sortBy;
    pagination.value.descending = descending;
  }
}

function openFormDialog() {
  form.value = {
    id: null,
    quantity: 1,
    product_variant: null,
    from_location: null,
    to_location: null,
  };
  formDialog.value = true;
}

async function save() {
  try {
    await api.post(endpoint, { data: form.value });
    $q.notify({ color: 'positive', message: 'Stock move created' });
    formDialog.value = false;
    void fetchData({ pagination: pagination.value });
  } catch {
    $q.notify({ color: 'negative', message: 'Failed to create stock move' });
  }
}

onMounted(() => {
  void fetchData({ pagination: pagination.value });
  void fetchRelations();
});
</script>
