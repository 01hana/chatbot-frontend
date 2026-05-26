<script setup lang="ts">
const route = useRoute();

const navItems = [
  { label: 'Dashboard', icon: 'i-heroicons-chart-bar', to: '/admin/dashboard' },
  { label: '對話紀錄', icon: 'i-heroicons-chat-bubble-left-right', to: '/admin/conversations' },
  { label: 'Lead', icon: 'i-heroicons-user-plus', to: '/admin/leads' },
  { label: 'Ticket', icon: 'i-heroicons-ticket', to: '/admin/tickets' },
  { label: '知識庫', icon: 'i-heroicons-book-open', to: '/admin/knowledge' },
  { label: '意圖/模板', icon: 'i-heroicons-light-bulb', to: '/admin/intents' },
  { label: '快捷提問', icon: 'i-heroicons-bolt', to: '/admin/quick-replies' },
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
  <aside class="w-60 shrink-0 flex flex-col bg-white border-r border-gray-200 min-h-screen">
    <!-- Logo / brand -->
    <div class="h-14 flex items-center gap-2 px-5 border-b border-gray-200">
      <UIcon name="i-heroicons-cube-transparent" class="w-6 h-6 text-primary-500 shrink-0" />
      <span class="font-semibold text-gray-800 text-sm truncate">震南 Admin</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="
          isActive(item.to)
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        "
      >
        <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
