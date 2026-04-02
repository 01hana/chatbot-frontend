<script setup lang="ts">
import { __ENTITY__Fields as updateFields } from '../../../constants/form/update-fields';

const { updateDtRowData, params } = inject(DtUtils.key) as InstanceType<typeof DtUtils>;
const { id, show, isAdd, isEdit, setModal } = inject(useModalKey) as ModalProps;

const { get, create, set, getTable } = __HOOK__();
const { handleSubmit, resetForm, setFieldValue } = useForm({
  validationSchema: {},
});
const { formUpdate } = useAppForm(updateFields, setFieldValue);

watch([show, id], async ([isShow, id]) => {
  if (isShow && !id) {
  }

  if (!isShow || !id) return;

  const data = await get(id);
  formUpdate(data);
});

function onAfterLeave() {
  resetForm();
}

const onSubmit = handleSubmit(async values => {
  if (isAdd.value) {
    await create(values).then(() => getTable(params.value));

    setModal(false);
  }

  if (isEdit.value) {
    const res = await set(id.value as string, values);

    updateDtRowData(res);
    setModal(false);
  }
}) as (e?: Event) => Promise<void>;
</script>

<template>
  <Modal @after:leave="onAfterLeave" form-id="create-edit-form">
    <template #content>
      <UForm id="create-edit-form" :state="{}" @submit="onSubmit">
        <div class="grid grid-cols-3 gap-4">
          <!-- 預設一個欄位，之後依需求自行補充 -->
          <FormField name="name" label="名稱" />
        </div>
      </UForm>
    </template>
  </Modal>
</template>
