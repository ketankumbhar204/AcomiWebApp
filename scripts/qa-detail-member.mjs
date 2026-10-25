import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import path from 'node:path';

const WEB = 'http://localhost:5173';
const SPACE_ID = '224a080f-fcae-4bb3-8a3d-1389215a82d6';
const shot = path.resolve('K:/AcomiWeb/scripts/qa-detail-member.png');

function psql(sql) {
  execSync(`psql -h localhost -U postgres -d acomi_db -c "${sql.replace(/"/g, '\\"')}"`, {
    env: { ...process.env, PGPASSWORD: 'Admin@123' },
    stdio: 'pipe',
  });
}

psql(
  `INSERT INTO space_memberships (id, user_id, space_id, status, role, joined_at, created_at, updated_at) VALUES (gen_random_uuid(), 'a0000000-0000-4000-8000-000000000001', '${SPACE_ID}', 'ACTIVE', 'TENANT', now(), now(), now()) ON CONFLICT DO NOTHING;`,
);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
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

await page.goto(`${WEB}/find-a-place`, { waitUntil: 'networkidle' });
await page.waitForSelector("text=You're a member");
const sunriseCard = page.locator('.MuiBox-root').filter({ hasText: 'Sunrise PG' }).filter({ hasText: "You're a member" }).last();
await sunriseCard.getByRole('button', { name: 'View details' }).click();
await page.getByRole('button', { name: 'Open space dashboard' }).waitFor({ timeout: 15000 });
await page.screenshot({ path: shot, fullPage: true });
console.log('MEMBER_OPEN_CTA_VISIBLE', await page.getByRole('button', { name: 'Open space dashboard' }).isVisible());
console.log('ASK_HIDDEN', (await page.getByRole('button', { name: 'Ask the owner to invite you' }).count()) === 0);

psql(
  `DELETE FROM space_memberships WHERE user_id='a0000000-0000-4000-8000-000000000001' AND space_id='${SPACE_ID}';`,
);
await browser.close();
console.log('DONE', shot);
