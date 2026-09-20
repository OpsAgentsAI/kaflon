/**
 * 09PBYCJY rule 2 — NO `pull_request`-reachable job may mint a cloud identity,
 * on ANY runner. Card vPrDDPM3.
 *
 * WHAT WENT WRONG HERE, recorded so the shape stays refused: `deploy.yml` had
 * ONE `deploy_preview` job, `id-token: write` at WORKFLOW level, triggering on
 * `pull_request` (opened/reopened/synchronize), authenticating to
 * `kaflon-deployer@kaflon-prod`.
 *
 * ⚠️ And it carried NO fork guard at all. On most repos an absent fork guard is
 * softened because fork PRs get no secrets, so a `secrets.WIF_PROVIDER` reference
 * resolves empty and auth fails. THAT DID NOT APPLY HERE: the provider and the
 * service account were hardcoded literals in `env:`, so the auth step needed no
 * secret — the same sharp shape found on opsagents-ilcf-medinfo (j2gmJo6j) and
 * msapps-lead-pipeline (uHaeFibd), whose fix this file follows verbatim.
 *
 * This test FAILS CLOSED in both directions: a job it cannot classify is a
 * violation, AND it asserts its corpus is non-empty and that it can still see a
 * known WIF job. A regex guard whose parser silently stops matching otherwise
 * passes vacuously — worse than no guard, because it occupies the slot.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  workflowFiles, load, jobsOf, jobIdToken, usesCloudAuth,
  triggersOf, workflowRunParents, workflowName, strip,
} from './lib/workflow-parse.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = workflowFiles(REPO);
const codeOf = Object.fromEntries(files.map((f) => [f, load(REPO, f)]));
const nameToFile = Object.fromEntries(
  files.map((f) => [workflowName(codeOf[f]), f]).filter(([n]) => n),
);

/** Transitive: a `workflow_run` hop off a PR-triggered workflow is still PR-reachable. */
const prReachable = (() => {
  const s = new Set(files.filter((f) => {
    const t = triggersOf(codeOf[f]);
    return t.includes('pull_request') || t.includes('pull_request_target');
  }));
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of files) {
      if (s.has(f)) continue;
      if (workflowRunParents(codeOf[f]).some((p) => s.has(nameToFile[p]))) { s.add(f); grew = true; }
    }
  }
  return s;
})();

test('the workflow corpus is actually being read (no vacuous pass)', () => {
  assert.ok(files.length >= 2, `expected this repo's workflows, found ${files.length}`);
  assert.ok(prReachable.size >= 1, 'no PR-reachable workflow found — the trigger parser has stopped matching');
  // If the parser can no longer see the ONE known WIF job in the repo, every
  // assertion below is meaningless and must not read as a pass.
  const c = codeOf['deploy.yml'];
  const seen = jobsOf(c).filter((j) => jobIdToken(j, c) && usesCloudAuth(j));
  assert.equal(seen.length, 1, 'parser can no longer see the WIF job in deploy.yml');
});

test('no pull_request-reachable job mints a cloud identity (09PBYCJY rule 2)', () => {
  const violations = [];
  for (const f of files) {
    if (!prReachable.has(f)) continue;
    for (const job of jobsOf(codeOf[f])) {
      if (jobIdToken(job, codeOf[f]) || usesCloudAuth(job)) {
        violations.push(`${f} · ${job.name}: reachable from pull_request and holds id-token/cloud-auth`);
      }
    }
  }
  assert.deepEqual(violations, [], `09PBYCJY rule 2 violations:\n  ${violations.join('\n  ')}`);
});

test('test.yml is the identity-free PR lane, and runs this guard', () => {
  const code = codeOf['test.yml'];
  assert.ok(triggersOf(code).includes('pull_request'), 'it should still be the PR lane');
  assert.ok(!/^permissions:[\s\S]*?^ {2}id-token:/m.test(code),
    'workflow-level `id-token: write` appeared here — that would defeat the split');

  const guard = jobsOf(code).find((j) => j.name === 'wif-pr-reachability');
  assert.ok(guard, '`wif-pr-reachability` job is gone — pull_request would have no identity-free enforcement');
  assert.equal(jobIdToken(guard, code), false, '`wif-pr-reachability` must hold no id-token');
  assert.equal(usesCloudAuth(guard), false, '`wif-pr-reachability` must not authenticate');
  assert.match(guard.text, /node --test scripts\/wif-pr-reachability\.test\.mjs/,
    '`wif-pr-reachability` no longer runs this guard — nothing would enforce rule 2 on a PR');

  const unit = jobsOf(code).find((j) => j.name === 'unit');
  assert.ok(unit, '`unit` job (the real Chromium test suite) is gone');
  assert.equal(jobIdToken(unit, code), false, '`unit` must hold no id-token');
});

test('the preview deploy lives in a workflow with NO pull_request trigger', () => {
  // ⚠️ This is the STRUCTURAL control, and it is why the deploy is not simply
  // gated by `if: github.event_name == 'workflow_dispatch'` inside the PR
  // workflow. On a same-repo `pull_request`, GitHub evaluates the workflow file
  // FROM THE PR HEAD, so a PR that deletes that one `if:` line runs the deploy
  // job as that PR, with the prod identity. A gate a PR can edit is not a gate
  // against a PR.
  const code = codeOf['deploy.yml'];
  const t = triggersOf(code);
  assert.ok(!t.includes('pull_request') && !t.includes('pull_request_target'),
    `deploy.yml gained a PR trigger (${t.join(',')}) — that re-opens card vPrDDPM3`);
  assert.ok(t.includes('workflow_dispatch'), 'deploy.yml must remain dispatch-only');

  const deploy = jobsOf(code).find((j) => j.name === 'deploy_preview');
  assert.ok(deploy, '`deploy_preview` job is gone');
  assert.match(deploy.text, /^ {4}permissions:/m, '`deploy_preview` must declare its own permissions block');
  assert.equal(jobIdToken(deploy, code), true, '`deploy_preview` needs id-token to authenticate');
  assert.ok(!/^permissions:[\s\S]*?^ {2}id-token:/m.test(code),
    'id-token must be job-level here too, so a future job in this file does not inherit it');
});

