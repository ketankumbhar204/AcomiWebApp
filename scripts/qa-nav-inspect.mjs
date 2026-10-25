import { chromium } from 'playwright';

const WEB = 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const login = await (
  await page.request.post('http://localhost:8080/api/v1/auth/login', {
    data: { mobileNumber: '9000000001', password: 'Admin@12345' },
    headers: { 'Content-Type': 'application/json' },
  })
).json();

await page.goto(`${WEB}/login`);
await page.evaluate(
  ({ token, user }) => {
    localStorage.setItem('acomi.auth.token', token);
    localStorage.setItem('acomi.auth.user', JSON.stringify(user));
    localStorage.setItem('acomi.admin.mode', 'false');
  },
  { token: login.data.accessToken, user: login.data.user },
);

await page.goto(`${WEB}/spaces`, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2000);
console.log('URL', page.url());
const body = await page.locator('body').innerText();
console.log('BODY', body.slice(0, 1200).replace(/\n/g, ' | '));
console.log('HREF_COUNT', await page.locator('a[href="/find-a-place"]').count());
console.log('FIND_TEXT_COUNT', await page.getByText(/Find a place/i).count());
console.log('ALL_ANCHORS', await page.locator('a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href')).slice(0, 40)));
await page.screenshot({ path: 'scripts/qa-spaces-nav.png', fullPage: true });

// Try clicking sidebar item by text
const side = page.getByText('Find a place', { exact: false }).first();
if (await side.isVisible().catch(() => false)) {
  await side.click();
  await page.waitForTimeout(1500);
  console.log('AFTER_CLICK', page.url());
}

await browser.close();
