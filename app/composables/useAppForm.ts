import { Form, type FormActions } from 'vee-validate';

export function useAppForm(
  updateParams: string | string[],
  setFieldValue: FormActions<Record<string, any>>['setFieldValue'],
) {
  const toast = useAppToast();
  const { t } = useI18n();

  function set(fields: string | string[], data: Record<string, any>) {
    if (!setFieldValue) {
      toast.error(t('error.unexpectOccured'));

      return;
    }

    if (Array.isArray(fields)) {
      fields.forEach(field => {
        const isDataArray = Array.isArray(data[field]);
        if (data[field] === null || data[field] === '' || (isDataArray && data[field].length === 0))
          return;

        setFieldValue(field, data[field]);
      });

      return;
    }

    setFieldValue(fields, data[fields]);
  }

  function formUpdate(data: Record<string, any>) {
    try {
      set(updateParams, data);
    } catch {
      toast.error(t('error.unexpectOccured'));
    }
  }

  function setupFieldOptional(validationSchema: Record<string, string>) {
    provide(Form.validationSchema, validationSchema);
  }

  return { formUpdate, setupFieldOptional };
}
