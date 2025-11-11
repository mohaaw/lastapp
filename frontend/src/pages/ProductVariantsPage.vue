<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-table
        :title="$t('products.productVariants')"
        :rows="rows"
        :columns="columns"
        row-key="id"
        v-model:pagination="pagination"
        :loading="loading"
        @request="fetchData"
        binary-state-sort
      >
        <template v-slot:top-right>
          <q-btn color="primary" icon="add" :label="$t('products.addVariant')" @click="openFormDialog()" />
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
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">{{ form.id ? $t('common.edit') : $t('common.add') }} {{ $t('products.productVariants') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="save" class="q-gutter-md">
            <q-select
              filled
              v-model="form.product_template"
              :options="templateOptions"
              :label="$t('products.productTemplate')"
              option-value="id"
              option-label="name"
              emit-value
              map-options
            />
            <q-input filled v-model="form.sku" :label="$t('products.sku')" />
            <q-input filled v-model="form.serialNumber" :label="$t('products.serialNumber')" />
            <q-input filled v-model.number="form.costPrice" :label="$t('products.costPrice')" type="number" step="0.01" />
            <q-input filled v-model.number="form.salePrice" :label="$t('products.salePrice')" type="number" step="0.01" />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn flat :label="$t('common.save')" @click="save" color="primary" />
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

interface ProductTemplate {
  id: number;
  name: string;
  // Add other fields as needed
}

interface ProductVariant {
  id: number | null;
  sku: string;
  serialNumber: string;
  costPrice: number;
  salePrice: number;
  product_template: number | null;
}

interface ProductVariantWithTemplate {
  id: number;
  sku: string;
  serialNumber: string;
  costPrice: number;
  salePrice: number;
  product_template: {
    data?: {
      id: number;
      attributes: ProductTemplate;
    }
  };
}

const $q = useQuasar();
const endpoint = 'product-variants';
const templateEndpoint = 'product-templates';

const columns: QTableProps['columns'] = [
  { name: 'sku', label: 'SKU', align: 'left', field: 'sku', sortable: true },
  { name: 'serialNumber', label: 'Serial Number', align: 'left', field: 'serialNumber' },
  { name: 'salePrice', label: 'Sale Price', align: 'right', field: 'salePrice', sortable: true },
  { name: 'costPrice', label: 'Cost Price', align: 'right', field: 'costPrice', sortable: true },
  { name: 'template', label: 'Template', align: 'left', field: (row: ProductVariantWithTemplate) => row.product_template?.data?.attributes?.name },
  { name: 'actions', label: 'Actions', align: 'center', field: '' },
];

const rows = ref<ProductVariantWithTemplate[]>([]);
const loading = ref(false);
const pagination = ref({
  sortBy: 'sku',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const formDialog = ref(false);
const form = ref<ProductVariant>({
  id: null,
  sku: '',
  serialNumber: '',
  costPrice: 0,
  salePrice: 0,
  product_template: null,
});

const templateOptions = ref<ProductTemplate[]>([]);

async function fetchTemplates() {
  try {
    const response = await api.get(templateEndpoint, { params: { 'pagination[limit]': -1 } });
    templateOptions.value = response.data.data.map((item: { id: number; attributes: ProductTemplate }) => ({ ...item.attributes, id: item.id }));
  } catch {
    $q.notify({ color: 'negative', message: 'Failed to fetch product templates' });
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
        'populate': 'product_template'
      },
    });

    rows.value = response.data.data.map((item: { id: number; attributes: ProductVariantWithTemplate }) => ({ ...item.attributes, id: item.id }));
    pagination.value.rowsNumber = response.data.meta.pagination.total;
  } catch {
    $q.notify({ color: 'negative', message: 'Failed to fetch data' });
  } finally {
    loading.value = false;
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.sortBy = sortBy;
    pagination.value.descending = descending;
  }
}

function openFormDialog(row?: ProductVariantWithTemplate) {
  form.value = row ? { ...row, product_template: row.product_template?.data?.id || null } : {
    id: null,
    sku: '',
    serialNumber: '',
    costPrice: 0,
    salePrice: 0,
    product_template: null,
  };
  formDialog.value = true;
}

async function save() {
  try {
    const data = { ...form.value };
    if (data.id) {
      await api.put(`${endpoint}/${data.id}`, { data });
    } else {
      await api.post(endpoint, { data });
    }
    $q.notify({ color: 'positive', message: 'Saved successfully' });
    formDialog.value = false;
    void fetchData({ pagination: pagination.value });
  } catch {
    $q.notify({ color: 'negative', message: 'Failed to save' });
  }
}

function deleteRow(id: number) {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to delete this item?',
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
  void fetchTemplates();
});
</script>
