<script lang="ts" setup>
defineOptions({
  tags: ['linecharts', 'multilines', 'donutcharts', 'withlegend'],
});

withDefaults(
  defineProps<{
    showTitle?: boolean;
  }>(),
  {
    showTitle: false,
  },
);

const chartData = [
  { month: 'January', desktop: 186, mobile: 186 },
  { month: 'February', desktop: 305, mobile: 305 },
  { month: 'March', desktop: 237, mobile: 237 },
  { month: 'April', desktop: 260, mobile: 209 },
  { month: 'May', desktop: 209, mobile: 209 },
  { month: 'June', desktop: 250, mobile: 214 },
];

const categories: Record<string, BulletLegendItemInterface> = {
  desktop: { name: 'Desktop', color: '#3b82f6' },
  mobile: { name: 'Mobile', color: '#22c55e' },
};

const xFormatter = (tick: number, _i?: number, _ticks?: number[]): string => {
  return chartData[tick]?.month ?? '';
};

const donutData = ref([35, 25, 20, 15, 5]);

const marketShareLabels = {
  'Product A': {
    name: 'Product A',
    color: 'var(--ui-primary)',
  },
  'Product B': {
    name: 'Product B',
    color: 'var(--ui-info)',
  },
  'Product C': {
    name: 'Product C',
    color: 'var(--ui-success)',
  },
  'Product D': {
    name: 'Product D',
    color: 'var(--ui-warning)',
  },
  Other: {
    name: 'Other',
    color: 'var(--ui-error)',
  },
};
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6 rounded-lg" :class="showTitle ? 'p-6' : ''">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Line Chart</h3>
    </div>
    <LineChart
      :data="chartData"
      :height="300"
      y-label="Number of visits"
      :x-num-ticks="2"
      :categories="categories"
      :x-formatter="xFormatter"
      :y-grid-line="true"
      :curve-type="CurveType.MonotoneX"
      :legend-position="LegendPosition.TopRight"
      :hide-legend="false"
    />

    <DonutChart
      :data="donutData"
      :categories="marketShareLabels"
      :height="200"
      :radius="80"
      :pad-angle="0.1"
      :arc-width="20"
    >
      <div class="text-center">
        <div class="font-semibold">Label</div>
        <div class="text-muted">2 seconds ago</div>
      </div>
    </DonutChart>
  </div>
</template>
