export function usePageI18n() {
  const route = useRoute();

  const { t, setLocaleMessage, locale } = useI18n({ useScope: 'local' });

  const routeName = route.name?.toString() ?? '';

  watch(
    locale,
    async newLocale => {
      if (!newLocale) return;

      try {
        const messages = await import(
          `../../i18n/locales/${newLocale}/pages/${routeName}.json`
        ).then(m => m.default);

        setLocaleMessage(newLocale, messages);
      } catch (e) {
        console.warn(`No page locale for: ${newLocale}/pages/${routeName}.json`);
      }
    },
    {
      immediate: true,
    },
  );

  return { t };
}
