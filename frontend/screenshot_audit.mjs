import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 900 })

const pages = [
  { url: 'http://localhost:5173/', path: '/tmp/audit_home.png', wait: 'text=Returns, Reimagined' },
  { url: 'http://localhost:5173/returns', path: '/tmp/audit_returns.png', wait: 'text=Start a Return' },
  { url: 'http://localhost:5173/marketplace', path: '/tmp/audit_marketplace.png', wait: 'text=Marketplace' },
  { url: 'http://localhost:5173/wallet', path: '/tmp/audit_wallet.png', wait: 'text=Green Wallet' },
  { url: 'http://localhost:5173/risk-check', path: '/tmp/audit_risk.png', wait: 'text=Return Risk Checker' },
]

const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', err => errors.push(err.message))

for (const { url, path, wait } of pages) {
  await page.goto(url)
  await page.waitForSelector(wait, { timeout: 6000 }).catch(() => errors.push(`TIMEOUT: ${url}`))
  await page.waitForTimeout(600)
  await page.screenshot({ path, fullPage: true })
  console.log(`✓ ${url}`)
}

if (errors.length) {
  console.log('\nConsole errors found:')
  errors.forEach(e => console.log(' ', e))
} else {
  console.log('\nNo console errors.')
}

await browser.close()
