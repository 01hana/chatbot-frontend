<script setup lang="ts">
import type { ModalProps } from '@/composables/useModal';

const useSearchModal = useModal();

const { setModal: setSearchModal } = useSearchModal;

const { setModal } = inject(useModalKey) as ModalProps;
const {
  select,
  isSelected,
  isSelectBatch,
  selectVisible,
  getSelectedItems,
  resetDt,
  searchSubmit,
  actionBatch,
  removeBatch,
} = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const { t } = useI18n();
const {
  isDeleteConfirm,
  isDeleteSpinner,
  setDeleteSpinner,
  setDeleteConfirm,
  onDeleteConfirmAfterLeave,
} = useDeleteConfirm();

const { handleSubmit, resetForm } = useForm({
  validationSchema: { keyword: 'required' },
});

const props = defineProps<{
  actions?: {
    create?: boolean;
    batch?: boolean;
    status?: boolean;
    remove?: boolean;
  };
  groups?: Record<string, any>[];
}>();

const actions = computed(() => ({
  create: props.actions?.create ?? true,
  batch: props.actions?.batch ?? true,
  status: props.actions?.status ?? false,
  remove: props.actions?.remove ?? true,
}));

const batchItems = computed(() => {
  const items = [];

  if (actions.value.remove) {
    items.push({
      label: t('actions.remove'),
      disabled: !isSelected.value,
      onSelect: () => setDeleteConfirm(true),
    });
  }

  if (actions.value.status) {
    items.push(
      {
        label: t('actions.enable'),
        disabled: !isSelected.value,
        onSelect: () => actionBatch(true),
      },
      {
        label: t('actions.disable'),
        disabled: !isSelected.value,
        onSelect: () => actionBatch(false),
      },
    );
  }

  return items;
});

const onSubmit = handleSubmit(data => searchSubmit(data));

async function onRemove() {
  setDeleteSpinner(true);

  await removeBatch();

  setDeleteConfirm(false);
}

function onReset() {
  resetForm();
  resetDt();
}

provide('useSearchModal', useSearchModal);
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
    <div class="flex items-center gap-2.5 flex-wrap">
      <UButton
        v-if="actions.create"
        icon="fluent:add-circle-24-filled"
        :label="t('actions.create')"
        variant="solid"
        class="rounded-xl font-semibold shadow-md bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 transition-colors"
        @click="setModal(true)"
      />

      <slot v-if="$slots.create" name="create" />

      <div v-if="actions.batch" class="batch-group flex items-center gap-0.5 rounded-xl">
        <!-- 批次選擇切換 -->
        <UButton
          color="neutral"
          variant="ghost"
          :icon="
            !isSelectBatch
              ? 'fluent:text-bullet-list-checkmark-20-filled'
              : 'fluent:dismiss-circle-24-regular'
          "
          :label="isSelectBatch ? $t('actions.batch') : $t('actions.batch', 0)"
          class="rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50/80 transition-colors"
          @click="selectVisible"
        />

        <div class="w-px h-5 bg-slate-200/80 mx-0.5" />

        <!-- 批次操作下拉 -->
        <UDropdownMenu :items="batchItems">
          <UButton
            color="neutral"
            variant="ghost"
            trailing-icon="fluent:chevron-down-24-regular"
            class="rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50/80 transition-colors"
          >
            <span v-if="isSelected" class="flex items-center gap-1.5">
              <span class="text-sky-600 font-medium">{{ $t('actions.batchApply') }}</span>
              <UBadge
                :label="select.count"
                color="primary"
                variant="solid"
                class="rounded-full px-1.5 py-0 text-xs font-semibold shadow-sm"
                size="sm"
              />
            </span>
            <span v-else>{{ $t('actions.batchApply') }}</span>
          </UButton>
        </UDropdownMenu>
      </div>
    </div>

    <div class="flex items-center justify-between border-b border-gray-200 gap-2 p-2">
      <FormField
        name="keyword"
        :label="t('actions.search')"
        :placeholder="t('form.keyword')"
        :hideLabel="true"
        :ui="{ base: 'ring-0!' }"
        class="search-field"
      >
        <template #leading>
          <UIcon name="fluent:search-24-regular" class="text-gray-400" size="16" />
        </template>
      </FormField>

      <div class="flex items-center gap-2">
        <UButton
          type="submit"
          variant="soft"
          icon="fluent:search-24-regular"
          class="rounded-xl font-medium shadow-sm"
          @click="onSubmit"
        />

        <div class="w-px h-5 bg-gray-300/60 shrink-0" />

        <UTooltip v-if="groups" :text="t('actions.advanceSearch')">
          <UButton
            variant="outline"
            color="neutral"
            icon="fluent:filter-24-regular"
            class="rounded-xl border-gray-300 text-gray-500 hover:border-sky-400 hover:text-sky-600 hover:bg-white transition-colors"
            @click="setSearchModal(true)"
          />
          <AdvancedSearch injection-key="useSearchModal" :groups :multiple="true" />
        </UTooltip>

        <UTooltip :text="t('actions.clear')">
          <UButton
            variant="outline"
            color="neutral"
            icon="fluent:arrow-counterclockwise-24-regular"
            class="rounded-xl border-gray-300 text-gray-500 hover:border-sky-400 hover:text-sky-600 hover:bg-white transition-colors"
            @click="onReset"
          />
        </UTooltip>
      </div>
    </div>
  </div>

  <!-- ── 刪除確認 Modal ──────────────────────────────── -->
  <AlertModal
    v-model:open="isDeleteConfirm"
    :title="t('confirm.removeTitle')"
    type="error"
    icon="fluent:delete-24-filled"
    :loading="isDeleteSpinner"
    @callAction="onRemove"
    @after:leave="onDeleteConfirmAfterLeave"
  >
    <template #content>
      <i18n-t keypath="confirm.removeBatch" tag="div" scope="global" class="text-center text-base">
        <template #count>
          <UBadge :label="select.count" color="error" variant="subtle" class="rounded-full px-2" />
        </template>
      </i18n-t>
    </template>
  </AlertModal>
</template>

<style scoped>
.batch-group {
  background: linear-gradient(135deg, #f8faff 0%, #eef4ff 100%);
  border: 1px solid rgba(148, 192, 255, 0.4);
  box-shadow: inset 0 1px 2px rgba(99, 160, 255, 0.06);
}

:deep([data-slot='wrapper']) {
  display: none;
}

:deep(.search-field div) {
  margin-top: 0 !important;
}
</style>
