---
name: security_scan
description: Run runDependencyAudit, runSastScan, and runHoundDogScan and return a concise, prioritized security summary with critical/high findings first. Must use this skill if security scanning is explicitly requested by the user.
---

# Security Scan Skill

Run three independent scanners and summarize results:

- `runDependencyAudit()` for package/dependency vulnerabilities
- `runSastScan()` for static code findings
- `runHoundDogScan()` for privacy/security dataflow findings

## Orchestration

For full scans, run scanners in parallel and tolerate per-scanner failures.

```javascript
const [depResult, sastResult, hounddogResult] = await Promise.allSettled([
  runDependencyAudit(),
  runSastScan(),
  runHoundDogScan(),
]);

const dep = depResult.status === 'fulfilled' ? depResult.value : null;
const sast = sastResult.status === 'fulfilled' ? sastResult.value : null;
const hounddog =
  hounddogResult.status === 'fulfilled' ? hounddogResult.value : null;
```

Do not fail the whole scan because one scanner errors.

## Minimal Response Shape

- `runDependencyAudit()`
  - `metadata.vulnerabilities`: `{ info, low, moderate, high, critical }`
  - `vulnerabilities[]`: `id`, `package`, `severity`, `fix`, `source`
- `runSastScan()`
  - `results[]`: `checkId`, `message`, `severity`, `fingerprint`, `location`
- `runHoundDogScan()`
  - `vulnerabilities[]`: `hash`, `ruleIds`, `message`, `severity`, `location`, `privacyViolations`, `remediation*`

## Reporting Findings

After analysis is complete, call `reportVulnerabilities` with the file paths of all
vulnerability files in `.local/potential_vulnerabilities/`. Each file **must** use YAML
front-matter with `title`, `level`, and optionally `file_ranges`:

```yaml
---
title: "Hardcoded database credentials"
level: critical
file_ranges:
  - filepath: "config/database.py"
    range_start: 1
    range_end: 2
---
Description of the vulnerability.
```

Call the callback via code execution:

```javascript
await reportVulnerabilities([
  { filePath: ".local/potential_vulnerabilities/hardcoded-secrets-database.md" },
  { filePath: ".local/potential_vulnerabilities/sql-injection-login.md" },
]);
```

This emits a `ProposedVulnerabilitiesEventData` event for the UI. **Call this after
writing vulnerability files** — writing the files alone is not sufficient to surface
findings to the user. If the scan finds no vulnerabilities, skip this callback.

## Output Expectations

Return concise results instead of dumping full payloads:

1. Per scanner: status (`ok` or `error`) and count by severity.
2. Top critical/high findings with file path and short message.
3. A short remediation plan, with risky/breaking changes clearly called out.
