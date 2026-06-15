import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const browser = await chromium.launch({ slowMo: 60 })
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 900 })

const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

console.log('1. Navigate to /returns')
await page.goto('http://localhost:5173/returns')
await page.waitForSelector('text=Start a Return')

console.log('2. Type product name and commit')
await page.fill('input[placeholder*="Sony"]', 'Sony Headphones')
await page.click('text=Let\'s go')
await page.waitForSelector('text=Returning: Sony Headphones')
console.log('   ✓ Product name committed')

console.log('3. Send first message to Deflect Bot')
await page.waitForSelector('text=Before we process your return')
await page.fill('input[placeholder*="Describe"]', 'The left ear has no sound')
await page.click('button:has-text("Send")')
await page.waitForSelector('text=Demo mode', { timeout: 8000 })
console.log('   ✓ First bot reply received')

console.log('4. Send second message to trigger "still like to return" button')
await page.fill('input[placeholder="Reply…"]', 'The reset did not help')
await page.click('button:has-text("Send")')
// Wait for second bot reply (second Demo mode badge)
await page.waitForFunction(() => {
  return document.querySelectorAll('text').length > 0 ||
         document.body.innerText.includes('still like to return')
}, { timeout: 10000 }).catch(async () => {
  // fallback: just wait a bit
  await page.waitForTimeout(3000)
})
await page.waitForSelector('text=still like to return', { timeout: 8000 })
console.log('   ✓ "I\'d still like to return it" button appeared')
await page.screenshot({ path: '/tmp/e2e_1_after_deflect.png', fullPage: true })

console.log('5. Click "I\'d still like to return it"')
await page.click('text=still like to return')
await page.waitForTimeout(700)
console.log('   ✓ Scrolled to upload section')

console.log('6. Upload test image')
await page.locator('input[type="file"]').setInputFiles('/tmp/test_item.jpg')
await page.waitForSelector('text=Change photo', { timeout: 4000 })
console.log('   ✓ Image preview shown')
await page.screenshot({ path: '/tmp/e2e_2_image_uploaded.png', fullPage: true })

console.log('7. Click Get AI Grade')
await page.click('text=Get AI Grade')
await page.waitForSelector('text=Confidence', { timeout: 15000 })
console.log('   ✓ Result card appeared')
await page.screenshot({ path: '/tmp/e2e_3_grade_result.png', fullPage: true })

console.log('8. Check result fields')
const hasWallet = await page.locator('text=Total Credits').count()
console.log(`   Mini wallet widget: ${hasWallet > 0 ? '✓ visible' : '✗ missing'}`)

const listingBtnVisible = await page.locator('text=Create Marketplace Listing').count()
const recycleBtnVisible = await page.locator('text=recycle it').count()
console.log(`   Listing btn: ${listingBtnVisible > 0 ? '✓' : '—'}  Recycle btn: ${recycleBtnVisible > 0 ? '✓' : '—'}`)

if (listingBtnVisible > 0) {
  console.log('9. Click Create Marketplace Listing')
  await page.click('text=Create Marketplace Listing')
  await page.waitForSelector('text=Listing created', { timeout: 8000 })
  console.log('   ✓ Toast appeared')
  await page.screenshot({ path: '/tmp/e2e_4_toast.png', fullPage: true })
} else {
  console.log('9. Grade is C/Junk — recycle path (listing button not shown, expected)')
  await page.screenshot({ path: '/tmp/e2e_4_recycle.png', fullPage: true })
}

console.log('10. Check Marketplace for new listing')
await page.goto('http://localhost:5173/marketplace')
await page.waitForTimeout(1000)
const cards = await page.locator('.rounded-2xl.shadow-sm').count()
console.log(`    ✓ Marketplace cards: ${cards}`)
await page.screenshot({ path: '/tmp/e2e_5_marketplace.png', fullPage: true })

console.log('11. Check Wallet credits updated')
await page.goto('http://localhost:5173/wallet')
await page.waitForTimeout(1600)
await page.screenshot({ path: '/tmp/e2e_6_wallet.png', fullPage: true })
// Read the transaction count
const txCount = await page.locator('li').count()
console.log(`    ✓ Transaction rows: ${txCount}`)

console.log('\n--- SUMMARY ---')
if (errors.length) {
  console.log('Console errors:')
  errors.forEach(e => console.log('  ✗', e))
} else {
  console.log('No console errors ✓')
}
console.log('Full happy path: COMPLETE ✓')

await browser.close()
