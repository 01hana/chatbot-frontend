<script setup lang="ts">
const { t, locale } = useI18n();
const route = useRoute();

useHead({
  htmlAttrs: {
    lang: locale.value,
  },

  titleTemplate: (title?: string) => (title ? title + ' - ' : '') + t('sitename'),
});
</script>

<template>
  <UApp :toaster="{ position: 'bottom-center' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
