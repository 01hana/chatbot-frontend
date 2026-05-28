<script setup lang="ts">
export type FilterType = 'keyword' | 'select' | 'date-range';

export interface FilterDef {
  key: string;
  label: string;
  type: FilterType;
  /** Options for type === 'select' */
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export type FilterValues = Record<string, string | string[] | [string, string] | null>;

const props = defineProps<{
  filters: FilterDef[];
  modelValue?: FilterValues;
}>();

const emit = defineEmits<{
  'update:filters': [values: FilterValues];
}>();

// ── Internal state ──────────────────────────────────────────

const internal = reactive<FilterValues>({});

// Initialise internal state from modelValue
watch(
  () => props.modelValue,
  val => {
    if (!val) return;
    for (const key of Object.keys(val)) {
      internal[key] = val[key] ?? null;
    }
  },
  { immediate: true },
);

// ── Debounced keyword emit ──────────────────────────────────

let _kwTimer: ReturnType<typeof setTimeout> | null = null;

function onKeywordInput(key: string, value: string) {
  internal[key] = value;
  if (_kwTimer !== null) clearTimeout(_kwTimer);
  _kwTimer = setTimeout(() => {
    emit('update:filters', { ...internal });
    _kwTimer = null;
  }, 300);
}

function onSelectChange(key: string, value: string) {
  internal[key] = value;
  emit('update:filters', { ...internal });
}

function onDateChange(key: string, field: 0 | 1, value: string) {
  const existing = (internal[key] as [string, string] | null) ?? ['', ''];
  const updated: [string, string] = [...existing] as [string, string];
  updated[field] = value;
  internal[key] = updated;
  emit('update:filters', { ...internal });
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <template v-for="filter in filters" :key="filter.key">
      <!-- Keyword -->
      <FormField
        v-if="filter.type === 'keyword'"
        :name="filter.key"
        :label="filter.label"
        class="search-input w-full"
        :placeholder="filter.placeholder ?? '搜尋…'"
        :hideLabel="true"
        @update:model-value="(v: string) => onKeywordInput(filter.key, v)"
      />

      <!-- Select -->
      <div v-else-if="filter.type === 'select'" class="flex flex-col gap-1">
        <FormField
          :name="filter.key"
          :label="filter.label"
          fieldType="select"
          :items="filter.options"
        />
      </div>

      <!-- Date range -->
      <div v-else-if="filter.type === 'date-range'" class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">{{ filter.label }}</label>
        <div class="flex items-center gap-1">
          <UInput
            type="date"
            size="sm"
            :model-value="((internal[filter.key] as [string, string]) ?? ['', ''])[0]"
            @update:model-value="(v: string) => onDateChange(filter.key, 0, v)"
          />
          <span class="text-gray-400 text-xs">—</span>
          <UInput
            type="date"
            size="sm"
            :model-value="((internal[filter.key] as [string, string]) ?? ['', ''])[1]"
            @update:model-value="(v: string) => onDateChange(filter.key, 1, v)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
