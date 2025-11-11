<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Application Settings</div>
        <div class="text-subtitle2">Configure application-specific settings.</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-toggle
          :model-value="darkMode"
          @update:model-value="toggleDarkMode"
          label="Dark Mode"
          left-label
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const darkMode = ref($q.dark.isActive);

const toggleDarkMode = (value: boolean) => {
  $q.dark.set(value);
  darkMode.value = value; // Ensure the ref is updated
  localStorage.setItem('darkMode', String(value));
};

onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    const isDarkMode = savedDarkMode === 'true';
    // No need to set darkMode.value here as the toggle's model-value will reflect it
    // and we don't want to trigger the @update:model-value handler on mount.
    // We just need to set the initial state for Quasar's dark mode plugin.
    if ($q.dark.isActive !== isDarkMode) {
      $q.dark.set(isDarkMode);
      darkMode.value = isDarkMode;
    }
  }
});
</script>
