/**
 * tests/unit/features/chat/useLeadForm.test.ts (T-044)
 *
 * Unit tests for useLeadForm composable (T-036).
 *
 * Strategy:
 *   - vi.mock() the chat API service to avoid real network calls
 *   - Call useLeadForm inside a minimal Vue setup context (defineComponent + mount)
 *     so vee-validate's useForm/useField have access to the Vue provide/inject tree
 *   - Use createPinia / setActivePinia for the session store
 *   - Mock vue-i18n with a fixed locale
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { configure } from 'vee-validate'
import { all } from '@vee-validate/rules'
import { defineRule } from 'vee-validate'

// ── Register vee-validate rules (normally done by the Nuxt plugin) ───────────
Object.entries(all).forEach(([name, rule]) => {
  defineRule(name, rule)
})
configure({ validateOnInput: true })

// ── Mock vue-i18n ────────────────────────────────────────────────────────────
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'zh-TW' },
  }),
}))

// ── Mock API ─────────────────────────────────────────────────────────────────
const mockApiSubmitLead = vi.fn()

vi.mock('~/services/api/chat', () => ({
  submitLead: (...args: unknown[]) => mockApiSubmitLead(...args),
  createSession: vi.fn(),
  getSessionHistory: vi.fn(),
  requestHandoff: vi.fn(),
  submitFeedback: vi.fn(),
  getStreamUrl: vi.fn(() => ''),
  cancelStream: vi.fn(() => Promise.resolve()),
}))

// ── Store imports ─────────────────────────────────────────────────────────────
import { useChatSessionStore } from '../../../../app/features/chat/stores/useChatSessionStore'
import { useLeadForm } from '../../../../app/features/chat/composables/useLeadForm'

// ── Helper: mount composable in a Vue context ─────────────────────────────────

function setupComposable() {
  let result!: ReturnType<typeof useLeadForm>

  const Wrapper = defineComponent({
    setup() {
      result = useLeadForm()
      return () => h('div')
    },
  })

  const wrapper = mount(Wrapper, {
    global: {
      plugins: [createPinia()],
    },
  })

  const sessionStore = useChatSessionStore()
  // Default: valid session token available
  sessionStore.setSessionToken('test-session-abc')

  return { result, wrapper, sessionStore }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useLeadForm', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    mockApiSubmitLead.mockReset()
    mockApiSubmitLead.mockResolvedValue({ data: { leadId: 'lead-001' }, success: true })
  })

  // ── Validation: required fields ──────────────────────────────────────────

  it('name 為空時驗證失敗', async () => {
    const { result } = setupComposable()

    result.name.value = ''
    result.email.value = 'valid@example.com'

    const validation = await result.validate()
    expect(validation.valid).toBe(false)
    expect(result.errors.value.name).toBeTruthy()
  })

  it('email 為空時驗證失敗', async () => {
    const { result } = setupComposable()

    result.name.value = '王小明'
    result.email.value = ''

    const validation = await result.validate()
    expect(validation.valid).toBe(false)
    expect(result.errors.value.email).toBeTruthy()
  })

  it('email 格式不正確時驗證失敗（notanemail）', async () => {
    const { result } = setupComposable()

    result.name.value = '王小明'
    result.email.value = 'notanemail'

    const validation = await result.validate()
    expect(validation.valid).toBe(false)
    expect(result.errors.value.email).toBeTruthy()
  })

  // ── Validation: optional fields ───────────────────────────────────────────

  it('company 為空時不報驗證錯誤（選填）', async () => {
    const { result } = setupComposable()

    result.name.value = '王小明'
    result.email.value = 'valid@example.com'
    result.company.value = ''

    const validation = await result.validate()
    expect(validation.valid).toBe(true)
    expect(result.errors.value.company).toBeFalsy()
  })

  it('phone 為空時不報驗證錯誤（選填）', async () => {
    const { result } = setupComposable()

    result.name.value = '王小明'
    result.email.value = 'valid@example.com'
    result.phone.value = ''

    const validation = await result.validate()
    expect(validation.valid).toBe(true)
    expect(result.errors.value.phone).toBeFalsy()
  })

  it('message 為空時不報驗證錯誤（選填）', async () => {
    const { result } = setupComposable()

    result.name.value = '王小明'
    result.email.value = 'valid@example.com'
    result.message.value = ''

    const validation = await result.validate()
    expect(validation.valid).toBe(true)
    expect(result.errors.value.message).toBeFalsy()
  })

  // ── Language auto-populated ───────────────────────────────────────────────

  it('提交 payload 包含 language（取自 i18n locale = zh-TW）', async () => {
    const { result, sessionStore } = setupComposable()

    result.name.value = '王小明'
    result.email.value = 'valid@example.com'

    await result.submitLead()

    expect(mockApiSubmitLead).toHaveBeenCalledWith(
      sessionStore.sessionToken,
      expect.objectContaining({ language: 'zh-TW' }),
    )
  })

  // ── Submit success ────────────────────────────────────────────────────────

  it('提交成功後 status = submitted，leadFormState.submitted = true', async () => {
    const { result, sessionStore } = setupComposable()

    result.name.value = '王小明'
    result.email.value = 'valid@example.com'

    await result.submitLead()

    expect(result.status.value).toBe('submitted')
    expect(sessionStore.leadFormState.submitted).toBe(true)
  })

  // ── Block duplicate submission ─────────────────────────────────────────────

  it('已提交時再次提交被阻止（不重複呼叫 API）', async () => {
    const { result, sessionStore } = setupComposable()

    // Mark as already submitted
    sessionStore.setLeadFormSubmitted(new Date().toISOString())

    result.name.value = '王小明'
    result.email.value = 'valid@example.com'

    await result.submitLead()

    expect(mockApiSubmitLead).not.toHaveBeenCalled()
    expect(result.status.value).toBe('submitted')
  })
})
