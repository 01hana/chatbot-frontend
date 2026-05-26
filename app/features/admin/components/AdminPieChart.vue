<script setup lang="ts">
/**
 * AdminPieChart (T-052)
 * Renders a donut chart for distribution data (intent / handoff reason).
 * Props-driven — no API calls inside.
 */

export interface PieDataItem {
  label: string
  value: number
}

const props = defineProps<{
  data: PieDataItem[]
  title?: string
  height?: number
}>()

// DonutChart expects number[] for data and a labels record
const chartValues = computed(() => props.data.map((d) => d.value))

const PALETTE = [
  'var(--ui-primary)',
  'var(--ui-info)',
  'var(--ui-success)',
  'var(--ui-warning)',
  'var(--ui-error)',
  '#a78bfa',
  '#fb923c',
]

const categories = computed(() => {
  const result: Record<string, BulletLegendItemInterface> = {}
  props.data.forEach((d, i) => {
    result[d.label] = {
      name: d.label,
      color: PALETTE[i % PALETTE.length]!,
    }
  })
  return result
})
</script>

<template>
  <UCard>
    <template v-if="props.title" #header>
      <p class="text-sm font-medium text-gray-700">{{ props.title }}</p>
    </template>

    <ClientOnly>
      <DonutChart
        v-if="chartValues.length > 0"
        :data="chartValues"
        :categories="categories"
        :height="props.height ?? 200"
        :radius="80"
        :pad-angle="0.05"
        :arc-width="22"
        :hide-legend="false"
      />
      <AppEmptyState v-else title="暫無分布資料" />
    </ClientOnly>
  </UCard>
</template>
