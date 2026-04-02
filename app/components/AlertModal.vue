<script setup lang="ts">
type Alertype = 'success' | 'info' | 'warning' | 'error';

enum alertColor {
  success = 'teal-400',
  info = 'info',
  warning = 'warning',
  error = 'red-400',
}

const { t } = useI18n();

const emits = defineEmits(['callAction']);

const props = withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    type?: Alertype;
    size?: string;
  }>(),
  {
    title: '',
    icon: '',
    type: 'success',
    size: 'w-md',
  },
);

const { title, icon, type, size } = toRefs(props);

const color = computed(() => alertColor[type.value]);
</script>

<template>
  <UModal
    :title
    class="max-w-screen"
    :class="size"
    v-bind="$attrs"
    :ui="{ header: 'border-none hidden' }"
  >
    <template #body>
      <div class="flex flex-col items-center gap-3">
        <UIcon :name="icon" class="w-16 h-16" :class="[`bg-${color}`]" />
        <h3 :class="[`text-${color}`]" class="text-xl font-bold">{{ title }}</h3>

        <slot name="content" />
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        :label="t('actions.enter', 0)"
        variant="solid"
        type="submit"
        :class="[`bg-${color}`]"
        :color="type"
        @click="emits('callAction')"
      />
      <UButton :label="t('actions.close', 2)" color="neutral" variant="outline" @click="close" />
    </template>
  </UModal>
</template>
