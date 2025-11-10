<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col text-h5">Product Management</div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" label="Add Product" @click="openAddDialog" />
      </div>
    </div>

    <q-table
      :rows="products"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :filter="filter"
      no-data-label="No products found"
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

    <!-- Add/Edit Product Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ isEditing ? 'Edit Product' : 'Add Product' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveProduct" class="q-gutter-md">
            <q-input filled v-model="editedProduct.name" label="Product Name" lazy-rules :rules="[val => !!val || 'Name is required']" />
            <q-input filled v-model="editedProduct.sku" label="SKU" lazy-rules :rules="[val => !!val || 'SKU is required']" />
            <q-input filled v-model="editedProduct.category" label="Category" />
            <q-input filled v-model="editedProduct.brand" label="Brand" />
            <q-input filled v-model="editedProduct.price" label="Price" type="number" step="0.01" lazy-rules :rules="[val => val >= 0 || 'Price must be positive']" />
            <q-input filled v-model="editedProduct.stock" label="Stock" type="number" step="1" lazy-rules :rules="[val => val >= 0 || 'Stock must be positive']" />
            <q-input filled v-model="editedProduct.description" label="Description" type="textarea" />
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
import { type QTableColumn, useQuasar } from 'quasar'; // Combined and fixed import
import { useAuthStore } from 'stores/auth';
import axios from 'axios'; // Import axios for isAxiosError

const $q = useQuasar();
const authStore = useAuthStore();

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

const products = ref<Product[]>([]);
const loading = ref(false);
const filter = ref('');
const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const editedProduct = ref<Partial<Product>>({
  name: '',
  sku: '',
  category: '',
  brand: '',
  price: 0,
  stock: 0,
  description: '',
});

const columns: QTableColumn<Product>[] = [
  { name: 'name', required: true, label: 'Product Name', align: 'left', field: 'name', sortable: true },
  { name: 'sku', label: 'SKU', align: 'left', field: 'sku', sortable: true },
  { name: 'category', label: 'Category', align: 'left', field: 'category', sortable: true },
  { name: 'brand', label: 'Brand', align: 'left', field: 'brand', sortable: true },
  { name: 'price', label: 'Price', align: 'right', field: 'price', format: (val: number) => `$${val.toFixed(2)}`, sortable: true },
  { name: 'stock', label: 'Stock', align: 'right', field: 'stock', sortable: true },
  { name: 'actions', label: 'Actions', align: 'right', field: (row) => row.id },
];

const fetchProducts = async () => {
  loading.value = true;
  try {
    const response = await api.get('/products', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    products.value = response.data.data;
  } catch (error: unknown) {
    let errorMessage = 'Failed to fetch products.';
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
  editedProduct.value = { name: '', sku: '', category: '', brand: '', price: 0, stock: 0, description: '' };
  showDialog.value = true;
};

const openEditDialog = (product: Product) => {
  isEditing.value = true;
  editedProduct.value = { ...product }; // Copy product data
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editedProduct.value = { name: '', sku: '', category: '', brand: '', price: 0, stock: 0, description: '' };
};

const saveProduct = async () => {
  saving.value = true;
  try {
    const productData = { data: editedProduct.value }; // Strapi expects data wrapped in 'data'
    if (isEditing.value && editedProduct.value.id) {
      await api.put(`/products/${editedProduct.value.id}`, productData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      $q.notify({ type: 'positive', message: 'Product updated successfully!' });
    } else {
      await api.post('/products', productData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      $q.notify({ type: 'positive', message: 'Product added successfully!' });
    }
    await fetchProducts(); // Refresh list
    closeDialog();
  } catch (error: unknown) {
    let errorMessage = 'Failed to save product.';
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
    message: 'Are you sure you want to delete this product?',
    cancel: true,
    persistent: true,
  }).onOk(() => { // Removed async from here
    void (async () => { // Wrap in void (async () => {}) to handle misused promises
      try {
        await api.delete(`/products/${id}`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });
        $q.notify({ type: 'positive', message: 'Product deleted successfully!' });
        await fetchProducts(); // Refresh list
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete product.';
        if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        $q.notify({ type: 'negative', message: errorMessage });
      }
    })(); // Immediately invoke the async function
  });
};

onMounted(() => {
  fetchProducts().catch(err => console.error('Error fetching products on mount:', err));
});
</script>

