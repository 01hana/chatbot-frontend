<script setup lang="ts">
/**
 * LeadFormCard (T-037)
 *
 * Inline lead-form card rendered as a chat message (type = 'lead-form').
 * All form state, validation, and submission logic delegated to useLeadForm.
 *
 * UI states:
 *   - form visible     → idle | error
 *   - loading button   → submitting
 *   - success banner   → submitted (first time in this session)
 *   - already-done     → submitted (was already submitted when card mounted)
 *
 * data-testid attributes used by T-045 component tests:
 *   lead-form-card, lead-already-submitted, lead-success,
 *   lead-error-notice, btn-lead-submit,
 *   field-name, field-email, field-company, field-phone, field-message
 */

import { useLeadForm } from '~/features/chat/composables/useLeadForm'
import { useChatSessionStore } from '~/features/chat/stores/useChatSessionStore'

const { t } = useI18n()
const sessionStore = useChatSessionStore()

const {
  name, email, company, phone, message,
  status, errors,
  onFormSubmit,
} = useLeadForm()

/** True when the form has reached the 'submitted' state. */
const isSubmitting = computed(() => status.value === 'submitting')
const isSubmitted = computed(() => status.value === 'submitted')

/**
 * Flag set during onMounted: was the lead form ALREADY submitted before
 * this card appeared?  (Prevents showing "success" banner immediately
 * after submitting — that case shows the "already submitted" notice instead.)
 */
const wasAlreadySubmitted = ref(false)

onMounted(() => {
  if (sessionStore.leadFormState.submitted) {
    wasAlreadySubmitted.value = true
    status.value = 'submitted'
  }
})

// Expose a setter so component tests can drive status without going
// through the full vee-validate submit flow (which doesn't run in happy-dom).
defineExpose({
  setStatus: (s: typeof status.value) => { status.value = s },
})
</script>

<template>
  <div data-testid="lead-form-card" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm max-w-sm w-full">

    <!-- ── Already submitted (pre-existing session state) ─────────────── -->
    <template v-if="isSubmitted && wasAlreadySubmitted">
      <div data-testid="lead-already-submitted" class="flex items-center gap-2 text-sm text-gray-500">
        <UIcon name="i-heroicons-check-circle" class="text-green-500 shrink-0" />
        {{ t('lead.alreadySubmitted') }}
      </div>
    </template>

    <!-- ── Success banner (submitted in this card) ────────────────────── -->
    <template v-else-if="isSubmitted">
      <div data-testid="lead-success" class="flex items-start gap-2 text-sm text-green-700">
        <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-0.5 shrink-0" />
        <span>{{ t('lead.success') }}</span>
      </div>
    </template>

    <!-- ── Form ───────────────────────────────────────────────────────── -->
    <template v-else>
      <p class="text-sm font-semibold text-gray-700 mb-3">{{ t('lead.title') }}</p>

      <!-- Submission error notice -->
      <div
        v-if="status === 'error'"
        data-testid="lead-error-notice"
        class="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600"
      >
        {{ t('lead.submitError') }}
      </div>

      <UForm @submit="onFormSubmit">
        <!-- Name (required) -->
        <div data-testid="field-name" class="mb-3">
          <FormField
            name="name"
            :label="t('lead.name')"
            :placeholder="t('lead.namePlaceholder')"
            :is-required="true"
            v-model="name"
          />
        </div>

        <!-- Email (required) -->
        <div data-testid="field-email" class="mb-3">
          <FormField
            name="email"
            :label="t('lead.email')"
            :placeholder="t('lead.emailPlaceholder')"
            :is-required="true"
            v-model="email"
          />
        </div>

        <!-- Company (optional) -->
        <div data-testid="field-company" class="mb-3">
          <FormField
            name="company"
            :label="t('lead.company')"
            :placeholder="t('lead.companyPlaceholder')"
            v-model="company"
          />
        </div>

        <!-- Phone (optional) -->
        <div data-testid="field-phone" class="mb-3">
          <FormField
            name="phone"
            :label="t('lead.phone')"
            :placeholder="t('lead.phonePlaceholder')"
            v-model="phone"
          />
        </div>

        <!-- Message (optional) -->
        <div data-testid="field-message" class="mb-4">
          <FormField
            name="message"
            :label="t('lead.message')"
            :placeholder="t('lead.messagePlaceholder')"
            field-type="textarea"
            v-model="message"
          />
        </div>

        <UButton
          data-testid="btn-lead-submit"
          type="submit"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          block
          color="primary"
        >
          {{ isSubmitting ? t('lead.submitting') : t('lead.submit') }}
        </UButton>
      </UForm>
    </template>

  </div>
</template>
