// Static guard for "HTML-like text is not executable in the UI".
// Node has no DOM, so this scans web/ source for HTML-injection sinks.
// The UI must render user/agent text with textContent, value, or createElement.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { repoRoot } from './helpers.js';

const webDir = join(repoRoot, 'web');

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? listFiles(p) : [p];
  });
}

function scriptSources() {
  const out = [];
  for (const file of listFiles(webDir)) {
    const src = readFileSync(file, 'utf8');
    if (/\.(m?js)$/.test(file)) out.push({ file, code: src });
    else if (/\.html?$/.test(file)) {
      for (const m of src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) out.push({ file, code: m[1] });
      for (const m of src.matchAll(/\son[a-z]+\s*=\s*["'][^"']*["']/gi)) out.push({ file, code: m[0], inlineHandler: true });
    }
  }
  return out;
}

test('web/ exists and contains UI code', () => {
  assert.ok(existsSync(webDir), 'web/ directory must exist');
  assert.ok(existsSync(join(webDir, 'handoff.js')), 'web/handoff.js must exist');
  assert.ok(listFiles(webDir).some((f) => /\.html?$/.test(f)), 'web/ must contain an HTML page');
});

test('no HTML-injection sinks in web/ scripts', () => {
  const sinks = [
    // innerHTML/outerHTML assignment, except clearing with an empty literal
    { name: 'innerHTML/outerHTML assignment', re: /\.(inner|outer)HTML\s*\+?=(?!=)\s*(?!(['"`])\2\s*[;,)\n])/ },
    { name: 'insertAdjacentHTML', re: /insertAdjacentHTML\s*\(/ },
    { name: 'document.write', re: /document\.write(ln)?\s*\(/ },
    { name: 'eval', re: /(^|[^.\w])eval\s*\(/ },
    { name: 'new Function', re: /new\s+Function\s*\(/ },
    { name: 'createContextualFragment', re: /createContextualFragment\s*\(/ },
    { name: 'DOMParser text/html', re: /parseFromString\s*\([^)]*text\/html/ },
  ];
  const hits = [];
  for (const { file, code, inlineHandler } of scriptSources()) {
    const where = relative(repoRoot, file);
    if (inlineHandler) {
      hits.push(`${where}: inline event handler ${code.trim()}`);
      continue;
    }
    for (const { name, re } of sinks) if (re.test(code)) hits.push(`${where}: ${name}`);
  }
  assert.deepEqual(hits, []);
});

// The only network use allowed is the same-origin local draft endpoint (POST /api/draft
// on web/server.py); records must not be sent anywhere else or persisted.
test('no network transmission except same-origin /api/draft, and no persistent storage', () => {
  const banned = [
    { name: 'fetch other than /api/draft', re: /(^|[^.\w])fetch\s*\((?!\s*['"`]\/api\/draft['"`])/ },
    { name: 'XMLHttpRequest', re: /XMLHttpRequest/ },
    { name: 'sendBeacon', re: /sendBeacon/ },
    { name: 'WebSocket', re: /new\s+WebSocket/ },
    { name: 'localStorage', re: /localStorage/ },
    { name: 'sessionStorage', re: /sessionStorage/ },
    { name: 'indexedDB', re: /indexedDB/ },
    { name: 'document.cookie', re: /document\.cookie/ },
  ];
  const hits = [];
  for (const { file, code, inlineHandler } of scriptSources()) {
    if (inlineHandler) continue;
    for (const { name, re } of banned) if (re.test(code)) hits.push(`${relative(repoRoot, file)}: ${name}`);
  }
  assert.deepEqual(hits, []);
});

test('Content-Security-Policy keeps connections to this origin only', () => {
  const html = readFileSync(join(webDir, 'index.html'), 'utf8');
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i);
  assert.ok(csp, 'index.html declares a CSP');
  const connect = csp[1].match(/connect-src\s+([^;]*)/);
  assert.ok(connect, 'CSP sets connect-src (default-src alone may be loosened later)');
  assert.ok(["'none'", "'self'"].includes(connect[1].trim()), `connect-src is ${connect[1].trim()}`);
});
