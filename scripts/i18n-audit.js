#!/usr/bin/env node
/**
 * i18n audit — plain Node, no dependencies.
 *
 * Report-only. Never writes, deletes, or modifies any file in the repo.
 *
 * What it checks:
 *   1. Every data-i18n / data-i18n-html / data-i18n-attr key referenced in
 *      the .html files, cross-checked against assets/i18n/en.json.
 *      -> keys used in HTML but missing from en.json (broken bindings).
 *   2. Keys present in en.json but not referenced by any scanned HTML file
 *      -> "possibly unused". IMPORTANT CAVEAT: this scan only finds keys
 *      referenced as a literal string in a data-i18n* attribute. A key
 *      built or looked up dynamically at runtime (e.g. constructed in JS,
 *      or `data-i18n="` + variable + `"`) will NOT be detected as used and
 *      will show up here as a false positive. Nothing in this codebase
 *      does that today, but if it ever does, or if a key is intentionally
 *      reserved for future/CMS-driven content, this list needs a human to
 *      confirm before anything is removed. Do not delete keys just because
 *      this script lists them.
 *   3. Key parity between en.json (source of truth) and es.json / fr.json:
 *      keys missing from each target (expected — that's the translation
 *      queue) and keys present in a target but no longer in en.json
 *      (orphaned translations, safe to ignore or clean up later).
 *
 * Usage: node scripts/i18n-audit.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const I18N_DIR = path.join(ROOT, 'assets', 'i18n');
const EN_PATH = path.join(I18N_DIR, 'en.json');

// Directories we never want to walk into.
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scss']);

function findHtmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...findHtmlFiles(path.join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse ${path.relative(ROOT, filePath)}: ${err.message}`);
    process.exitCode = 0; // report-only: never fail the run, just surface it
    return null;
  }
}

// Extracts every key referenced via data-i18n="", data-i18n-html="", or
// data-i18n-attr="attr:key,attr2:key2" in one HTML source string.
function extractKeys(html) {
  const keys = new Set();

  const simpleRe = /data-i18n(?:-html)?\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = simpleRe.exec(html))) keys.add(m[1].trim());

  const attrRe = /data-i18n-attr\s*=\s*"([^"]+)"/g;
  while ((m = attrRe.exec(html))) {
    m[1].split(',').forEach((pair) => {
      const parts = pair.split(':');
      const key = (parts[1] || '').trim();
      if (key) keys.add(key);
    });
  }

  return keys;
}

function main() {
  const en = loadJson(EN_PATH);
  if (!en) {
    console.error(`Could not load ${path.relative(ROOT, EN_PATH)} — aborting audit.`);
    return;
  }
  const enKeys = new Set(Object.keys(en));

  const htmlFiles = findHtmlFiles(ROOT).sort();
  const usedKeys = new Map(); // key -> [files]

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    for (const key of extractKeys(html)) {
      if (!usedKeys.has(key)) usedKeys.set(key, []);
      usedKeys.get(key).push(rel);
    }
  }

  console.log('='.repeat(70));
  console.log('i18n audit — report only, nothing on disk was changed');
  console.log('='.repeat(70));
  console.log(`\nScanned ${htmlFiles.length} .html file(s):`);
  htmlFiles.forEach((f) => console.log(`  - ${path.relative(ROOT, f)}`));

  // 1. Used in HTML but missing from en.json
  const missingFromEn = [...usedKeys.keys()].filter((k) => !enKeys.has(k)).sort();
  console.log(`\n--- Keys used in HTML but missing from en.json (${missingFromEn.length}) ---`);
  if (missingFromEn.length === 0) {
    console.log('  none');
  } else {
    missingFromEn.forEach((k) => {
      console.log(`  "${k}"`);
      usedKeys.get(k).forEach((f) => console.log(`      used in ${f}`));
    });
  }

  // 2. In en.json but not referenced by any scanned HTML
  const unused = [...enKeys].filter((k) => !usedKeys.has(k)).sort();
  console.log(`\n--- Keys in en.json not referenced by any HTML file (${unused.length}) ---`);
  console.log('  Caveat: dynamically referenced keys are invisible to a static scan');
  console.log('  like this one. Treat this list as a starting point for human review,');
  console.log('  not a delete list.');
  if (unused.length === 0) {
    console.log('  none');
  } else {
    unused.forEach((k) => console.log(`  "${k}"`));
  }

  // 3. Key parity between en.json and each target locale
  const targets = ['es.json', 'fr.json', 'zh-tw.json'];
  for (const targetName of targets) {
    const targetPath = path.join(I18N_DIR, targetName);
    const target = loadJson(targetPath);
    console.log(`\n--- Key parity: en.json vs ${targetName} ---`);
    if (!target) {
      console.log(`  ${targetName} not found or invalid — skipped.`);
      continue;
    }
    const targetKeys = new Set(Object.keys(target));
    const missingFromTarget = [...enKeys].filter((k) => !targetKeys.has(k)).sort();
    const extraInTarget = [...targetKeys].filter((k) => !enKeys.has(k)).sort();

    console.log(`  In en.json but missing from ${targetName} (${missingFromTarget.length}) — translation queue:`);
    missingFromTarget.forEach((k) => console.log(`    "${k}"`));
    if (missingFromTarget.length === 0) console.log('    none');

    console.log(`  In ${targetName} but not in en.json (${extraInTarget.length}) — orphaned, safe to ignore or clean up:`);
    extraInTarget.forEach((k) => console.log(`    "${k}"`));
    if (extraInTarget.length === 0) console.log('    none');
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('Done. This script never writes to disk — act on findings by hand.');
  console.log('='.repeat(70));
}

main();
