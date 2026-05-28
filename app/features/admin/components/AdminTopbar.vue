<script setup lang="ts">
import { navigateTo } from '#app';

const route = useRoute();
const { isCollapsed, toggleCollapsed, toggleMobileOpen } = useAdminNav();

const pageTitle = computed(() =>
  typeof route.meta.title === 'string' ? route.meta.title : '後台管理',
);

function goToFrontend() {
  navigateTo('/');
}
</script>

<template>
  <header
    class="w-full h-14 shrink-0 flex items-center justify-between px-6 bg-white border-b border-gray-200"
  >
    <div class="flex items-center gap-2">
      <h1 class="text-sm font-semibold text-gray-800 truncate">{{ pageTitle }}</h1>
      <!-- Mobile: hamburger -->
      <UButton
        class="lg:hidden"
        variant="ghost"
        color="neutral"
        size="xs"
        icon="i-heroicons-bars-3"
        @click="toggleMobileOpen"
      />
      <!-- Desktop: collapse chevron -->
      <UButton
        class="hidden lg:flex"
        variant="ghost"
        color="neutral"
        size="xs"
        :icon="isCollapsed ? 'i-heroicons-chevron-double-right' : 'i-heroicons-chevron-double-left'"
        @click="toggleCollapsed"
      />
    </div>
    <UButton
      variant="ghost"
      color="neutral"
      size="sm"
      icon="i-heroicons-arrow-left"
      @click="goToFrontend"
    >
      返回前台
    </UButton>
  </header>
</template>
