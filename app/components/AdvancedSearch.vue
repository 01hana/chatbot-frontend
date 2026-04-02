<script setup lang="ts">
const { params } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const { show } = inject('useSearchModal') as ModalProps;

const { t } = useI18n();
</script>

<template>
  <UModal
    v-model:open="show"
    :title="t('actions.advanceSearch')"
    :description="t('actions.advanceSearch')"
  >
    <template #content>
      <UCommandPalette v-model="params.filters" v-bind="$attrs" placeholder="Search..." />
    </template>
  </UModal>
</template>
