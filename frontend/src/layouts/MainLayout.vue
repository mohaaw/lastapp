<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Your Shop ERP </q-toolbar-title>

        <q-btn v-if="authStore.isLoggedIn" flat round dense icon="logout" @click="logout" />
        <div>Quasar v{{ quasar.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router'; // Import useRouter
import { useAuthStore } from 'stores/auth'; // Import useAuthStore
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';

const quasar = useQuasar();
const authStore = useAuthStore(); // Initialize authStore
const router = useRouter(); // Initialize router

const logout = () => {
  authStore.logout();
  void router.push('/login');
};

const linksList: EssentialLinkProps[] = [
  {
    title: 'Dashboard',
    caption: 'Shop Overview',
    icon: 'dashboard',
    link: '/',
  },
  {
    title: 'Products Management',
    caption: 'Manage your shop products',
    icon: 'store',
    link: '/products',
  },
  {
    title: 'Customer Management',
    caption: 'Manage your customers',
    icon: 'people',
    link: '/customers',
  },
  {
    title: 'Point of Sale',
    caption: 'Process sales transactions',
    icon: 'point_of_sale',
    link: '/pos',
  },
  {
    title: 'Maintenance Management',
    caption: 'Manage repair tickets',
    icon: 'build',
    link: '/maintenance',
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
