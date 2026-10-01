/**
 * Card fXsYG2R1 (parent 8VXvUrQ5 census) — `google-github-actions/auth` writes
 * `gha-creds-<hash>.json` into the workspace, and this repo's Hosting `public` is `.` (the workspace
 * root), so `firebase hosting:channel:deploy` would upload it. The file is an `external_account`
 * config (no private key), but it is still a standing trust finding on a public URL.
 *
 * Fix is `gha-creds-*.json` in `hosting.ignore`. Note: setting `ignore` REPLACES Firebase's defaults,
 * so the existing entries must survive — asserted below.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const hosting = JSON.parse(readFileSync(path.join(ROOT, 'firebase.json'), 'utf8')).hosting;

// Same matching idea as Firebase's glob for a root-level file; kept literal so the test has no deps.
export function ignores(ignoreList, file) {
  return ignoreList.some((g) => {
    if (g === file) return true;
    const re = new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$');
    return re.test(file);
  });
}

test('KNOWN-POSITIVE: the current config ignores a generated gha-creds file at the workspace root', () => {
  assert.equal(hosting.public, '.', 'premise: Hosting serves the workspace root, so the file would otherwise be uploaded');
  assert.ok(ignores(hosting.ignore, 'gha-creds-0123456789abcdef.json'));
});

test('KNOWN-NEGATIVE: the matcher is not a blanket — the site itself is still deployed', () => {
  for (const f of ['index.html', 'tests.html', 'creds.json', 'gha-creds.txt']) assert.ok(!ignores(hosting.ignore, f), f);
});

test('CONTROL: the pre-fix ignore list would NOT have excluded it (the test can fail)', () => {
  const before = hosting.ignore.filter((g) => g !== 'gha-creds-*.json');
  assert.ok(!ignores(before, 'gha-creds-0123456789abcdef.json'));
});

test('the Firebase defaults this config keeps are still present (ignore REPLACES defaults)', () => {
  for (const d of ['firebase.json', '**/.*', '**/node_modules/**']) assert.ok(hosting.ignore.includes(d), d);
});
