<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <h4 class="q-my-none">{{ $t('purchasing.purchaseOrders') }}</h4>
      <q-space />
      <q-btn color="primary" :label="$t('common.add')" icon="add" @click="openAddDialog" />
    </div>

    <div v-if="loading" class="text-center q-py-lg">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <q-table
      v-else
      :rows="purchaseOrders"
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

      <template #body-cell-status="props">
        <q-td :props="props">
          <q-chip
            :color="getStatusColor(props.row.status)"
            text-color="white"
            :label="$t(`purchasing.status.${props.row.status}`)"
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
            icon="assignment"
            size="sm"
            color="warning"
            @click="openItemsDialog(props.row)"
          />
          <q-btn
            v-if="props.row.status === 'ordered'"
            flat
            dense
            round
            icon="local_shipping"
            size="sm"
            color="positive"
            @click="receivePurchaseOrder(props.row)"
            :title="$t('purchasing.receiveProducts')"
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

    <!-- Add/Edit PO Dialog -->
    <q-dialog v-model="showDialog" @hide="closeDialog">
      <q-card style="width: 500px; max-width: 90vw">
        <q-card-section class="row items-center">
          <h5 class="q-my-none">
            {{ isEditing ? $t('common.edit') : $t('common.add') }}
            {{ $t('purchasing.purchaseOrder') }}
          </h5>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="savePurchaseOrder">
            <q-input
              v-model="editedPO.reference"
              :label="`${$t('purchasing.reference')} *`"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || $t('validation.required')]"
            />

            <q-select
              v-model="editedPO.supplier"
              :label="`${$t('purchasing.supplier')} *`"
              :options="suppliers"
              option-value="id"
              option-label="name"
              outlined
              dense
              emit-value
              class="q-mb-md"
              :rules="[val => !!val || $t('validation.required')]"
            />

            <q-select
              v-model="editedPO.status"
              :label="`${$t('common.status')} *`"
              :options="['draft', 'ordered', 'received']"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || $t('validation.required')]"
            />

            <q-input
              v-model.number="editedPO.totalAmount"
              type="number"
              step="0.01"
              :label="$t('purchasing.totalAmount')"
              outlined
              dense
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

    <!-- Manage Items Dialog -->
    <q-dialog v-model="showItemsDialog" @hide="closeItemsDialog">
      <q-card style="width: 700px; max-width: 90vw">
        <q-card-section class="row items-center">
          <h5 class="q-my-none">{{ $t('purchasing.manageItems') }} - {{ currentPO?.reference }}</h5>
          <q-space />
          <q-btn icon="close" flat round dense @click="showItemsDialog = false" />
        </q-card-section>

        <q-card-section>
          <div class="q-mb-md">
            <q-btn color="primary" :label="$t('common.add')" icon="add" @click="openAddItemDialog" size="sm" />
          </div>

          <q-table
            :rows="currentItems"
            :columns="itemColumns"
            row-key="id"
            flat
            bordered
          >
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  size="sm"
                  color="negative"
                  @click="deleteItem(props.row.id)"
                />
              </q-td>
            </template>
          </q-table>

          <q-separator class="q-my-md" />

          <div class="q-mb-md">
            <q-form @submit="addItem">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="newItem.productVariant"
                    :label="`${$t('purchasing.productVariant')} *`"
                    :options="productVariants"
                    option-value="id"
                    option-label="name"
                    outlined
                    dense
                    emit-value
                    :rules="[val => !!val || $t('validation.required')]"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model.number="newItem.quantity"
                    type="number"
                    step="1"
                    min="1"
                    :label="`${$t('common.quantity')} *`"
                    outlined
                    dense
                    :rules="[val => !!val || $t('validation.required')]"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model.number="newItem.costPrice"
                    type="number"
                    step="0.01"
                    :label="`${$t('purchasing.costPrice')} *`"
                    outlined
                    dense
                    :rules="[val => !!val || $t('validation.required')]"
                  />
                </div>
              </div>
              <div class="q-mt-md row justify-end">
                <q-btn flat :label="$t('common.save')" type="submit" color="primary" :loading="savingItem" />
              </div>
            </q-form>
          </div>
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
}

interface ProductVariant {
  id: number;
  name: string;
}

interface PurchaseOrderItem {
  id: number;
  quantity: number;
  costPrice: number;
  productVariant?: ProductVariant;
}

