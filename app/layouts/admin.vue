<script setup lang="ts">
import AdminSidebar from '../features/admin/components/AdminSidebar.vue';
import AdminTopbar from '../features/admin/components/AdminTopbar.vue';
</script>

<template>
  <div
    class="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50/30 via-sky-50/40 to-indigo-50/30"
  >
    <AdminSidebar />
    <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <AdminTopbar />

      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
