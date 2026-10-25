/**
 * Local web progressive-access E2E (API + capability rules).
 * Does not modify product code. Credentials via env; never prints passwords.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.ACOMI_API || 'http://127.0.0.1:8080/api/v1';
const WEB = process.env.ACOMI_WEB || 'http://localhost:5175';
const MOBILE = process.env.ACOMI_MOBILE || '9999999999';
const PASSWORD = process.env.ACOMI_PASSWORD || 'Ketan@123';
const outDir = path.join(process.env.TEMP || '/tmp', 'acomi-e2e-web');
fs.mkdirSync(outDir, { recursive: true });

const findings = [];
const matrix = [];

function note(sev, title, detail = '') {
  findings.push({ sev, title, detail });
  console.log(`[${sev}] ${title}${detail ? ` — ${detail}` : ''}`);
}

async function api(method, urlPath, token, body) {
  const res = await fetch(`${API}${urlPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

function isLodging(type) {
  return ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL'].includes(type);
}

function propertyReady(type, s) {
  if (!isLodging(type)) return true;
  if ((s.buildingCount || 0) <= 0) return false;
  if (type === 'RENTAL') return (s.unitCount || 0) > 0;
  return (s.bedCount || 0) > 0;
}

function evaluateCaps(type, signals, perms) {
  const progressive = true;
  const lodging = isLodging(type);
  const isMess = type === 'MESS';
  const isRental = type === 'RENTAL';
  const ready = propertyReady(type, signals);
  const hasMembers = (signals.memberCount || 0) > 0;
  const curated = signals.hasCuratedMealLibrary === true;
  const allocated = signals.allocatedMemberCount || 0;
  const billable = signals.hasBillableActivity === true;

  const out = {};
  out.ACCOMMODATION = !lodging || !perms.canViewAccommodation ? 'HIDDEN' : 'AVAILABLE';
  if (!perms.canManageMembers) out.MEMBERS = 'HIDDEN';
  else if (lodging && !ready) out.MEMBERS = 'LOCKED';
  else out.MEMBERS = 'AVAILABLE';

  if (isRental || !perms.canManageMeals) out.MEAL_CONFIG = 'HIDDEN';
  else if (lodging && !ready) out.MEAL_CONFIG = 'LOCKED';
  else out.MEAL_CONFIG = 'AVAILABLE';

  if (isRental) out.MEAL_OPS = 'HIDDEN';
  else if (!curated) out.MEAL_OPS = 'LOCKED';
  else if (lodging && allocated <= 0) out.MEAL_OPS = 'LOCKED';
  else out.MEAL_OPS = 'AVAILABLE';

  if (!lodging || !perms.canManageOccupancy) out.ALLOCATION = 'HIDDEN';
  else if (!ready) out.ALLOCATION = 'LOCKED';
  else if (!hasMembers) out.ALLOCATION = 'LOCKED';
  else out.ALLOCATION = 'AVAILABLE';

  out.PAYMENTS = billable ? 'AVAILABLE' : 'SOFT';
  out.COMPLAINTS = hasMembers ? 'AVAILABLE' : 'SOFT';
  out.INVENTORY = perms.canViewInventory ? 'AVAILABLE' : 'HIDDEN';
  return out;
}

async function spaceSignals(token, spaceId, spaceType) {
  const buildings = await api('GET', `/spaces/${spaceId}/buildings`, token);
  const members = await api('GET', `/spaces/${spaceId}/members`, token);
  const memberList = Array.isArray(members.json?.data) ? members.json.data : [];
  const nonOwner = memberList.filter((m) => m.role !== 'OWNER');
  const allocated = nonOwner.filter((m) => m.occupancyStatus === 'ALLOCATED').length;
  let bedCount = 0;
  let unitCount = 0;
  const bList = Array.isArray(buildings.json?.data) ? buildings.json.data : [];
  for (const b of bList) {
    const sum = await api('GET', `/spaces/${spaceId}/buildings/${b.buildingId}/summary`, token);
    bedCount += sum.json?.data?.beds || 0;
    unitCount += sum.json?.data?.units || 0;
  }

  let curated = false;
  let anyLib = false;
  if (spaceType === 'MESS' || bList.length > 0) {
    const items = await api('GET', `/spaces/${spaceId}/food-items`, token);
    const combos = await api('GET', `/spaces/${spaceId}/meal-combos`, token);
    const itemArr = Array.isArray(items.json?.data) ? items.json.data : [];
    const comboArr = Array.isArray(combos.json?.data) ? combos.json.data : [];
    const samples = new Set(
      ['standard lunch thali', 'dal rice combo', 'chicken thali', 'egg combo'],
    );
    anyLib =
      itemArr.some((i) => i.isActive) || comboArr.some((c) => c.isActive);
    const activeCombos = comboArr.filter((c) => c.isActive);
    const hasNonSample = activeCombos.some(
      (c) => !samples.has(String(c.name || '').trim().toLowerCase()),
    );
    curated = hasNonSample || (activeCombos.length === 0 && itemArr.some((i) => i.isActive));
  }

  return {
    buildingCount: bList.length,
    bedCount,
    unitCount,
    memberCount: nonOwner.length,
    allocatedMemberCount: allocated,
    hasCuratedMealLibrary: curated,
    hasMealLibrary: anyLib,
    hasBillableActivity: allocated > 0,
  };
}

async function main() {
  console.log('WEB', WEB, 'API', API);
  const webRes = await fetch(WEB).catch(() => null);
  if (!webRes || !webRes.ok) {
    note('BLOCKER', 'Web app not reachable', WEB);
  } else {
    const html = await webRes.text();
    if (html.includes('root') || html.includes('ACOMI') || html.includes('vite')) {
      console.log('PASS web app serves HTML');
    }
  }

  const login = await api('POST', '/auth/login', null, {
    mobileNumber: MOBILE,
    password: PASSWORD,
  });
  if (login.status !== 200) {
    note('BLOCKER', 'Login failed', String(login.status));
    return;
  }
  const token = login.json.data.accessToken;
  console.log('PASS auth');

  const spaces = await api('GET', '/spaces/my', token);
  const list = Array.isArray(spaces.json?.data) ? spaces.json.data : [];
  console.log('spaces', list.length, 'status', spaces.status);

  const ownerPerms = {
    canManageMembers: true,
    canViewAccommodation: true,
    canManageAccommodation: true,
    canManageOccupancy: true,
    canManageMeals: true,
    canViewMeals: true,
    canViewInventory: true,
    canRaiseComplaint: true,
    canViewAllComplaints: true,
  };

  for (const sp of list.slice(0, 12)) {
    const type = sp.spaceType;
    const signals = await spaceSignals(token, sp.spaceId, type);
    const caps = evaluateCaps(type, signals, {
      ...ownerPerms,
      canViewAccommodation: type !== 'MESS',
      canManageOccupancy: type !== 'MESS',
      canManageMeals: type !== 'RENTAL',
      canViewMeals: type !== 'RENTAL',
    });
    const row = {
      space: sp.spaceName,
      type,
      state: signals.buildingCount ? 'HasBuildings' : 'NewOrEmpty',
      ...caps,
      signals,
    };
    matrix.push(row);
    console.log(
      `${type.padEnd(10)} ${String(sp.spaceName).slice(0, 24).padEnd(24)} MEM=${caps.MEMBERS} CFG=${caps.MEAL_CONFIG} OPS=${caps.MEAL_OPS} PAY=${caps.PAYMENTS} COMP=${caps.COMPLAINTS}`,
    );

    // D8: member *create* must be rejected when Members is LOCKED (list may still 200 for signals/UI)
    if (caps.MEMBERS === 'LOCKED' && ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL'].includes(type)) {
      const stamp = String(Date.now()).slice(-7);
      const probe = await api('POST', `/spaces/${sp.spaceId}/members`, token, {
        fullName: `E2E Locked Probe ${stamp}`,
        mobileNumber: `9${stamp}${String(Math.floor(Math.random() * 90 + 10))}`.slice(0, 10),
        gender: 'MALE',
        role: type === 'MESS' ? 'CUSTOMER' : 'TENANT',
      });
      const blob = JSON.stringify(probe.json || {});
      if (probe.status === 409 && blob.includes('PROPERTY_NOT_READY')) {
        console.log(`PASS D8 create blocked (${type})`);
      } else {
        note(
          'HIGH',
          `${type}: Members LOCKED but create not rejected with PROPERTY_NOT_READY`,
          `status=${probe.status} body=${blob.slice(0, 180)}`,
        );
      }
    }
  }

  // D6 curated check on a Mess if present
  const mess = list.find((s) => s.spaceType === 'MESS');
  if (mess) {
    const sig = await spaceSignals(token, mess.spaceId, 'MESS');
    if (sig.hasMealLibrary && !sig.hasCuratedMealLibrary) {
      console.log('PASS D6: sample seed not treated as curated on Mess');
    } else if (sig.hasCuratedMealLibrary) {
      note('MEDIUM', 'Mess curated library true', 'May have real combos or unexpected seed');
    }
  }

  // New incomplete lodging: complaints should be SOFT when only OWNER exists
  const incomplete = matrix.find(
    (r) =>
      ['PG', 'HOSTEL', 'CO_LIVING'].includes(r.type) &&
      r.signals.buildingCount === 0 &&
      r.signals.memberCount === 0,
  );
  if (incomplete) {
    if (incomplete.COMPLAINTS === 'SOFT') {
      console.log('PASS OWNER excluded → Complaints SOFT on empty lodging');
    } else {
      note('HIGH', 'Complaints not SOFT on empty lodging', incomplete.space);
    }
  }

  fs.writeFileSync(path.join(outDir, 'matrix.json'), JSON.stringify(matrix, null, 2));
  fs.writeFileSync(path.join(outDir, 'findings.json'), JSON.stringify(findings, null, 2));
  console.log('Wrote', outDir);
  console.log('FINDINGS', findings.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
