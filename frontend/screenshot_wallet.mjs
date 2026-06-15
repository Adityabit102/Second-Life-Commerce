import { chromium } from 'playwright'
import path from 'path'

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 900 })

await page.goto('http://localhost:5173/wallet')
await page.waitForSelector('text=Green Wallet', { timeout: 5000 })
await page.screenshot({ path: '/tmp/wallet_full.png', fullPage: true })
console.log('wallet screenshot saved')

// Also grab returns page after a grade to see mini widget
await page.goto('http://localhost:5173/returns')
await page.waitForSelector('text=Start a Return')
await page.screenshot({ path: '/tmp/returns_page.png' })
console.log('returns page screenshot saved')

await browser.close()
