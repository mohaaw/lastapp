<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Point of Sale</div>

    <div class="row q-col-gutter-md">
      <!-- Product List Section -->
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h6">Available Products</div>
          </q-card-section>
          <q-card-section>
            <q-input
              filled
              dense
              debounce="300"
              v-model="productFilter"
              placeholder="Search products..."
              class="q-mb-md"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-list bordered separator>
              <q-item v-for="product in filteredProducts" :key="product.id" clickable @click="addToCart(product)">
                <q-item-section>
                  <q-item-label>{{ product.name }} ({{ product.sku }})</q-item-label>
                  <q-item-label caption>
                    {{ product.brand }} - {{ product.category }} | ${{ product.price.toFixed(2) }} | Stock: {{ product.stock }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn icon="add_shopping_cart" flat round dense color="primary" @click.stop="addToCart(product)" />
                </q-item-section>
              </q-item>
              <q-item v-if="filteredProducts.length === 0 && !loadingProducts">
                <q-item-section>No products found.</q-item-section>
              </q-item>
              <q-item v-if="loadingProducts">
                <q-item-section class="text-center">
                  <q-spinner-dots color="primary" size="2em" />
                  Loading products...
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Cart Section -->
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-h6">Cart</div>
          </q-card-section>
          <q-card-section>
            <q-select
              filled
              v-model="selectedCustomer"
              :options="customerOptions"
              label="Select Customer (Optional)"
              emit-value
              map-options
              option-value="id"
              option-label="name"
              class="q-mb-md"
              clearable
            />

            <q-list bordered separator>
              <q-item v-for="(item, index) in cart" :key="item.product.id">
                <q-item-section>
                  <q-item-label>{{ item.product.name }}</q-item-label>
                  <q-item-label caption>
                    {{ item.quantity }} x ${{ item.product.price.toFixed(2) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn icon="remove" flat round dense color="negative" @click="removeFromCart(index)" />
                </q-item-section>
              </q-item>
              <q-item v-if="cart.length === 0">
                <q-item-section>Cart is empty.</q-item-section>
              </q-item>
            </q-list>
            <q-separator class="q-my-md" />
            <div class="text-h6 text-right">Total: ${{ cartTotal.toFixed(2) }}</div>
            <q-btn
              label="Process Sale"
              color="positive"
              class="full-width q-mt-md"
              :disable="cart.length === 0"
              @click="processSale"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import axios from 'axios';

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

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const allProducts = ref<Product[]>([]);
const products = ref<Product[]>([]); // Products displayed in the list
const loadingProducts = ref(false);
const productFilter = ref('');
const cart = ref<CartItem[]>([]);

const customers = ref<Customer[]>([]);
const selectedCustomer = ref<number | null>(null);
const customerOptions = computed(() => {
  return customers.value.map(customer => ({
    label: `${customer.name} (${customer.email})`,
    value: customer.id,
  }));
});

const filteredProducts = computed(() => {
  if (!productFilter.value) {
    return products.value;
  }
  const filterLower = productFilter.value.toLowerCase();
  return products.value.filter(
    (p) =>
      p.name.toLowerCase().includes(filterLower) ||
      p.sku.toLowerCase().includes(filterLower) ||
      p.brand.toLowerCase().includes(filterLower) ||
      p.category.toLowerCase().includes(filterLower)
  );
});

const cartTotal = computed(() => {
  return cart.value.reduce((total, item) => total + item.product.price * item.quantity, 0);
});

const fetchProducts = async () => {
  loadingProducts.value = true;
  try {
    const response = await api.get('/products', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    allProducts.value = response.data.data;
    products.value = response.data.data; // Initially show all products
  } catch (error: unknown) {
    let errorMessage = 'Failed to fetch products.';
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    $q.notify({ type: 'negative', message: errorMessage });
  } finally {
    loadingProducts.value = false;
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
  } catch (error: unknown) {
    let errorMessage = 'Failed to fetch customers.';
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    $q.notify({ type: 'negative', message: errorMessage });
  }
};

const addToCart = (product: Product) => {
  const existingItem = cart.value.find((item) => item.product.id === product.id);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.value.push({ product, quantity: 1 });
  }
  $q.notify({ type: 'positive', message: `${product.name} added to cart.` });
};

const removeFromCart = (index: number) => {
  const item = cart.value[index];
  if (!item) {
    return;
  }
  if (item.quantity > 1) {
    item.quantity--;
  } else {
    cart.value.splice(index, 1);
  }
  $q.notify({ type: 'info', message: `${item.product.name} removed from cart.` });
};

const processSale = async () => {
  if (cart.value.length === 0) {
    $q.notify({ type: 'negative', message: 'Cart is empty. Add products to process sale.' });
    return;
  }

  try {
    const saleData = {
      cart: cart.value.map(item => ({
        product: item.product,
        quantity: item.quantity,
      })),
      customerId: selectedCustomer.value,
    };

    await api.post('/invoices/process-sale', saleData, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });

    $q.notify({
      type: 'positive',
      message: `Sale processed for $${cartTotal.value.toFixed(2)}. Cart cleared.`,
    });
    cart.value = [];
    selectedCustomer.value = null;
    await fetchProducts(); // Refresh product stock
  } catch (error: unknown) {
    let errorMessage = 'Failed to process sale.';
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    $q.notify({ type: 'negative', message: errorMessage });
  }
};

onMounted(() => {
  fetchProducts().catch(err => console.error('Error fetching products on mount:', err));
  fetchCustomers().catch(err => console.error('Error fetching customers on mount:', err));
});
</script>