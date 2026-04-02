import { defineRule, configure } from 'vee-validate';
import { all } from '@vee-validate/rules';
import { localize, setLocale } from '@vee-validate/i18n';

export default defineNuxtPlugin(async () => {
  Object.entries(all).forEach(([name, rule]) => {
    defineRule(name, rule);
  });

  //   defineRule('time', (value: string) => {
  //     const regExp = value.match(/^(\d{2}):(\d{2}):(\d{2})$/);

  //     if (!regExp) return false;

  //     const [, hhStr, mmStr, ssStr] = regExp;

  //     const hh = parseInt(hhStr, 10);
  //     const mm = parseInt(mmStr, 10);
  //     const ss = parseInt(ssStr, 10);

  //     if (hh > 23 || mm > 59 || ss > 59) return false;

  //     return true;
  //   });

  //   defineRule('end_time_after_start', (value: string, [startValue]: [string]) => {
  //     if (!value || !startValue || value === '00:00:00') return true;

  //     const toSeconds = (timeStr: string) => {
  //       const [h, m, s] = timeStr.split(':').map(Number);

  //       return h * 3600 + m * 60 + s;
  //     };

  //     return toSeconds(value) >= toSeconds(startValue);
  //   });

  async function loadValidationLocale(locale: string) {
    let messages;

    switch (locale) {
      case 'zh-TW':
        messages = (await import('@vee-validate/i18n/dist/locale/zh_TW.json')).default;
        break;
      case 'en':
      default:
        messages = (await import('@vee-validate/i18n/dist/locale/en.json')).default;
        break;
    }

    configure({
      generateMessage: localize({ [locale]: messages }),
      validateOnInput: true,
      validateOnBlur: false,
    });

    setLocale(locale);
  }

  const nuxtApp = useNuxtApp();

  await loadValidationLocale(nuxtApp.$i18n.locale.value);
});
