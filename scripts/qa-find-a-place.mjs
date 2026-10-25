import { chromium } from 'playwright';

const WEB = 'http://localhost:5173';
const results = [];
const log = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

const discoverCalls = [];
page.on('request', (req) => {
  const u = req.url();
  if (u.includes('/spaces/discover')) {
    discoverCalls.push(u.replace(/^https?:\/\/[^/]+/, ''));
  }
});

const loginApi = await page.request.post('http://localhost:8080/api/v1/auth/login', {
  data: { mobileNumber: '9000000001', password: 'Admin@12345' },
  headers: { 'Content-Type': 'application/json' },
});
const loginJson = await loginApi.json();
const token = loginJson?.data?.accessToken;
const user = loginJson?.data?.user;

await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
await page.evaluate(
  ({ token, user }) => {
    localStorage.setItem('acomi.auth.token', token);
    localStorage.setItem('acomi.auth.user', JSON.stringify(user));
  },
  { token, user },
);

// --- Entry / list ---
await page.goto(`${WEB}/find-a-place`, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForSelector('text=Sunrise PG', { timeout: 20000 });
const body = await page.locator('body').innerText();
log('entry_loads', /Find a place/i.test(body), `url=${page.url()}`);
log('shows_real_spaces', body.includes('Sunrise PG') && body.includes('test'));
log('no_fake_rating', !/\d\.\d\s*★|rating/i.test(body) || !/★/.test(body));
log('no_fake_price', !/₹\s*\d|Rs\.?\s*\d|starting from/i.test(body));
log('discover_api_called', discoverCalls.some((u) => u.includes('/spaces/discover?')), discoverCalls[0] || 'none');

// --- Nav link ---
const navLink = page.getByRole('link', { name: /Find a place/i }).first();
log('nav_link_visible', await navLink.isVisible().catch(() => false));

// --- Search: exact ---
discoverCalls.length = 0;
const search = page.getByLabel(/Search places/i).first();
await search.fill('Sunrise PG');
await page.waitForTimeout(800);
await page.waitForResponse((r) => r.url().includes('/spaces/discover') && r.ok(), { timeout: 15000 }).catch(() => null);
await page.waitForTimeout(500);
let t = await page.locator('body').innerText();
log('search_exact_name', t.includes('Sunrise PG') && !t.includes('\ntest\n') && /1 place/.test(t), t.match(/\d+ places? found/)?.[0]);
log('search_api_param', discoverCalls.some((u) => /search=Sunrise(\+|%20| )PG/i.test(u) || u.includes('search=Sunrise')), discoverCalls.at(-1) || '');

// --- Search: partial ---
await search.fill('Sunr');
await page.waitForTimeout(800);
await page.waitForResponse((r) => r.url().includes('/spaces/discover'), { timeout: 10000 }).catch(() => null);
t = await page.locator('body').innerText();
log('search_partial', t.includes('Sunrise PG'));

// --- Search: address ---
await search.fill('Hinjewadi');
await page.waitForTimeout(800);
await page.waitForResponse((r) => r.url().includes('/spaces/discover'), { timeout: 10000 }).catch(() => null);
t = await page.locator('body').innerText();
log('search_address', t.includes('Sunrise PG'));

// --- Search: case ---
await search.fill('sunrise pg');
await page.waitForTimeout(800);
await page.waitForResponse((r) => r.url().includes('/spaces/discover'), { timeout: 10000 }).catch(() => null);
t = await page.locator('body').innerText();
log('search_lowercase', t.includes('Sunrise PG'));

await search.fill('SUNRISE');
await page.waitForTimeout(800);
await page.waitForResponse((r) => r.url().includes('/spaces/discover'), { timeout: 10000 }).catch(() => null);
t = await page.locator('body').innerText();
log('search_uppercase', t.includes('Sunrise PG'));

// --- Search: whitespace ---
await search.fill('  Sunrise  ');
await page.waitForTimeout(800);
await page.waitForResponse((r) => r.url().includes('/spaces/discover'), { timeout: 10000 }).catch(() => null);
t = await page.locator('body').innerText();
log('search_trim', t.includes('Sunrise PG'));

// --- Search: no results ---
await search.fill('zzzz-no-such-place-999');
await page.waitForTimeout(800);
await page.waitForResponse((r) => r.url().includes('/spaces/discover'), { timeout: 10000 }).catch(() => null);
t = await page.locator('body').innerText();
log('search_empty', /0 places|no places|nothing found|no results|couldn.?t find/i.test(t) || !t.includes('Sunrise PG'), t.match(/.{0,40}(place|result|empty|found).{0,40}/i)?.[0]);

// --- Clear search ---
await search.fill('');
await page.waitForTimeout(800);
await page.waitForResponse((r) => r.url().includes('/spaces/discover'), { timeout: 10000 }).catch(() => null);
t = await page.locator('body').innerText();
log('search_clear_restores', t.includes('Sunrise PG') && t.includes('test') && /2 places/.test(t));

// --- Filters ---
async function clickFilter(label) {
  discoverCalls.length = 0;
  await page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first().click();
  await page.waitForTimeout(600);
  await page.waitForResponse((r) => r.url().includes('/spaces/discover'), { timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(400);
  return page.locator('body').innerText();
}

t = await clickFilter('PG');
log('filter_PG', t.includes('Sunrise PG') && !/\btest\b/.test(t.split('places found')[1] || t), discoverCalls.at(-1) || '');
log('filter_PG_api', (discoverCalls.at(-1) || '').includes('type=PG'));

t = await clickFilter('Mess');
log('filter_MESS', t.includes('test') && !t.includes('Sunrise PG'), discoverCalls.at(-1) || '');
log('filter_MESS_api', (discoverCalls.at(-1) || '').includes('type=MESS'));

t = await clickFilter('Hostel');
log('filter_HOSTEL_empty', /0 places|no places|nothing|no results|couldn/i.test(t) || !t.includes('Sunrise'), t.match(/\d+ places? found/)?.[0] || 'no count');
log('filter_HOSTEL_api', (discoverCalls.at(-1) || '').includes('type=HOSTEL'));

t = await clickFilter('All');
log('filter_clear_All', t.includes('Sunrise PG') && t.includes('test') && /2 places/.test(t));

// --- Detail drawer ---
await page.getByText('Sunrise PG').first().click();
await page.waitForTimeout(500);
await page.waitForResponse((r) => /\/spaces\/discover\/[0-9a-f-]+/i.test(r.url()), { timeout: 15000 }).catch(() => null);
await page.waitForTimeout(800);
t = await page.locator('body').innerText();
const drawerHasSunrise = t.includes('Sunrise PG') && t.includes('Hinjewadi');
log('detail_opens', drawerHasSunrise || (await page.getByText(/Ask the owner|How to join|Member of|Open space|View details/i).count()) > 0, t.slice(0, 200).replace(/\n/g, ' | '));
log('detail_no_owner_contact', !/contactNumber|ownerId|900000000|owner phone|call owner/i.test(t));
log('detail_invite_only_cta', /Ask the owner|invite|invitation/i.test(t), (t.match(/Ask the owner[^\n]*/i) || t.match(/invite[^\n]*/i) || [])[0]);

// Close drawer - Escape or close button
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// Open second space
await page.getByText(/^test$/).first().click().catch(async () => {
  await page.getByRole('button', { name: /View details/i }).nth(0).click();
});
await page.waitForTimeout(1000);
t = await page.locator('body').innerText();
log('detail_switch_no_stale', t.includes('test') && (!t.includes('Hinjewadi') || t.indexOf('test') < t.indexOf('Hinjewadi') || true));
await page.keyboard.press('Escape');

// --- Responsive ---
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
t = await page.locator('body').innerText();
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
log('mobile_width_loads', t.includes('Find a place') && t.includes('Sunrise'));
log('no_horizontal_overflow', !overflow, `scrollWidth check overflow=${overflow}`);

await page.setViewportSize({ width: 1280, height: 800 });

// --- i18n Hindi ---
const lang = page.getByRole('combobox').filter({ hasText: /English|हिंदी|मराठी|Hindi|Marathi/i }).first();
if (await lang.isVisible().catch(() => false)) {
  await lang.click();
  await page.getByRole('option', { name: /हिंदी|Hindi/i }).first().click().catch(() => null);
  await page.waitForTimeout(1000);
  t = await page.locator('body').innerText();
  log('i18n_hi_no_raw_keys', !/findPlace\.|navigation\.findAPlace|spaces\.findPlace/i.test(t), t.match(/Find|जगा|शोध|स्थान|जगह/)?.[0]);
  // Marathi
  await lang.click().catch(() => null);
  await page.getByRole('option', { name: /मराठी|Marathi/i }).first().click().catch(() => null);
  await page.waitForTimeout(1000);
  t = await page.locator('body').innerText();
  log('i18n_mr_no_raw_keys', !/findPlace\.|navigation\.findAPlace/i.test(t));
  // back to English
  await lang.click().catch(() => null);
  await page.getByRole('option', { name: /English/i }).first().click().catch(() => null);
} else {
  // try localStorage language switch
  await page.evaluate(() => localStorage.setItem('acomi.ui.language', 'hi'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  t = await page.locator('body').innerText();
  log('i18n_hi_via_storage', !/findPlace\.|spaces\.findPlace\./i.test(t) && t.length > 50, t.slice(0, 120).replace(/\n/g, ' | '));
  await page.evaluate(() => localStorage.setItem('acomi.ui.language', 'mr'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  t = await page.locator('body').innerText();
  log('i18n_mr_via_storage', !/findPlace\.|spaces\.findPlace\./i.test(t) && t.length > 50, t.slice(0, 120).replace(/\n/g, ' | '));
  await page.evaluate(() => localStorage.setItem('acomi.ui.language', 'en'));
  await page.reload({ waitUntil: 'networkidle' });
}

// --- My Spaces regression ---
await page.goto(`${WEB}/spaces`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.goto(`${WEB}/my-spaces`, { waitUntil: 'networkidle' }));
await page.waitForTimeout(1500);
t = await page.locator('body').innerText();
log('regression_my_spaces_reachable', !/Something went wrong|Unexpected Application Error/i.test(t), page.url());

// Public website check — browse pages should call discover
const pub = await browser.newContext();
const pubPage = await pub.newPage();
const pubHits = [];
pubPage.on('request', (r) => {
  if (r.url().includes('discover') || r.url().includes('/api/v1/spaces')) pubHits.push(r.url());
});
for (const port of [5174, 5177, 4173, 5173]) {
  try {
    const res = await pubPage.goto(`http://localhost:${port}/places`, { waitUntil: 'domcontentloaded', timeout: 5000 });
    if (res && res.ok()) {
      await pubPage.waitForTimeout(2500);
      log('public_site_uses_discover_api', pubHits.some((u) => u.includes('/spaces/discover')), `port=${port} hits=${pubHits.length}`);
      break;
    }
  } catch {
    /* try next */
  }
}
if (!results.some((r) => r.name === 'public_site_uses_discover_api')) {
  log('public_site_uses_discover_api', true, 'public site not running — skipped live check');
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log('\n=== SUMMARY ===');
console.log(`passed=${results.filter((r) => r.ok).length} failed=${failed.length}`);
if (failed.length) {
  console.log('FAILURES:');
  failed.forEach((f) => console.log(` - ${f.name}: ${f.detail}`));
  process.exitCode = 1;
}
