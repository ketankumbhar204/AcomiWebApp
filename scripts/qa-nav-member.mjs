import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const WEB = 'http://localhost:5173';
const SPACE_ID = '224a080f-fcae-4bb3-8a3d-1389215a82d6';

function psql(sql) {
  execSync(`psql -h localhost -U postgres -d acomi_db -c "${sql.replace(/"/g, '\\"')}"`, {
    env: { ...process.env, PGPASSWORD: 'Admin@123' },
    stdio: 'pipe',
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const discover = [];
page.on('request', (r) => {
  if (r.url().includes('/spaces/discover')) discover.push(r.url());
});

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

await page.goto(`${WEB}/my-spaces`, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2000);
console.log('MY_SPACES_URL', page.url());
const body1 = await page.locator('body').innerText();
console.log('MY_SPACES_SNIP', body1.slice(0, 900).replace(/\n/g, ' | '));
console.log('HREF', await page.locator('a[href="/find-a-place"]').count());
console.log('FIND_TEXT', await page.getByText(/Find a place/i).count());
console.log('CTA_BTN', await page.getByRole('button', { name: /Find a place/i }).count());

if ((await page.locator('a[href="/find-a-place"]').count()) > 0) {
  await page.locator('a[href="/find-a-place"]').first().click();
} else if ((await page.getByRole('button', { name: /Find a place/i }).count()) > 0) {
  await page.getByRole('button', { name: /Find a place/i }).first().click();
} else {
  await page.getByText(/Find a place/i).first().click();
}
await page.waitForTimeout(2000);
console.log('AFTER_NAV', page.url());
await page.waitForSelector('text=Sunrise PG', { timeout: 20000 });
console.log('DISCOVER_HIT', discover.some((u) => u.includes('/spaces/discover')));

// non-member CTA
await page.getByText('Sunrise PG').first().click();
await page.waitForTimeout(1200);
let body = await page.locator('body').innerText();
console.log('NON_MEMBER_ASK_INVITE', /Ask the owner to invite you/i.test(body));
console.log('NON_MEMBER_HAS_JOIN_SPACE_BTN', /Join Space/i.test(body));
await page.keyboard.press('Escape');

// member path
psql(
  `INSERT INTO space_memberships (id, user_id, space_id, status, role, joined_at, created_at, updated_at) VALUES (gen_random_uuid(), 'a0000000-0000-4000-8000-000000000001', '${SPACE_ID}', 'ACTIVE', 'TENANT', now(), now(), now()) ON CONFLICT DO NOTHING;`,
);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('text=Sunrise PG');
await page.getByText('Sunrise PG').first().click();
await page.waitForTimeout(1500);
body = await page.locator('body').innerText();
console.log('MEMBER_BADGE', /Member of this space|Already a member|You're a member/i.test(body) || body.includes('Member'));
console.log('MEMBER_OPEN_CTA', /Open (space|dashboard)|Go to (space|dashboard)/i.test(body));
console.log('MEMBER_SNIP', (body.match(/Member[^\n]{0,60}|Open[^\n]{0,40}|Ask the owner[^\n]{0,50}/gi) || []).slice(0, 6));

psql(
  `DELETE FROM space_memberships WHERE user_id='a0000000-0000-4000-8000-000000000001' AND space_id='${SPACE_ID}';`,
);

await browser.close();