interface PurchaseOrder {
  id: number;
  reference: string;
  status: 'draft' | 'ordered' | 'received';
  totalAmount: number;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

const $q = useQuasar();
const authStore = useAuthStore();

const purchaseOrders = ref<PurchaseOrder[]>([]);
const suppliers = ref<Supplier[]>([]);
const productVariants = ref<ProductVariant[]>([]);
const loading = ref(false);
const saving = ref(false);
const savingItem = ref(false);
const filter = ref('');
const showDialog = ref(false);
const showItemsDialog = ref(false);
const isEditing = ref(false);
const currentPO = ref<PurchaseOrder | null>(null);
const currentItems = ref<PurchaseOrderItem[]>([]);

const editedPO = ref<Partial<Omit<PurchaseOrder, 'supplier'>> & { supplier: number | null }>({
  reference: '',
  status: 'draft',
  totalAmount: 0,
  supplier: null,
});

const newItem = ref<{
  productVariant: number | null;
  quantity: number;
  costPrice: number;
}>({
  productVariant: null,
  quantity: 1,
  costPrice: 0,
});

const columns: QTableColumn<PurchaseOrder>[] = [
  { name: 'reference', label: $t('purchasing.reference'), align: 'left', field: 'reference', sortable: true },
  { name: 'supplier', label: $t('purchasing.supplier'), align: 'left', field: (row) => row.supplier?.name || '', sortable: true },
  { name: 'status', label: $t('common.status'), align: 'left', field: 'status', sortable: true },
  { name: 'totalAmount', label: $t('purchasing.totalAmount'), align: 'right', field: 'totalAmount', sortable: true, format: (val: number) => `$${val.toFixed(2)}` },
  { name: 'actions', label: $t('common.actions'), align: 'right', field: (row) => row.id },
];

const itemColumns: QTableColumn<PurchaseOrderItem>[] = [
  { name: 'productVariant', label: $t('purchasing.productVariant'), align: 'left', field: (row) => row.productVariant?.name || '' },
  { name: 'quantity', label: $t('common.quantity'), align: 'right', field: 'quantity' },
  { name: 'costPrice', label: $t('purchasing.costPrice'), align: 'right', field: 'costPrice', format: (val: number) => `$${val.toFixed(2)}` },
  { name: 'actions', label: $t('common.actions'), align: 'right', field: (row) => row.id },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'grey';
    case 'ordered':
      return 'blue';
    case 'received':
      return 'green';
    default:
      return 'grey';
  }
};

const fetchPurchaseOrders = async () => {
  loading.value = true;
  try {
    const response = await api.get('/purchase-orders?populate=*', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    purchaseOrders.value = response.data.data;
  } catch (error) {
    let errorMessage = $t('purchasing.failedToFetchPurchaseOrders');
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

const fetchSuppliers = async () => {
  try {
    const response = await api.get('/suppliers', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    suppliers.value = response.data.data;
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
  }
};

const fetchProductVariants = async () => {
  try {
    const response = await api.get('/product-variants', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    productVariants.value = response.data.data;
  } catch (error) {
    console.error('Failed to fetch product variants:', error);
  }
};

const openAddDialog = () => {
  isEditing.value = false;
  editedPO.value = { reference: '', status: 'draft', totalAmount: 0, supplier: null };
  showDialog.value = true;
};

const openEditDialog = (po: PurchaseOrder) => {
  isEditing.value = true;
  editedPO.value = { 
    ...po, 
    supplier: po.supplier?.id || null 
  };
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editedPO.value = { reference: '', status: 'draft', totalAmount: 0, supplier: null };
};

const savePurchaseOrder = async () => {
  saving.value = true;
  try {
    const data = { data: editedPO.value };
    if (isEditing.value && editedPO.value.id) {
      await api.put(`/purchase-orders/${editedPO.value.id}`, data, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      $q.notify({ type: 'positive', message: $t('purchasing.purchaseOrderUpdatedSuccessfully') });
    } else {
      await api.post('/purchase-orders', data, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      $q.notify({ type: 'positive', message: $t('purchasing.purchaseOrderAddedSuccessfully') });
    }
    await fetchPurchaseOrders();
    closeDialog();
  } catch (error) {
    let errorMessage = $t('purchasing.failedToSavePurchaseOrder');
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
    message: $t('purchasing.confirmDeletePurchaseOrder'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/purchase-orders/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        $q.notify({ type: 'positive', message: $t('purchasing.purchaseOrderDeletedSuccessfully') });
        await fetchPurchaseOrders();
      } catch (error) {
        let errorMessage = $t('purchasing.failedToDeletePurchaseOrder');
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

const openItemsDialog = (po: PurchaseOrder) => {
  currentPO.value = po;
  currentItems.value = po.items || [];
  showItemsDialog.value = true;
};

const closeItemsDialog = () => {
  showItemsDialog.value = false;
  currentPO.value = null;
  currentItems.value = [];
};

const openAddItemDialog = () => {
  newItem.value = { productVariant: null, quantity: 1, costPrice: 0 };
};

const addItem = async () => {
  savingItem.value = true;
  try {
    const data = {
      data: {
        ...newItem.value,
        purchaseOrder: currentPO.value?.id,
      },
    };
    await api.post('/purchase-order-items', data, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    $q.notify({ type: 'positive', message: $t('purchasing.itemAddedSuccessfully') });
    await fetchPurchaseOrders();
    openItemsDialog(currentPO.value!);
  } catch (error) {
    let errorMessage = $t('purchasing.failedToAddItem');
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    $q.notify({ type: 'negative', message: errorMessage });
  } finally {
    savingItem.value = false;
  }
};

const deleteItem = (id: number) => {
  $q.dialog({
    title: $t('common.confirm'),
    message: $t('purchasing.confirmDeleteItem'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/purchase-order-items/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        $q.notify({ type: 'positive', message: $t('purchasing.itemDeletedSuccessfully') });
        await fetchPurchaseOrders();
        openItemsDialog(currentPO.value!);
      } catch (error) {
        let errorMessage = $t('purchasing.failedToDeleteItem');
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

const receivePurchaseOrder = (po: PurchaseOrder) => {
  $q.dialog({
    title: $t('purchasing.receiveProducts'),
    message: $t('purchasing.confirmReceiveProducts'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.post(`/purchase-orders/${po.id}/receive`, {}, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        $q.notify({ type: 'positive', message: $t('purchasing.purchaseOrderReceivedSuccessfully') });
        await fetchPurchaseOrders();
      } catch (error) {
        let errorMessage = $t('purchasing.failedToReceivePurchaseOrder');
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
  void fetchPurchaseOrders();
  void fetchSuppliers();
  void fetchProductVariants();
});
</script>
