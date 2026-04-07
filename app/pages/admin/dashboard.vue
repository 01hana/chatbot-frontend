<script setup lang="ts">
// T-010 — /admin/dashboard 路由，使用 admin layout 骨架
definePageMeta({ layout: 'admin' });

import ChartsDemo from './ChartsDemo.vue';
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-gray-800">Dashboard</h1>

    <p class="mt-2 text-sm text-gray-500">後台功能將於 Phase 3（T-049 起）實作。</p>

    <ChartsDemo />
  </div>
</template>
