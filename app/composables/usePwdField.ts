export function usePwdField(password?: string) {
  const { t } = useI18n();

  const pwdValidationItems = reactive([
    {
      name: t('form.pwdString'),
      isChecked: computed(() => !!password?.value && /^(?=.*[A-Za-z])/.test(password.value)),
    },
    {
      name: t('form.pwdNumber'),
      isChecked: computed(() => !!password?.value && /^(?=.*\d)/.test(password.value)),
    },
    {
      name: t('form.pwdSymbol'),
      isChecked: computed(
        () =>
          !!password?.value && /^(?=.*[\\!@#$%^&*()+_\-=}{[\]|:;"/?.><,`~'])/.test(password.value),
      ),
    },
    {
      name: t('form.pwdLength'),
      isChecked: computed(() => !!password?.value && /.{8,}/.test(password.value)),
    },
  ]);

  const pwdRegExpItems = computed(() => pwdValidationItems);

  return {
    pwdRegExpItems,
  };
}
