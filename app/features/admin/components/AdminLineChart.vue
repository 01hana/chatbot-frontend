<script setup lang="ts">
/**
 * AdminLineChart (T-052)
 * Renders a line chart for conversation trend data.
 * Tab toggles between 7-day and 30-day slices.
 * Props-driven — no API calls inside.
 */

export interface TrendDataPoint {
  date: string;
  value: number;
}

const props = defineProps<{
  data: TrendDataPoint[];
  height?: number;
}>();

defineOptions({
  tags: ['linecharts', 'multilines', 'withlegend'],
});

type RangeKey = '7d' | '30d';
const range = ref<RangeKey>('7d');

const rangeTabs: { label: string; key: RangeKey }[] = [
  { label: '近 7 天', key: '7d' },
  { label: '近 30 天', key: '30d' },
];

const sliced = computed(() => {
  const days = range.value === '7d' ? 7 : 30;
  return props.data.slice(-days);
});

// nuxt-charts LineChart expects an array of objects with numeric keys;
// we reshape to { date: string, count: number }[]
const chartData = computed(() => sliced.value.map(d => ({ date: d.date, count: d.value })));

const categories: Record<string, BulletLegendItemInterface> = {
  count: { name: '對話數', color: 'var(--ui-primary)' },
};

const xFormatter = (tick: number): string => {
  const item = chartData.value[tick];
  if (!item) return '';
  // Show MM/DD
  return item.date.slice(5); // "2026-04-01" → "04-01"
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-gray-700">對話量趨勢</p>
        <div class="flex gap-1">
          <button
            v-for="tab in rangeTabs"
            :key="tab.key"
            class="px-2 py-0.5 text-xs rounded transition-colors"
            :class="
              range === tab.key ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100'
            "
            @click="range = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </template>

    <ClientOnly>
      <LineChart
        v-if="chartData.length > 0"
        :data="chartData"
        :height="props.height ?? 220"
        :categories="categories"
        :x-formatter="xFormatter"
        :y-grid-line="true"
        :curve-type="CurveType.MonotoneX"
        :hide-legend="true"
      />
      <AppEmptyState v-else title="暫無趨勢資料" />
    </ClientOnly>
  </UCard>
</template>
