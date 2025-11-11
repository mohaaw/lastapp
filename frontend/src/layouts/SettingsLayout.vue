<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="arrow_back" aria-label="Back" to="/" />
        <q-toolbar-title>Settings</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above bordered :width="250">
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label header>Settings Menu</q-item-label>
          <q-item v-for="item in menuItems" :key="item.title" :to="item.link" clickable v-ripple exact>
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.title }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
const menuItems = [
  {
    title: 'General',
    icon: 'business',
    link: '/settings/general',
  },
  {
    title: 'Financial',
    icon: 'account_balance',
    link: '/settings/financial',
  },
  {
    title: 'Inventory',
    icon: 'inventory',
    link: '/settings/inventory',
  },
  {
    title: 'Email',
    icon: 'email',
    link: '/settings/email',
  },
  {
    title: 'Application',
    icon: 'settings_applications',
    link: '/settings/app',
  },
];
</script>
