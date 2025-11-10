import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'stores/auth'; // Import the auth store

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // Ensure auth state is checked on every navigation
    if (!authStore.isAuthenticated && authStore.token) {
      authStore.checkAuth(); // Re-check auth status if token exists but state isn't set
    }

    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      // If route requires auth and user is not logged in, redirect to login
      next({ path: '/login', query: { redirect: to.fullPath } });
    } else if (to.meta.guestOnly && authStore.isLoggedIn) {
      // If route is for guests only and user is logged in, redirect to home
      next({ path: '/' });
    } else {
      next(); // Allow navigation
    }
  });

  return Router;
});
