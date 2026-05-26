<script setup lang="ts">
import AdminSidebar from '../features/admin/components/AdminSidebar.vue';
import AdminTopbar from '../features/admin/components/AdminTopbar.vue';
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <AdminSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <AdminTopbar />

      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
