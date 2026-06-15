import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 900 })

// Risk check — form empty
await page.goto('http://localhost:5173/risk-check')
await page.waitForSelector('text=Return Risk Checker')
await page.screenshot({ path: '/tmp/risk_empty.png' })

// Fill form and submit
await page.fill('input[placeholder*="Bassheads"]', 'boAt Bassheads 100')
await page.selectOption('select', 'Electronics')
await page.fill('input[type="number"]', '499')
await page.click('text=Check Return Risk')
await page.waitForSelector('text=Risk Score', { timeout: 8000 })
await page.screenshot({ path: '/tmp/risk_result.png', fullPage: true })
console.log('risk check screenshots saved')

// Marketplace with seeded data
await page.goto('http://localhost:5173/marketplace')
await page.waitForSelector('text=AI Trust Score', { timeout: 6000 })
await page.screenshot({ path: '/tmp/marketplace_seeded.png', fullPage: true })
console.log('marketplace seeded screenshot saved')

// Wallet with seeded data
await page.goto('http://localhost:5173/wallet')
await page.waitForSelector('text=Green Wallet', { timeout: 5000 })
await page.waitForTimeout(1400)  // let count-up finish
await page.screenshot({ path: '/tmp/wallet_seeded.png', fullPage: true })
console.log('wallet seeded screenshot saved')

await browser.close()
