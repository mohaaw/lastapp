import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/DashboardPage.vue'), meta: { requiresAuth: true } },
      { path: 'products', component: () => import('pages/ProductsPage.vue'), meta: { requiresAuth: true } },
      { path: 'customers', component: () => import('pages/CustomersPage.vue'), meta: { requiresAuth: true } },
      { path: 'pos', component: () => import('pages/POSPage.vue'), meta: { requiresAuth: true } },
      { path: 'maintenance', component: () => import('pages/MaintenancePage.vue'), meta: { requiresAuth: true } }, // New Maintenance route
      { path: 'login', component: () => import('pages/LoginPage.vue'), meta: { guestOnly: true } },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
