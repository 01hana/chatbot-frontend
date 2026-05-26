<script setup lang="ts">
const props = defineProps<{
  title: string;
  value: string | number;
  description?: string;
  to?: string;
  icon?: string;
  loading?: boolean;
}>();
</script>

<template>
  <NuxtLink v-if="to" :to class="block group">
    <UCard class="transition-shadow hover:shadow-md cursor-pointer border-t-4 border-blue-500">
      <div class="flex items-start justify-between gap-4 py-4">
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-500 truncate">{{ title }}</p>
          <p v-if="loading" class="mt-1 h-8 w-20 rounded bg-gray-100 animate-pulse" />
          <p v-else class="mt-1 text-2xl font-semibold text-gray-900 truncate">{{ value }}</p>
          <p v-if="description" class="mt-1 text-xs text-gray-400 truncate">{{ description }}</p>
        </div>
        <UIcon
          v-show="icon"
          :name="icon"
          class="w-8 h-8 bg-linear-to-r from-cyan-500 to-blue-500 shrink-0 mt-0.5"
        />
      </div>
    </UCard>
  </NuxtLink>

  <UCard v-else class="border-t-4 border-blue-400">
    <div class="flex items-start justify-between gap-4 py-4">
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-500 truncate">{{ title }}</p>
        <p v-if="loading" class="mt-1 h-8 w-20 rounded bg-gray-100 animate-pulse" />
        <p v-else class="mt-1 text-2xl font-semibold text-gray-900 truncate">{{ value }}</p>
        <p v-if="description" class="mt-1 text-xs text-gray-400 truncate">{{ description }}</p>
      </div>
      <UIcon
        v-show="icon"
        :name="icon"
        class="w-8 h-8 bg-linear-to-r from-cyan-500 to-blue-500 shrink-0 mt-0.5"
      />
    </div>
  </UCard>
</template>
