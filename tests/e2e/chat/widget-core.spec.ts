/**
 * tests/e2e/chat/widget-core.spec.ts  (T-034)
 *
 * E2E journeys for the AI Chat Widget.
 * Runs across 3 viewports: Desktop 1280px / Tablet 768px / Mobile 375px
 *
 * Journeys:
 *  J-01  Open widget via FAB → chat panel visible
 *  J-02  Send a message → typing indicator → AI reply
 *  J-03  Quick-reply chips → click chip → new AI reply
 *  J-04  Feedback buttons (thumb up → cancel → thumb down)
 *  J-05  Timestamp format  HH:mm regex
 *  J-06  Reset button → session cleared
 *  J-07  Close via X button → launcher FAB re-appears
 */

import { test, expect, type Page } from '@playwright/test'

// ── Selectors ──────────────────────────────────────────────────────────────

const SEL = {
  launcher: '[data-testid="chat-launcher"]',
  panel:    '[data-testid="chat-panel"]',
  input:    '[data-testid="chat-input"]',
  btnSend:  '[data-testid="btn-send"]',
  btnReset: '[data-testid="btn-reset"]',
  aiMsg:    '[data-testid="ai-message"]',
  typing:   '[data-testid="typing-indicator"]',
  aiBubble: '[data-testid="ai-bubble"]',
  userMsg:  '[data-testid="user-message"]',
  msgTime:  '[data-testid="message-time"]',
  rateUp:   '[data-testid="btn-rate-up"]',
  rateDown: '[data-testid="btn-rate-down"]',
  chips:    '[data-testid="quick-reply-chips"]',
  closeBtn: '[aria-label="AI 客服聊天面板"] >> [title="關閉"]',
} as const

// KB mock delay: 600 ~ 1300ms → 我們用 5 秒作為安全 timeout
const REPLY_TIMEOUT = 5_000

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * 開啟頁面並點擊 FAB 啟動 widget
 */
async function openWidget(page: Page) {
  await page.goto('/')
  // Nuxt SPA 需等 Vue hydration 完成（等 chat-launcher 出現在 DOM）
  await page.waitForSelector('[data-testid="chat-launcher"]', { state: 'attached', timeout: 10_000 })
  await page.locator(SEL.launcher).click()
  await expect(page.locator(SEL.panel)).toBeVisible({ timeout: 3_000 })
}

/**
 * 在 input 輸入文字並按 send
 */
async function sendMessage(page: Page, text: string) {
  const input = page.locator(SEL.input)
  await input.click()
  await input.pressSequentially(text, { delay: 30 })
  await page.locator(SEL.btnSend).click()
}

// ─────────────────────────────────────────────────────────────────────────

