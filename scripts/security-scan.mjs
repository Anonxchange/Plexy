#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const failOnHigh = process.argv.includes('--fail-on-high');
const INCLUDED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const SKIP_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  'attached_assets',
]);
const SKIP_FILES = new Set(['scripts/security-scan.mjs']);

const rules = [
  {
    id: 'dynamic-eval',
    severity: 'high',
    regex: /\beval\s*\(/g,
    message: 'Avoid eval(). It enables code injection.',
  },
  {
    id: 'function-constructor',
    severity: 'high',
    regex: /\bnew\s+Function\s*\(/g,
    message: 'Avoid new Function(). It behaves like eval().',
  },
  {
    id: 'browser-html-injection',
    severity: 'high',
    regex: /\b(innerHTML|outerHTML|insertAdjacentHTML)\s*=/g,
    message: 'Potential DOM XSS sink. Ensure sanitization before assignment.',
  },
  {
    id: 'dangerously-set-inner-html',
    severity: 'high',
    regex: /dangerouslySetInnerHTML/g,
    message: 'Review dangerouslySetInnerHTML usage and sanitize content.',
  },
  {
    id: 'child-process-shell',
    severity: 'high',
    regex: /\b(exec|spawn|execSync|spawnSync)\s*\(/g,
    message: 'Review process execution with untrusted input.',
  },
  {
    id: 'insecure-random',
    severity: 'medium',
    regex: /\bMath\.random\s*\(/g,
    message: 'Use a cryptographic RNG for auth/session/security-sensitive values.',
  },
  {
    id: 'jwt-none-alg',
    severity: 'high',
    regex: /alg\s*:\s*['\"]none['\"]/gi,
    message: 'Never use JWT algorithm "none".',
  },
  {
    id: 'hardcoded-secret-marker',
    severity: 'high',
    regex: /\b(?:api[_-]?key|secret|token|private[_-]?key|password)\b\s*[:=]\s*['\"][^'\"]{16,}['\"]/gi,
    message: 'Potential hardcoded secret. Move to environment variables.',
  },
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      if (!SKIP_DIRECTORIES.has(entry)) walk(full, files);
      continue;
    }

    if (INCLUDED_EXTENSIONS.has(extname(entry))) files.push(full);
  }
  return files;
}

function lineNumberFromIndex(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content[i] === '\n') line += 1;
  }
  return line;
}

const candidateFiles = walk(ROOT);
const findings = [];
const seen = new Set();

for (const file of candidateFiles) {
  const relativeFile = file.replace(`${ROOT}/`, '');
  if (SKIP_FILES.has(relativeFile)) continue;

  const text = readFileSync(file, 'utf8');
  for (const rule of rules) {
    rule.regex.lastIndex = 0;
    let match = rule.regex.exec(text);

    while (match) {
      const line = lineNumberFromIndex(text, match.index);
      const key = `${relativeFile}:${line}:${rule.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({
          file: relativeFile,
          line,
          rule: rule.id,
          severity: rule.severity,
          message: rule.message,
        });
      }
      match = rule.regex.exec(text);
    }
  }
}

const severityRank = { high: 1, medium: 2, low: 3 };
findings.sort((a, b) => {
  const severityDiff = severityRank[a.severity] - severityRank[b.severity];
  if (severityDiff !== 0) return severityDiff;
  if (a.file === b.file) return a.line - b.line;
  return a.file.localeCompare(b.file);
});

if (findings.length === 0) {
  console.log('Security scan passed: no matching risky patterns found.');
  process.exit(0);
}

const highCount = findings.filter((item) => item.severity === 'high').length;
const mediumCount = findings.filter((item) => item.severity === 'medium').length;

console.log(
  `Security scan completed: ${highCount} high, ${mediumCount} medium finding(s).` +
    (failOnHigh ? ' Failing due to --fail-on-high.' : ' Review findings below.'),
);

for (const finding of findings) {
  console.log(
    `- [${finding.severity}] ${finding.file}:${finding.line} (${finding.rule}) ${finding.message}`,
  );
}

if (failOnHigh && highCount > 0) process.exit(1);
process.exit(0);
