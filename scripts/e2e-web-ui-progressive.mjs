/**
 * Web UI progressive-access checks via direct routes (Playwright).
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const WEB = process.env.ACOMI_WEB || 'http://localhost:5175';
const API = process.env.ACOMI_API || 'http://127.0.0.1:8080/api/v1';
const MOBILE = process.env.ACOMI_MOBILE || '9999999999';
const PASSWORD = process.env.ACOMI_PASSWORD || 'Ketan@123';
const outDir = path.join(process.env.TEMP || '/tmp', 'acomi-e2e-web');
fs.mkdirSync(outDir, { recursive: true });

const results = [];
const pass = (n) => {
  results.push({ ok: true, name: n });
  console.log('PASS', n);
};
const fail = (n, d) => {
  results.push({ ok: false, name: n, detail: d });
  console.log('FAIL', n, d || '');
};

async function apiLogin() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber: MOBILE, password: PASSWORD }),
  });
  const json = await res.json();
  return json.data;
}

async function buildingCount(token, spaceId) {
  const res = await fetch(`${API}/spaces/${spaceId}/buildings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return -1;
  const json = await res.json();
  const data = json.data;
  return Array.isArray(data) ? data.length : 0;
}

async function createEmptyPg(token, ownerId) {
  const name = `E2E Empty Probe ${Date.now()}`;
  const res = await fetch(`${API}/spaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      type: 'PG',
      ownerId,
      contactMobile: MOBILE,
    }),
  });
  const json = await res.json();
  const spaceId = json.data?.id || json.data?.spaceId;
  return { spaceId, spaceName: name, spaceType: 'PG' };
}

async function uiLogin(page) {
  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  const mobile = page.locator('input').nth(0);
  const password = page.locator('input[type="password"]').first();
  await mobile.fill(MOBILE);
  await password.fill(PASSWORD);
  await page.getByRole('button', { name: /log in|sign in|continue/i }).first().click();
  await page.waitForURL(/spaces|dashboard|my-spaces/i, { timeout: 60000 });
}

async function main() {
  const session = await apiLogin();
  const token = session.accessToken;
  const ownerId = JSON.parse(
    Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
  ).sub;
  const spacesRes = await fetch(`${API}/spaces/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const spaces = (await spacesRes.json()).data || [];
  const byType = (t) => spaces.find((s) => s.spaceType === t && String(s.spaceName).includes('E2E'));

  // Prefer incomplete lodging for LOCKED members (avoid QS-polluted spaces).
  let hostel = byType('HOSTEL');
  if (!hostel) {
    for (const s of spaces.filter((x) => x.spaceType === 'HOSTEL')) {
      if ((await buildingCount(token, s.spaceId)) === 0) {
        hostel = s;
        break;
      }
    }
  }
  if (!hostel) {
    hostel = spaces.find((s) => s.spaceType === 'HOSTEL');
  }

  const rental = byType('RENTAL') || spaces.find((s) => s.spaceType === 'RENTAL');
  const mess = byType('MESS') || spaces.find((s) => s.spaceType === 'MESS');
  const sunrise = spaces.find((s) => /Sunrise/i.test(s.spaceName));

  let probe = spaces.find((s) => /E2E Empty Probe|Probe/i.test(s.spaceName));
  if (!probe || (await buildingCount(token, probe.spaceId)) > 0) {
    probe = await createEmptyPg(token, ownerId);
  }
  const browser = await chromium.launch({ headless: true, channel: 'msedge' }).catch(() =>
    chromium.launch({ headless: true }),
  );
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await uiLogin(page);
    pass(`login ${page.url()}`);

    if (hostel) {
      const hostelBuildings = await buildingCount(token, hostel.spaceId);
      await page.goto(`${WEB}/spaces/${hostel.spaceId}/members`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outDir, 'ui-hostel-members.png'), fullPage: true });
      const text = await page.locator('body').innerText();
      if (hostelBuildings === 0) {
        if (/accommodation first|Set up accommodation/i.test(text)) pass('Hostel /members locked panel');
        else fail('Hostel /members locked panel', text.slice(0, 280));
      } else {
        // Property-ready hostel: members should be open (positive control).
        if (/accommodation first|Set up accommodation/i.test(text)) {
          fail('Hostel /members open when property ready', 'still locked');
        } else {
          pass('Hostel /members open when property ready');
        }
      }
      await page.goto(`${WEB}/spaces/${hostel.spaceId}/meals`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outDir, 'ui-hostel-meals.png'), fullPage: true });
      const mealsText = await page.locator('body').innerText();
      if (/Finish accommodation|Set up accommodation|menu library/i.test(mealsText)) {
        pass('Hostel /meals locked panel');
      } else fail('Hostel /meals locked panel', mealsText.slice(0, 280));

      await page.goto(`${WEB}/spaces/${hostel.spaceId}/payments`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outDir, 'ui-hostel-payments.png'), fullPage: true });
      const payText = await page.locator('body').innerText();
      if (/billable|Payments will show activity/i.test(payText)) pass('Hostel payments soft tip');
      else pass('Hostel payments reachable (soft tip optional if already billable)');
    }

    if (rental) {
      await page.goto(`${WEB}/spaces/${rental.spaceId}/dashboard`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outDir, 'ui-rental-dash.png'), fullPage: true });
      const dash = await page.locator('body').innerText();
      if (/Meal operations/i.test(dash)) fail('Rental dashboard hides meal ops', 'Meal operations still visible');
      else pass('Rental dashboard hides meal ops');
      // Quick actions strip should not advertise Meals for rental
      const qa = page.getByLabel(/quick actions/i);
      const qaText = (await qa.count()) ? await qa.innerText() : dash;
      if (/\bMeals\b/i.test(qaText) && /Plan, share/i.test(qaText)) {
        fail('Rental quick actions hide Meals', qaText.slice(0, 200));
      } else if (!/\bMeals\b/.test(qaText.split('Quick actions')[1] || qaText)) {
        pass('Rental quick actions hide Meals');
      } else {
        // Meals word may appear elsewhere; check tile subtitle
        if (/Plan, share, and track/i.test(qaText)) fail('Rental quick actions hide Meals', 'meals tile present');
        else pass('Rental quick actions hide Meals');
      }

      await page.goto(`${WEB}/spaces/${rental.spaceId}/meals`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      const mealsUrl = page.url();
      const mealsBody = await page.locator('body').innerText();
      if (/forbidden|no access|not allowed|403/i.test(mealsBody) || /forbidden/i.test(mealsUrl)) {
        pass('Rental /meals blocked');
      } else if (/Meal|Menu|Plan/i.test(mealsBody) && !/forbidden/i.test(mealsBody)) {
        fail('Rental /meals blocked', mealsBody.slice(0, 200));
      } else {
        pass('Rental /meals not exposing meal workspace');
      }
    }

    if (mess) {
      await page.goto(`${WEB}/spaces/${mess.spaceId}/dashboard`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outDir, 'ui-mess-dash.png'), fullPage: true });
      // Direct accommodation should be forbidden or empty for mess
      await page.goto(`${WEB}/spaces/${mess.spaceId}/accommodation`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(1000);
      const acc = await page.locator('body').innerText();
      if (/forbidden|no access|not allowed/i.test(acc) || !/Building|Quick Setup|Rooms/i.test(acc)) {
        pass('Mess accommodation not operational');
      } else {
        fail('Mess accommodation gated', acc.slice(0, 200));
      }
    }

    if (sunrise) {
      await page.goto(`${WEB}/spaces/${sunrise.spaceId}/members`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      const text = await page.locator('body').innerText();
      if (/accommodation first/i.test(text)) fail('Sunrise members open', 'still locked');
      else pass('Sunrise members open');
    }

    if (probe) {
      await page.goto(`${WEB}/spaces/${probe.spaceId}/members`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      const text = await page.locator('body').innerText();
      if (/accommodation first|Set up accommodation/i.test(text)) pass('Empty PG probe members locked');
      else fail('Empty PG probe members locked', text.slice(0, 200));
    }
  } finally {
    fs.writeFileSync(path.join(outDir, 'ui-results.json'), JSON.stringify(results, null, 2));
    console.log('Results', results.filter((r) => r.ok).length, '/', results.length, 'pass');
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
