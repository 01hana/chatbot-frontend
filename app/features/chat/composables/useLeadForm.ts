/**
 * useLeadForm (T-036)
 *
 * Manages lead form state, validation, and submission.
 *
 * Validation rules (vee-validate):
 *   - name:    required
 *   - email:   required | email format
 *   - company: optional
 *   - phone:   optional
 *   - message: optional
 *   - language: auto-populated from i18n locale, not user-input
 *
 * Prevents duplicate submission within the same session via
 * useChatSessionStore.leadFormState.submitted.
 */

import { useForm, useField } from 'vee-validate';
import * as chatApi from '~/services/api/chat';
import { useChatSessionStore } from '~/features/chat/stores/useChatSessionStore';
import type { LeadFormData } from '~/types/chat';

export function useLeadForm() {
  const { locale } = useI18n();
  const sessionStore = useChatSessionStore();

  const status = ref<'idle' | 'submitting' | 'submitted' | 'error'>('idle');

  const { handleSubmit, errors, validate, resetForm, setErrors } = useForm({
    validationSchema: {
      name: 'required',
      email: 'required|email',
      company: '',
      phone: '',
      message: '',
    },
  });

  const { value: name } = useField<string>('name');
  const { value: email } = useField<string>('email');
  const { value: company } = useField<string>('company');
  const { value: phone } = useField<string>('phone');
  const { value: message } = useField<string>('message');

  const formData = computed<LeadFormData>(() => ({
    name: name.value ?? '',
    email: email.value ?? '',
    company: company.value || undefined,
    phone: phone.value || undefined,
    message: message.value || undefined,
    language: locale.value,
  }));

  /**
   * Submit the lead form.
   * - Blocks duplicate submissions within the same session.
   * - Validates before calling the API.
   */
  async function submitLead(): Promise<void> {
    // Guard: already submitted in this session
    if (sessionStore.leadFormState.submitted) {
      status.value = 'submitted';

      return;
    }

    const result = await validate();

    if (!result.valid) return;

    status.value = 'submitting';

    try {
      const token = sessionStore.sessionToken;
      if (!token) throw new Error('No active session token');

      await chatApi.submitLead(token, formData.value);

      sessionStore.setLeadFormSubmitted(new Date().toISOString());
      status.value = 'submitted';
    } catch {
      status.value = 'error';
    }
  }

  /** vee-validate handleSubmit wrapper — use this as the UForm @submit handler. */
  async function onFormSubmit(): Promise<void> {
    await submitLead();
  }

  return {
    // field refs
    name,
    email,
    company,
    phone,
    message,
    // derived
    formData,
    // state
    status,
    errors,
    // methods
    validate,
    submitLead,
    onFormSubmit,
    resetForm,
    setErrors,
  };
}
