<script setup lang="ts">
import type { VxeTableInstance } from 'vxe-table';

defineOptions({ inheritAttrs: false });

const { sort, pageConfig } = defineProps<{
  sort: [string, 'asc' | 'desc'];
  pageConfig?: {};
}>();

const { setModal } = inject(useModalKey) as ModalProps;

const {
  loading,
  data,
  pager,
  pageChange,
  setTableRef,
  setSort,
  setColumnFixed,
  sortChange,
  filterChange,
  selectChange,
  selectRangeChange,
  remove,
} = inject(DtUtils.key) as InstanceType<typeof DtUtils>;

const { width, height } = useWindowSize();
const { t } = useI18n();
const {
  deleteConfirmData,
  isDeleteConfirm,
  setDeleteSpinner,
  setDeleteConfirm,
  onDeleteConfirmAfterLeave,
} = useDeleteConfirm();

const VxeTableRef = useTemplateRef<VxeTableInstance>('VxeTable');
const sortConfig = ref({});

const isRecordOverflowLength = computed(() =>
  pager.total && pager.length ? pager.total > pager.length : false,
);
const maxHeight = computed(() => {
  const minusHeight = isRecordOverflowLength.value ? 230 : 255;

  return width.value > 768 ? height.value - minusHeight : undefined;
});

onMounted(() => {
  setTableRef(VxeTableRef.value);

  if (sort) {
    const [field, order] = sort;

    setSort(field, order);
    sortConfig.value = { defaultSort: { field, order } };
  }

  //   watchEffect(() => {
  //     setColumnFixed('actions', lgAndUp.value ? 'left' : null)
  //   })
});

async function onRemove() {
  setDeleteSpinner(true);

  await remove(deleteConfirmData.value.id);

  setDeleteConfirm(false);
}
</script>

<template>
  <div>
    <vxe-table
      ref="VxeTable"
      :loading
      :data
      :maxHeight
      auto-resize
      :sortConfig
      :empty-text="t('notFound')"
      :checkbox-config="{ range: true }"
      @sort-change="sortChange"
      @filter-change="filterChange"
      @checkbox-all="selectChange"
      @checkbox-change="selectChange"
      @checkbox-range-change="selectRangeChange"
      v-bind="$attrs"
    >
      <vxe-column
        width="45"
        field="select"
        type="checkbox"
        fixed="left"
        align="center"
        :visible="false"
      />

      <vxe-column
        min-width="80"
        width="100"
        field="actions"
        :title="t('actions.actions')"
        align="right"
        fixed="left"
      >
        <template #default="{ row }">
          <slot name="actions" :row :setDeleteConfirm>
            <div class="d-flex justify-end flex-wrap gap-1">
              <UButton
                icon="fluent:edit-line-horizontal-3-24-regular"
                variant="ghost"
                @click="setModal(row.id)"
              />

              <UButton
                icon="fluent:delete-24-regular"
                variant="ghost"
                color="error"
                class="text-red-400"
                @click="setDeleteConfirm(row.id, row.name)"
              />
            </div>
          </slot>
        </template>
      </vxe-column>

      <slot />
    </vxe-table>

    <vxe-pager
      v-model:current-page="pager.p"
      v-model:page-size="pager.length"
      :total="pager.total"
      @page-change="pageChange"
      v-bind="pageConfig"
    />

    <AlertModal
      v-model:open="isDeleteConfirm"
      :title="t('confirm.removeTitle')"
      type="error"
      icon="fluent:delete-24-filled"
      @callAction="onRemove"
      @after:leave="onDeleteConfirmAfterLeave"
    >
      <template #content>
        <i18n-t keypath="confirm.remove" tag="div" scope="global" class="text-center text-base">
          <template #name>
            <UBadge :label="deleteConfirmData.name" class="rounded-full bg-red-400 px-2" />
          </template>
        </i18n-t>
      </template>
    </AlertModal>
  </div>
</template>

<style scoped>
.vxe-table--render-default {
  font-size: 1rem;
}

:deep(.vxe-header--column.is--sortable) {
  cursor: pointer;
}

:deep(.vxe-cell--filter) {
  margin-left: 1%;
}

:deep(.vxe-table--filter-wrapper .vxe-table--filter-body) {
  max-height: 200px !important;
}

:deep(.vxe-cell--sort) {
  height: 15px;
  margin-left: 1%;
  margin-top: -5px;
}

:deep(.vxe-cell--sort-vertical-layout .vxe-sort--asc-btn),
:deep(.vxe-cell--sort-vertical-layout .vxe-sort--desc-btn) {
  height: 2px;
  font-size: 1rem;
}

:deep(.vxe-body--expanded-cell) {
  background-color: #eaf3fbc9;
}

:deep(.vxe-table--expanded) {
  display: inline-block;
  text-align: center;
  line-height: 1;
  border-radius: 50%;
}

:deep(.vxe-table--expanded .vxe-table--expand-btn) {
  margin: 0 auto;
  width: auto;
  height: auto;
  font-size: 1.6rem;
  color: #039be5;
  border: 4px solid #d7ecf6;
  border-radius: 50%;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

:deep(.vxe-table--render-default .vxe-table--expanded .vxe-table--expand-btn:hover) {
  color: #0189cd;
}

.vxe-pager {
  --vxe-ui-font-size-default: 0.9rem;
  --vxe-ui-layout-background-color: transparent;
  height: auto;
  padding: 1rem;
}

.vxe-pager :deep(.vxe-pager--jump .vxe-pager--goto) {
  width: 3em;
}

.vxe-pager :deep(.vxe-pager--num-btn) {
  margin: 0 0.2rem;
}

.vxe-pager .vxe-pager--jump-next:not(.is--disabled).is--active,
.vxe-pager .vxe-pager--jump-next:not(.is--disabled):focus,
.vxe-pager .vxe-pager--jump-prev:not(.is--disabled).is--active,
.vxe-pager .vxe-pager--jump-prev:not(.is--disabled):focus,
.vxe-pager .vxe-pager--next-btn:not(.is--disabled).is--active,
.vxe-pager .vxe-pager--next-btn:not(.is--disabled):focus,
.vxe-pager .vxe-pager--num-btn:not(.is--disabled).is--active,
.vxe-pager .vxe-pager--num-btn:not(.is--disabled):focus,
.vxe-pager .vxe-pager--prev-btn:not(.is--disabled).is--active,
.vxe-pager .vxe-pager--prev-btn:not(.is--disabled):focus {
  color: var(--ui-primary);
}

:deep(.vxe-pager--jump-next),
:deep(.vxe-pager--jump-prev),
:deep(.vxe-pager--next-btn),
:deep(.vxe-pager--num-btn),
:deep(.vxe-pager--prev-btn) {
  margin: 0 0.15rem;
}

:deep(.vxe-image-group) {
  display: flex;
}

:deep(.vxe-switch.is--on .vxe-switch--button) {
  --vxe-ui-switch-open-background-color: #00d5be;
}

:deep(.vxe-switch.is--off .vxe-switch--button) {
  --vxe-ui-switch-close-background-color: #f56c6b;
}

:deep(.vxe-table--render-default .vxe-table--body-wrapper) {
  --vxe-ui-layout-background-color: transparent;
}

:global(.vxe-table--render-default .vxe-body--row.row--checked > .vxe-body--column),
:global(.vxe-table--render-default .vxe-body--row.row--hover.row--checked > .vxe-body--column) {
  background-color: color-mix(in srgb, var(--ui-primary) 5%, transparent);
}
</style>
