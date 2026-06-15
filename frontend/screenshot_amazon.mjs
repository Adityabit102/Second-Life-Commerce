import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

for (const [url, file, wait] of [
  ['http://localhost:5173/',            '/tmp/amz_home.png',        'text=Returns, Reimagined'],
  ['http://localhost:5173/returns',     '/tmp/amz_returns.png',     'text=Start a Return'],
  ['http://localhost:5173/marketplace', '/tmp/amz_marketplace.png', 'text=Marketplace'],
  ['http://localhost:5173/wallet',      '/tmp/amz_wallet.png',      'text=Green Wallet'],
  ['http://localhost:5173/risk-check',  '/tmp/amz_risk.png',        'text=Return Risk Checker'],
]) {
  await page.goto(url)
  await page.waitForSelector(`text=${wait.replace('text=','')}`, { timeout: 6000 }).catch(()=>{})
  await page.waitForTimeout(800)
  await page.screenshot({ path: file, fullPage: true })
  console.log('✓', url)
}
await browser.close()
