import { chromium } from 'playwright';

const WEB = 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

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

await page.goto(`${WEB}/join-space`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
let body = await page.locator('body').innerText();
console.log('JOIN_HAS_LOOKING', body.includes('Looking for a place?'));
console.log('JOIN_HAS_FIND', /Find a place/i.test(body));
console.log('JOIN_HAS_EMPTY', body.includes('No invitations'));
console.log('JOIN_HAS_OWNER', /I Am an Owner instead/i.test(body));
console.log('NAV_HREF', await page.locator('a[href="/find-a-place"]').count());

await page.getByRole('button', { name: /^Find a place$/i }).nth(1).click();
await page.waitForURL('**/find-a-place', { timeout: 15000 });
await page.waitForTimeout(1500);
body = await page.locator('body').innerText();
console.log('FIND_URL', page.url());
console.log('FIND_TITLE', /Find a place/i.test(body));
console.log('FIND_REAL_OR_EMPTY', /Sunrise|places found|No places|Browse active/i.test(body));

await page.goto(`${WEB}/my-spaces`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
body = await page.locator('body').innerText();
console.log('MY_HAS_FIND', /Find a place/i.test(body));
console.log('MY_NAV_HREF', await page.locator('a[href="/find-a-place"]').count());

await page.goto(`${WEB}/login`);
await page.evaluate(() => localStorage.clear());
await page.goto(`${WEB}/find-a-place`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
console.log('LOGGED_OUT_URL', page.url());

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${WEB}/login`);
await page.evaluate(
  ({ token, user }) => {
    localStorage.setItem('acomi.auth.token', token);
    localStorage.setItem('acomi.auth.user', JSON.stringify(user));
    localStorage.setItem('acomi.admin.mode', 'false');
  },
  { token: login.data.accessToken, user: login.data.user },
);
await page.goto(`${WEB}/join-space`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
body = await page.locator('body').innerText();
console.log('MOBILE_JOIN_FIND', /Find a place|Looking for a place/i.test(body));

await browser.close();
