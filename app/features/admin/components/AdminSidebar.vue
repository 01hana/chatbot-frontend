<script setup lang="ts">
const route = useRoute();
const { isCollapsed, setCollapsed, isMobileOpen, setMobileOpen, toggleMobileOpen } = useAdminNav();

// Reset collapsed state when viewport drops below lg, so mobile drawer always shows icon + label
const isLg = useMediaQuery('(min-width: 1024px)');
watch(isLg, lg => {
  if (!lg) setCollapsed(false);
});

// Close mobile drawer on navigation
watch(
  () => route.path,
  () => {
    setMobileOpen(false);
  },
);

const navItems = [
  { label: 'Dashboard', icon: 'i-heroicons-chart-bar', to: '/admin/dashboard' },
  { label: '對話紀錄', icon: 'i-heroicons-chat-bubble-left-right', to: '/admin/conversations' },
  { label: 'Lead', icon: 'i-heroicons-user-plus', to: '/admin/leads' },
  { label: 'Ticket', icon: 'i-heroicons-ticket', to: '/admin/tickets' },
  { label: '知識庫', icon: 'i-heroicons-book-open', to: '/admin/knowledge' },
  { label: '意圖/模板', icon: 'i-heroicons-light-bulb', to: '/admin/intent' },
  {
    label: 'Widget 設定',
    icon: 'i-heroicons-adjustments-horizontal',
    to: '/admin/widget-settings',
  },
  { label: '稽核事件', icon: 'i-heroicons-shield-check', to: '/admin/audit' },
  { label: '回饋紀錄', icon: 'i-heroicons-star', to: '/admin/feedback' },
];

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/');
}
</script>

<template>
  <!-- Mobile backdrop -->
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 z-30 bg-black/40 lg:hidden"
    @click="toggleMobileOpen"
  />

  <aside
    class="fixed top-0 left-0 h-full w-64 z-40 flex flex-col bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-auto"
    :class="[
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      isCollapsed ? 'lg:w-16' : 'lg:w-60',
    ]"
  >
    <!-- Logo / brand -->
    <div
      class="h-14 flex items-center shrink-0 border-b border-gray-200 transition-all duration-300"
      :class="isCollapsed ? 'justify-center px-0' : 'gap-2 px-5'"
    >
      <UIcon name="i-heroicons-cube-transparent" class="w-6 h-6 text-primary-500 shrink-0" />
      <span v-show="!isCollapsed" class="font-semibold text-gray-800 text-sm truncate">
        震南 Admin
      </span>
    </div>

    <!-- Navigation -->
    <nav
      class="flex-1 overflow-y-auto transition-all duration-300"
      :class="isCollapsed ? 'p-2' : 'p-3'"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :title="isCollapsed ? item.label : undefined"
        class="flex items-center py-2 rounded-lg text-sm transition-colors duration-300 mb-0.5"
        :class="[
          isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
          isActive(item.to)
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800',
        ]"
      >
        <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
        <span v-show="!isCollapsed" class="truncate">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
