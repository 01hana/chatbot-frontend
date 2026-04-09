<script setup lang="ts">
// T-013 — 前台首頁，右上角低調「管理後台」入口
// T-016 — 掛載 ChatWidget

import ChatWidget from '~/features/chat/components/ChatWidget.vue';
</script>

<template>
  <div class="relative min-h-screen">
    <!-- 右上角低調入口按鈕 -->
    <div class="absolute top-4 right-4 z-10">
      <UButton variant="ghost" size="sm" color="neutral" @click="navigateTo('/admin/dashboard')">
        管理後台
      </UButton>
    </div>

    <!-- T-016: Chat Widget (fixed bottom-right) -->
    <ChatWidget />
  </div>
</template>
