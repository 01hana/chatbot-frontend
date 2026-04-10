import { test, expect } from '@playwright/test'

test('debug: 確認 pressSequentially 後 btn-send 是否 enabled', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-testid="chat-launcher"]').click()
  await page.waitForSelector('[data-testid="chat-panel"]')
  await page.waitForTimeout(500)

  const input = page.locator('[data-testid="chat-input"]')
  const btnSend = page.locator('[data-testid="btn-send"]')

  // Before typing
  const disabledBefore = await btnSend.evaluate((el: any) => el.disabled)
  console.log(`btn-send disabled before typing: ${disabledBefore}`)

  // Try pressSequentially
  await input.click()
  await input.pressSequentially('hello', { delay: 50 })
  await page.waitForTimeout(200)

  const disabledAfter = await btnSend.evaluate((el: any) => el.disabled)
  console.log(`btn-send disabled after pressSequentially: ${disabledAfter}`)

  // Check textarea value
  const value = await input.evaluate((el: any) => el.value)
  console.log(`textarea value: "${value}"`)

  // Try type instead
  await input.fill('')
  await page.keyboard.type('world', { delay: 50 })
  await page.waitForTimeout(200)
  const value2 = await input.evaluate((el: any) => el.value)
  console.log(`textarea value after keyboard.type: "${value2}"`)
  const disabledAfter2 = await btnSend.evaluate((el: any) => el.disabled)
  console.log(`btn-send disabled after keyboard.type: ${disabledAfter2}`)

  expect(true).toBe(true)
})


