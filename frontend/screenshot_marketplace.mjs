import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 900 })

await page.goto('http://localhost:5173/marketplace')
await page.waitForSelector('text=AI Trust Score', { timeout: 6000 })
await page.screenshot({ path: '/tmp/marketplace.png', fullPage: true })
console.log('marketplace screenshot saved')

// Grade A filter
await page.click('text=Grade A')
await page.waitForTimeout(600)
await page.screenshot({ path: '/tmp/marketplace_filter_a.png' })
console.log('grade A filter screenshot saved')

await browser.close()
