<script setup lang="ts">
// T-013 — 前台首頁，右上角低調「管理後台」入口
</script>

<template>
  <!-- T-016 will mount <ChatWidget /> here -->
  <div class="relative min-h-screen">
    <!-- 右上角低調入口按鈕 -->
    <div class="absolute top-4 right-4 z-10">
      <UButton
        variant="ghost"
        size="sm"
        color="neutral"
        @click="navigateTo('/admin/dashboard')"
      >
        管理後台
      </UButton>
    </div>
  </div>
</template>
