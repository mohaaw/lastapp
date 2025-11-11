<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-table
        :title="$t('products.productTemplates')"
        :rows="rows"
        :columns="columns"
        row-key="id"
        v-model:pagination="pagination"
        :loading="loading"
        @request="fetchData"
        binary-state-sort
      >
        <template v-slot:top-right>
          <q-btn color="primary" icon="add" :label="$t('products.addTemplate')" @click="openFormDialog()" />
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
          <div class="text-h6">{{ form.id ? $t('products.editTemplate') : $t('products.addProductTemplate') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="save" class="q-gutter-md">
            <q-input filled v-model="form.name" :label="$t('products.name')" />
            <q-input filled v-model="form.description" :label="$t('products.description')" type="textarea" />
            <q-input filled v-model.number="form.price" :label="$t('products.defaultPrice')" type="number" step="0.01" />
            <q-input filled v-model="form.sku" :label="$t('products.sku')" />
            <q-input filled v-model="form.category" :label="$t('products.category')" />
            <q-input filled v-model="form.brand" :label="$t('products.brand')" />
            <q-input filled v-model.number="form.cost" :label="$t('products.cost')" type="number" step="0.01" />
            <q-checkbox v-model="form.hasVariants" :label="$t('products.hasVariants')" />
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

const $q = useQuasar();
const endpoint = 'product-templates';

interface ProductTemplate {
  id: number | null;
  name: string;
  description: string;
  price: number;
  sku: string;
  category: string;
  brand: string;
  cost: number;
  hasVariants: boolean;
}

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', align: 'left', field: 'name', sortable: true },
  { name: 'sku', label: 'SKU', align: 'left', field: 'sku', sortable: true },
  { name: 'category', label: 'Category', align: 'left', field: 'category', sortable: true },
  { name: 'brand', label: 'Brand', align: 'left', field: 'brand', sortable: true },
  { name: 'price', label: 'Price', align: 'right', field: 'price', sortable: true },
  { name: 'hasVariants', label: 'Has Variants', align: 'center', field: 'hasVariants' },
  { name: 'actions', label: 'Actions', align: 'center', field: '' },
];

const rows = ref<ProductTemplate[]>([]);
const loading = ref(false);
const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const formDialog = ref(false);
const form = ref<ProductTemplate>({
  id: null as number | null,
  name: '',
  description: '',
  price: 0,
  sku: '',
  category: '',
  brand: '',
  cost: 0,
  hasVariants: false,
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

    rows.value = response.data.data.map((item: { id: number; attributes: ProductTemplate }) => ({ ...item.attributes, id: item.id }));
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

function openFormDialog(row?: ProductTemplate) {
  form.value = row ? { ...row } : {
    id: null as number | null,
    name: '',
    description: '',
    price: 0,
    sku: '',
    category: '',
    brand: '',
    cost: 0,
    hasVariants: false,
  };
  formDialog.value = true;
}

async function save() {
  try {
    if (form.value.id) {
      await api.put(`${endpoint}/${form.value.id}`, { data: form.value });
    } else {
      await api.post(endpoint, { data: form.value });
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
});
</script>
