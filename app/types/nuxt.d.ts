import type { I18n } from 'vue-i18n';

declare module '#app' {
  interface NuxtApp {
    $i18n: I18n;
  }
}
