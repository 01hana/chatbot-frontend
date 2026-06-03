<script setup lang="ts">
import type { FilterDef, FilterValues } from '~/components/FilterBar.vue';

interface Props {
  filters: FilterDef[];
  keywordKey?: string;
  dateRangeKey?: string;
  dateFromKey?: string;
  dateToKey?: string;
  searchKeys?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  keywordKey: 'keyword',
  dateRangeKey: 'dateRange',
  dateFromKey: 'dateFrom',
  dateToKey: 'dateTo',
});

const { params, advancedSearchSubmit } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const showFilters = ref(false);

if (!params || !advancedSearchSubmit) {
  throw new Error('DtFilterBar requires DtUtils provider');
}

const filterValues = computed<FilterValues>(() => {
  const searches = params.value.searches ?? {};

  return {
    [props.keywordKey]: searches[props.keywordKey] ?? '',
    [props.dateRangeKey]:
      searches[props.dateFromKey] || searches[props.dateToKey]
        ? [searches[props.dateFromKey] ?? '', searches[props.dateToKey] ?? '']
        : null,
  };
});

function toggleFilters() {
  showFilters.value = !showFilters.value;
}

function onFiltersUpdate(values: FilterValues) {
  const dateRange = values[props.dateRangeKey] as [string, string] | null;

  const payload: Record<string, any> = {
    [props.keywordKey]: values[props.keywordKey] ?? '',
    [props.dateFromKey]: dateRange?.[0] ?? '',
    [props.dateToKey]: dateRange?.[1] ?? '',
  };

  for (const key of props.searchKeys ?? []) {
    payload[key] = values[key];
  }

  advancedSearchSubmit(payload);
}

const FilterToggle = defineComponent({
  name: 'TableFilterToggle',
  setup() {
    return () =>
      h(resolveComponent('UButton'), {
        icon: showFilters.value ? 'i-lucide-search-x' : 'i-lucide-sliders-horizontal',
        variant: 'outline',
        class: ' shadow-xs transition-all duration-200  hover:shadow-md active:scale-95',
        onClick: toggleFilters,
      });
  },
});
</script>

<template>
  <div :class="showFilters ? 'w-full space-y-4' : 'w-full'">
    <slot name="header" :open="showFilters" :toggle="toggleFilters" :FilterToggle="FilterToggle" />

    <UCollapsible
      v-model:open="showFilters"
      :ui="{
        content:
          'overflow-hidden data-[state=open]:animate-[collapsible-down_260ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[collapsible-up_220ms_ease-in]',
      }"
    >
      <template #content>
        <FilterBar
          class="w-full rounded-xl my-4"
          :filters="filters"
          :model-value="filterValues"
          @update:filters="onFiltersUpdate"
        />
      </template>
    </UCollapsible>
  </div>
</template>
