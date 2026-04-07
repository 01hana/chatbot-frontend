import { defineRule, configure } from 'vee-validate';
import { all } from '@vee-validate/rules';
import { localize, setLocale } from '@vee-validate/i18n';

// ── Custom rules ─────────────────────────────────────────────

/**
 * phoneOrEmail — validates that at least one of this field (phone) or a
 * sibling email field has a valid value.
 *
 * Usage on the phone <FormField>:
 *   rules="phoneOrEmail:@email"
 *
 * The rule receives the sibling email field value via cross-field syntax.
 * It passes when:
 *  - this field looks like a phone number, OR
 *  - this field looks like an email address, OR
 *  - the sibling email field already has a non-empty value.
 */
const PHONE_RE = /^[0-9+\-()\s]{7,20}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

defineRule('phoneOrEmail', (value: string, [siblingValue]: [string]) => {
  const thisOk = PHONE_RE.test(value ?? '') || EMAIL_RE.test(value ?? '')
  const siblingOk = Boolean(siblingValue?.trim())
  if (thisOk || siblingOk) return true
  return '請輸入電話或 Email（至少填寫一項）'
})

export default defineNuxtPlugin(async () => {
  // Register all standard @vee-validate/rules
  Object.entries(all).forEach(([name, rule]) => {
    defineRule(name, rule);
  });

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
