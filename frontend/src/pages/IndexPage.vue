<template>
  <q-page class="q-pa-md">
    <div v-if="loading" class="text-center">
      <q-spinner-dots color="primary" size="40px" />
      <p>Loading products...</p>
    </div>
    <div v-else-if="error" class="text-center text-negative">
      <p>An error occurred:</p>
      <pre>{{ error.message }}</pre>
    </div>
    <div v-else-if="products.length > 0">
      <h5 class="q-my-md">Products</h5>
      <q-list bordered separator>
        <q-item v-for="product in products" :key="product.id">
          <q-item-section>
            <q-item-label>{{ product.name }}</q-item-label>
            <q-item-label caption>SKU: {{ product.sku }} | Category: {{ product.category }} | Brand: {{ product.brand }}</q-item-label>
            <q-item-label caption>Price: ${{ product.price }} | Stock: {{ product.stock }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div v-else class="text-center text-grey">
      <p>No products found. Have you created and published a product in the Strapi admin panel?</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios'; // Import the configured axios instance

// Define the structure of a product based on Strapi's API response
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
  brand: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

const products = ref<Product[]>([]);
const loading = ref<boolean>(true);
const error = ref<Error | null>(null);

const fetchProducts = async () => {
  loading.value = true;
  error.value = null;
  try {
    // Strapi returns data in a 'data' property
    const response = await api.get('/products');
    products.value = response.data.data;
  } catch (e) {
    error.value = e as Error;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProducts().catch(err => {
    console.error('Failed to fetch products:', err);
    error.value = err; // Update the error state
  });
});
</script>
