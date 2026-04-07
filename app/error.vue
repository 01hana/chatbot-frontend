<script setup lang="ts">
// T-011 — 全域錯誤頁
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

const title = computed(() => (is404.value ? '找不到頁面' : '系統發生錯誤'))

const description = computed(() =>
  is404.value
    ? '找不到頁面，請確認網址是否正確。'
    : '系統發生錯誤，請稍後再試。'
)

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-gray-50">
    <!-- Error code badge -->
    <div
      class="text-8xl font-black select-none"
      :class="is404 ? 'text-gray-300' : 'text-red-200'"
    >
      {{ error.statusCode }}
    </div>

    <!-- Title & description -->
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-semibold text-gray-800">{{ title }}</h1>
      <p class="text-sm text-gray-500">{{ description }}</p>
    </div>

    <!-- CTA -->
    <UButton variant="solid" @click="goHome">回首頁</UButton>
  </div>
</template>