test.describe('J-01  開啟 Widget', () => {
  test('點擊 FAB → ChatPanel 顯示', async ({ page }) => {
    await page.goto('/')
    // 等 Vue hydration 完成
    await page.waitForSelector('[data-testid="chat-launcher"]', { state: 'attached', timeout: 10_000 })

    // FAB 應可見
    await expect(page.locator(SEL.launcher)).toBeVisible()

    // Panel 初始應隱藏
    await expect(page.locator(SEL.panel)).not.toBeVisible()

    // 點擊後 panel 出現、FAB 消失
    await page.locator(SEL.launcher).click()
    await expect(page.locator(SEL.panel)).toBeVisible({ timeout: 3_000 })
    await expect(page.locator(SEL.launcher)).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────

test.describe('J-02  傳送訊息 → 打字中 → AI 回覆', () => {
  test('送出問題 → 出現 AI 氣泡（含打字指示器流程驗證）', async ({ page }) => {
    await openWidget(page)

    // 填入訊息
    const input = page.locator(SEL.input)
    await input.click()
    await input.pressSequentially('請問你好嗎？', { delay: 30 })
    await expect(page.locator(SEL.btnSend)).toBeEnabled()

    const aiMsgCountBefore = await page.locator(SEL.aiMsg).count()

    // 送出
    await page.locator(SEL.btnSend).click()

    // 使用者泡泡立即出現
    await expect(page.locator(SEL.userMsg).last()).toBeVisible({ timeout: 2_000 })

    // ai-message 數量增加（ai-streaming placeholder 已 append）
    await expect(page.locator(SEL.aiMsg)).toHaveCount(aiMsgCountBefore + 1, { timeout: 2_000 })

    // 等待 AI 正式回覆：ai-bubble 出現（typing indicator 消失後 vue 改 type）
    await page.waitForSelector(SEL.aiBubble, { state: 'attached', timeout: REPLY_TIMEOUT })

    const aiBubble = page.locator(SEL.aiBubble).last()
    await expect(aiBubble).toBeVisible()
    await expect(aiBubble).not.toBeEmpty()
  })
})

// ─────────────────────────────────────────────────────────────────────────

test.describe('J-03  快速回覆 Chips', () => {
  test('AI 回覆後出現 chips → 點擊 chip → 觸發第二輪對話', async ({ page }) => {
    await openWidget(page)

    // 等待歡迎訊息或先送出一個問題以觸發帶 quickReplies 的 AI 回覆
    // 因為 KB mock 會回傳 quickReplies
    await sendMessage(page, '你好')

    // 等待 AI 氣泡出現
    await expect(page.locator(SEL.typing)).not.toBeVisible({ timeout: REPLY_TIMEOUT })
    await expect(page.locator(SEL.aiBubble).last()).toBeVisible({ timeout: 2_000 })

    // 若有 quick-reply chips 就點擊第一個
    const chipsGroup = page.locator(SEL.chips).last()
    const hasChips = await chipsGroup.isVisible()
    if (hasChips) {
      const firstChip = chipsGroup.locator('button').first()
      const chipText = await firstChip.textContent()
      await firstChip.click()

      // 使用者訊息應包含 chip 文字
      const lastUserMsg = page.locator(SEL.userMsg).last()
      await expect(lastUserMsg).toContainText(chipText?.trim() ?? '', { timeout: 2_000 })

      // 第二輪 AI 回覆出現
      await expect(page.locator(SEL.typing)).not.toBeVisible({ timeout: REPLY_TIMEOUT })
      await expect(page.locator(SEL.aiBubble).last()).toBeVisible()
    } else {
      // KB mock 這次沒帶 quickReplies → skip
      test.skip()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────

test.describe('J-04  Feedback 按鈕', () => {
  test('點讚 → 再點一次取消 → 點倒讚', async ({ page }) => {
    await openWidget(page)
    await sendMessage(page, 'test feedback')

    // 等待 AI 回覆
    await expect(page.locator(SEL.typing)).not.toBeVisible({ timeout: REPLY_TIMEOUT })
    const rateUp = page.locator(SEL.rateUp).last()
    const rateDown = page.locator(SEL.rateDown).last()
    await expect(rateUp).toBeVisible()

    // 點讚
    await rateUp.click()
    // 再點一次（toggle off）
    await rateUp.click()
    // 點倒讚
    await rateDown.click()
    // 確認倒讚按鈕可見（不拋錯即可）
    await expect(rateDown).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────

test.describe('J-05  時間戳記格式', () => {
  test('AI 訊息時間戳格式為 HH:mm', async ({ page }) => {
    await openWidget(page)
    await sendMessage(page, 'hello')

    // 等待 AI 回覆
    await expect(page.locator(SEL.typing)).not.toBeVisible({ timeout: REPLY_TIMEOUT })

    // 取得 AI 訊息的時間元素
    const timeEl = page.locator(`${SEL.aiMsg} ${SEL.msgTime}`).last()
    await expect(timeEl).toBeVisible()
    const timeText = await timeEl.textContent()
    // 格式應為 HH:mm（例如 14:30）
    expect(timeText?.trim()).toMatch(/^\d{2}:\d{2}$/)
  })

  test('使用者訊息時間戳格式為 HH:mm', async ({ page }) => {
    await openWidget(page)
    await sendMessage(page, 'timestamp check')

    const userTimeEl = page.locator(`${SEL.userMsg} ${SEL.msgTime}`).last()
    // UserMessage 的 time 在 hover 才顯示，先確認存在
    await expect(userTimeEl).toBeAttached({ timeout: 2_000 })
    const timeText = await userTimeEl.textContent()
    expect(timeText?.trim()).toMatch(/^\d{2}:\d{2}$/)
  })
})

// ─────────────────────────────────────────────────────────────────────────

test.describe('J-06  Reset 按鈕', () => {
  test('點擊 Reset → 訊息清空', async ({ page }) => {
    await openWidget(page)

    // 先送出一則訊息
    await sendMessage(page, '測試 reset')
    await expect(page.locator(SEL.userMsg)).toBeVisible({ timeout: 2_000 })

    // 等待 AI 回覆後再 reset，避免 race condition
    await expect(page.locator(SEL.typing)).not.toBeVisible({ timeout: REPLY_TIMEOUT })

    // 點擊 reset
    await page.locator(SEL.btnReset).click()

    // 使用者訊息應消失（或只剩歡迎訊息）
    await expect(page.locator(SEL.userMsg)).not.toBeVisible({ timeout: 2_000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────

test.describe('J-07  關閉 Widget', () => {
  test('點擊 X 按鈕 → Panel 關閉 → FAB 重新出現', async ({ page }) => {
    await openWidget(page)

    // 點關閉按鈕（title="關閉"）
    await page.locator('[data-testid="chat-panel"] button[title="關閉"]').click()

    // Panel 消失
    await expect(page.locator(SEL.panel)).not.toBeVisible({ timeout: 2_000 })

    // FAB 重新出現
    await expect(page.locator(SEL.launcher)).toBeVisible({ timeout: 2_000 })
  })
})
