<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>{{ $t('common.yourShopErp') }}</q-toolbar-title>

        <q-btn v-if="authStore.isLoggedIn" flat round dense icon="logout" @click="logout" />
        <div>Quasar v{{ quasar.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>{{ $t('navigation.essentialLinks') }}</q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';

const quasar = useQuasar();
const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const logout = () => {
  authStore.logout();
  void router.push('/login');
};

const linksList = computed(() => [
  {
    title: t('navigation.dashboard'),
    caption: t('navigation.dashboardCaption'),
    icon: 'dashboard',
    link: '/',
  },
  {
    title: t('navigation.customerManagement'),
    caption: t('navigation.customerManagementCaption'),
    icon: 'people',
    link: '/customers',
  },
  {
    title: t('navigation.pointOfSale'),
    caption: t('navigation.pointOfSaleCaption'),
    icon: 'point_of_sale',
    link: '/pos',
  },
  {
    title: t('navigation.productTemplates'),
    caption: t('navigation.productTemplatesCaption'),
    icon: 'style',
    link: '/product-templates',
  },
  {
    title: t('navigation.productVariants'),
    caption: t('navigation.productVariantsCaption'),
    icon: 'inventory_2',
    link: '/product-variants',
  },
  {
    title: t('navigation.stockLocations'),
    caption: t('navigation.stockLocationsCaption'),
    icon: 'warehouse',
    link: '/stock-locations',
  },
  {
    title: t('navigation.stockMoves'),
    caption: t('navigation.stockMovesCaption'),
    icon: 'sync_alt',
    link: '/stock-moves',
  },
  {
    title: t('navigation.suppliers'),
    caption: t('navigation.suppliersCaption'),
    icon: 'local_shipping',
    link: '/suppliers',
  },
  {
    title: t('navigation.purchaseOrders'),
    caption: t('navigation.purchaseOrdersCaption'),
    icon: 'receipt',
    link: '/purchase-orders',
  },
  {
    title: t('navigation.chartOfAccounts'),
    caption: t('navigation.chartOfAccountsCaption'),
    icon: 'account_balance',
    link: '/chart-of-accounts',
  },
  {
    title: t('navigation.journalEntries'),
    caption: t('navigation.journalEntriesCaption'),
    icon: 'book',
    link: '/journal-entries',
  },
  {
    title: t('navigation.maintenanceManagement'),
    caption: t('navigation.maintenanceManagementCaption'),
    icon: 'build',
    link: '/maintenance',
  },
  {
    title: t('navigation.settings'),
    caption: t('navigation.settingsCaption'),
    icon: 'settings',
    link: '/settings/general',
  },
] as EssentialLinkProps[]);

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