test('deploy.yml verify-pr is a VERIFIED dispatch gate, and holds no identity', () => {
  const code = codeOf['deploy.yml'];
  assert.deepEqual(triggersOf(code), ['workflow_dispatch'],
    'deploy.yml must be dispatch-only');

  const verify = jobsOf(code).find((j) => j.name === 'verify-pr');
  assert.ok(verify, 'verify-pr is gone — nothing checks the PR before the identity job runs');
  assert.equal(jobIdToken(verify, code), false, 'verify-pr must hold NO id-token');
  assert.equal(usesCloudAuth(verify), false, 'verify-pr must not authenticate');

  // The refusals ARE the mechanism. `strip()` removes full-line comments first,
  // so prose describing a check cannot satisfy these. Gate check-run name
  // measured LIVE via `gh api .../check-runs` against a real kaflon PR head —
  // it is the job's `name:` field in test.yml ("Run tests.html in headless
  // Chromium"), NOT the yaml job key ("unit") and NOT "validate" (the medinfo
  // precedent's name — repo-specific, not reusable).
  for (const [re, what] of [
    [/\$STATE"\s*=\s*"open"/, 'the PR is open'],
    [/\$HEAD_REPO"\s*=\s*"\$GITHUB_REPOSITORY"/, 'the head is same-repo (not a fork)'],
    [/\$HEAD_SHA"\s*=\s*"\$WANT_SHA"/, 'the live head still equals the dispatched sha'],
    [/\$CONC"\s*=\s*"success"/, 'the PR gate is green on that sha'],
    [/Run tests\.html in headless Chromium/, 'the gate check-run name is the measured one, not a guess'],
  ]) assert.match(verify.text, re, `verify-pr no longer refuses on: ${what}`);

  const deploy = jobsOf(code).find((j) => j.name === 'deploy_preview');
  assert.match(deploy.text, /ref: \$\{\{ needs\.verify-pr\.outputs\.head_sha \}\}/,
    'the deploy_preview job must check out the VERIFIED sha, never the moving branch');
});

/**
 * Bounce finding — G3 trap: `firebase hosting:channel:deploy` without
 * `--no-authorized-domains` PATCHes kaflon-prod's Identity Platform
 * `authorizedDomains` on every deploy (QR5Q8Hyk / training-console#18 and
 * opsagents-ilcf-medinfo#9 closed the same class). Joins backslash-continued
 * shell lines first so the flag can land on a later line.
 */
function authDomainSyncs(code) {
  const joined = code.replace(/\\\n\s*/g, ' ');
  const found = [];
  for (const line of joined.split('\n')) {
    if (/hosting:channel:(deploy|create|delete)\b/.test(line) && !/--no-authorized-domains\b/.test(line)) {
      found.push(line.trim());
    }
    if (/identitytoolkit|authorizedDomains/i.test(line)) found.push(line.trim());
  }
  return found;
}

for (const f of files) {
  test(`${f}: no channel deploy syncs Firebase Auth authorizedDomains`, () => {
    assert.deepEqual(authDomainSyncs(codeOf[f]), []);
  });
}

test('CONTROL: authDomainSyncs sees the flag across a line continuation, and reds a bare UpdateConfig call', () => {
  assert.deepEqual(
    authDomainSyncs('      run: |\n        firebase hosting:channel:deploy x \\\n          --expires 7d \\\n          --no-authorized-domains\n'),
    [],
  );
  assert.equal(
    authDomainSyncs('      run: curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/p/config?updateMask=authorizedDomains"\n').length,
    1,
  );
});

test('RED-FIRST: a channel deploy missing --no-authorized-domains is a violation', () => {
  const missing = 'firebase hosting:channel:deploy "$CHANNEL" --project kaflon-prod --expires 7d --non-interactive --json > preview.json';
  assert.equal(authDomainSyncs(missing).length, 1, 'fixture must trip the guard — this is the exact pre-fix line');
});

test('RED-FIRST: the pre-fix shape is detected as a violation', () => {
  // The exact shape on main before this card: one job, workflow-level id-token,
  // pull_request only, no fork guard, hardcoded provider and SA.
  const OLD = strip(`
name: Preview deploy (PRs)
on:
  pull_request:
    types: [opened, reopened, synchronize]
permissions:
  contents: read
  id-token: write
  pull-requests: write
env:
  WIF_PROVIDER: projects/408696318105/locations/global/workloadIdentityPools/github-actions-pool/providers/github-oidc
  WIF_SA: kaflon-deployer@kaflon-prod.iam.gserviceaccount.com
jobs:
  deploy_preview:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: \${{ env.WIF_PROVIDER }}
          service_account: \${{ env.WIF_SA }}
`);
  assert.ok(triggersOf(OLD).includes('pull_request'), 'fixture must be PR-triggered');
  const deploy = jobsOf(OLD).find((j) => j.name === 'deploy_preview');
  assert.equal(jobIdToken(deploy, OLD), true, 'fixture: deploy_preview inherits the workflow-level id-token — the defect');
  assert.equal(usesCloudAuth(deploy), true, 'fixture: deploy_preview authenticates');
  // And the detail that made this repo the sharp case: no secret was needed.
  assert.ok(!/secrets\./.test(deploy.text),
    'fixture: the provider and SA were hardcoded, so the no-secrets-on-forks mitigation did not apply');
});
