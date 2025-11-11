import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/DashboardPage.vue'), meta: { requiresAuth: true } },
      { path: 'customers', component: () => import('pages/CustomersPage.vue'), meta: { requiresAuth: true } },
      { path: 'pos', component: () => import('pages/POSPage.vue'), meta: { requiresAuth: true } },
      { path: 'maintenance', component: () => import('pages/MaintenancePage.vue'), meta: { requiresAuth: true } },
      { path: 'product-templates', component: () => import('pages/ProductTemplatesPage.vue'), meta: { requiresAuth: true } },
      { path: 'product-variants', component: () => import('pages/ProductVariantsPage.vue'), meta: { requiresAuth: true } },
      { path: 'stock-locations', component: () => import('pages/StockLocationsPage.vue'), meta: { requiresAuth: true } },
      { path: 'stock-moves', component: () => import('pages/StockMovesPage.vue'), meta: { requiresAuth: true } },
      { path: 'login', component: () => import('pages/LoginPage.vue'), meta: { guestOnly: true } },
    ],
  },

  {
    path: '/settings',
    component: () => import('layouts/SettingsLayout.vue'),
    children: [
      { path: 'general', component: () => import('pages/GeneralSettings.vue'), meta: { requiresAuth: true } },
      { path: 'financial', component: () => import('pages/FinancialSettings.vue'), meta: { requiresAuth: true } },
      { path: 'inventory', component: () => import('pages/InventorySettings.vue'), meta: { requiresAuth: true } },
      { path: 'email', component: () => import('pages/EmailSettings.vue'), meta: { requiresAuth: true } },
      { path: 'app', component: () => import('pages/AppSettings.vue'), meta: { requiresAuth: true } },
    ],
    meta: { requiresAuth: true },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
