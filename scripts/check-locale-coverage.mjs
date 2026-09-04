/**
 * Assert hi/mr contain every English leaf key (Web).
 * Usage: node scripts/check-locale-coverage.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function leafKeys(value, prefix = '') {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(localesDir, name), 'utf8'));
}

function interpolationTokens(value) {
  if (typeof value !== 'string') return [];
  return [...value.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1]).sort();
}

function valueAtPath(tree, pathStr) {
  return pathStr.split('.').reduce((current, segment) => {
    if (current == null || typeof current !== 'object') return undefined;
    return current[segment];
  }, tree);
}

const en = load('en.json');
const hi = load('hi.json');
const mr = load('mr.json');
const enKeys = leafKeys(en);
const hiSet = new Set(leafKeys(hi));
const mrSet = new Set(leafKeys(mr));
const missingHi = enKeys.filter(k => !hiSet.has(k));
const missingMr = enKeys.filter(k => !mrSet.has(k));

const tokenMismatches = [];
for (const key of enKeys) {
  const source = valueAtPath(en, key);
  if (typeof source !== 'string') continue;
  const hiVal = valueAtPath(hi, key);
  const mrVal = valueAtPath(mr, key);
  const expected = interpolationTokens(source).join(',');
  if (interpolationTokens(hiVal).join(',') !== expected) {
    tokenMismatches.push({ key, locale: 'hi' });
  }
  if (interpolationTokens(mrVal).join(',') !== expected) {
    tokenMismatches.push({ key, locale: 'mr' });
  }
}

const report = {
  en: enKeys.length,
  hiPresent: enKeys.length - missingHi.length,
  mrPresent: enKeys.length - missingMr.length,
  missingHi: missingHi.length,
  missingMr: missingMr.length,
  tokenMismatches: tokenMismatches.length,
  hiCoveragePct: +((100 * (enKeys.length - missingHi.length)) / enKeys.length).toFixed(2),
  mrCoveragePct: +((100 * (enKeys.length - missingMr.length)) / enKeys.length).toFixed(2),
};

console.log(JSON.stringify(report, null, 2));

if (missingHi.length || missingMr.length || tokenMismatches.length) {
  if (missingHi.length) console.error('Missing Hindi sample:', missingHi.slice(0, 20));
  if (missingMr.length) console.error('Missing Marathi sample:', missingMr.slice(0, 20));
  if (tokenMismatches.length) {
    console.error('Token mismatch sample:', tokenMismatches.slice(0, 20));
  }
  process.exit(1);
}

console.log('Locale coverage OK');
