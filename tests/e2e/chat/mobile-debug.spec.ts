import { test, expect } from '@playwright/test'

test('mobile: 確認 chat-launcher 是否存在', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const viewport = page.viewportSize()
  console.log('viewport:', JSON.stringify(viewport))

  // 確認 chat-launcher 是否在 DOM 中
  const launcherCount = await page.locator('[data-testid="chat-launcher"]').count()
  console.log(`chat-launcher count: ${launcherCount}`)

  // 確認 body innerHTML
  const html = await page.evaluate(() => document.body.innerHTML.slice(0, 3000))
  console.log('body HTML slice:', html)

  expect(launcherCount).toBeGreaterThan(0)
})
