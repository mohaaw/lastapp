<template>
  <q-page class="flex flex-center">
    <q-card style="width: 400px">
      <q-card-section class="text-center">
        <div class="text-h6">{{ $t('auth.loginTitle') }}</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input
            filled
            v-model="identifier"
            :label="$t('auth.emailOrUsername')"
            lazy-rules
            :rules="[(val) => (val && val.length > 0) || $t('auth.pleaseTypeEmail')]"
          />

          <q-input
            filled
            type="password"
            v-model="password"
            :label="$t('auth.password')"
            lazy-rules
            :rules="[(val) => (val && val.length > 0) || $t('auth.pleaseTypePassword')]"
          />

          <div v-if="loginError" class="text-negative text-center">
            {{ loginError }}
          </div>

          <div>
            <q-btn :label="$t('auth.loginButton')" type="submit" color="primary" :loading="loading" class="full-width" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import axios from 'axios'; // Import axios for type checking

const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

const identifier = ref('');
const password = ref('');
const loading = ref(false);
const loginError = ref<string | null>(null);

const handleLogin = async () => {
  loading.value = true;
  loginError.value = null;
  try {
    await authStore.login({ identifier: identifier.value, password: password.value });
    $q.notify({
      type: 'positive',
      message: 'Login successful!',
    });
    void router.push('/'); // Redirect to dashboard on successful login
  } catch (error: unknown) { // Changed to unknown
    let errorMessage = 'An unexpected error occurred.';
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    loginError.value = errorMessage;
    $q.notify({
      type: 'negative',
      message: errorMessage, // Ensure message is string
    });
  } finally {
    loading.value = false;
  }
};
</script>
