<script setup lang="ts">
defineProps({
  error: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center">
    <h1 class="text-3xl font-bold text-red-600">Error {{ error.statusCode }}</h1>
    <p class="text-lg mt-4">{{ error.message }}</p>
    <NuxtLink to="/" class="mt-6 text-blue-500 underline">Go Home</NuxtLink>
  </div>
</template>

<style scoped></style>
