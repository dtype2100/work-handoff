// HTTP checks for the local draft endpoint: POST /api/draft on web/server.py.
// The browser posts {prompt} (from buildPrompt) and gets back {draft} or {error}.
// The server runs on a free loopback port with a fake `claude` first on PATH,
// so no real CLI, quota, key, or network is used.
// All tests skip (not fail) while web/server.py does not exist yet.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, readFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
import { createServer, request } from 'node:http';
import { repoRoot } from './helpers.js';
import { buildPrompt } from '../web/handoff.js';

// ---- Launch contract (the only place to adjust if the server's interface differs) ----
const SERVER_SCRIPT = process.env.WORK_HANDOFF_SERVER_SCRIPT || join(repoRoot, 'web', 'server.py');
const PYTHON = process.env.PYTHON || 'python3';
const serverArgs = (port) => [SERVER_SCRIPT, '--port', String(port)];
const serverEnv = (fakeDir) => ({
  PATH: `${fakeDir}${delimiter}${process.env.PATH}`, // fake `claude` shadows any real one
  WORK_HANDOFF_CLAUDE_TIMEOUT: '2', // seconds before the child is killed (test seam)
  ANTHROPIC_API_KEY: 'sk-ant-test-must-not-reach-cli', // must be stripped before spawning
});
// ----------------------------------------------------------------------------------------

const skip = existsSync(SERVER_SCRIPT) ? false : 'pending: web/server.py not implemented yet';

const SOURCE_MARKER = 'SOURCE-MARKER-7f3a <b>exact</b>\r\n  trailing  ';
const PROMPT = buildPrompt([{ title: 'Log', text: SOURCE_MARKER }]);
const STDERR_SECRET = 'STDERR-SECRET-91c2';
const GOOD_DRAFT = JSON.stringify({
  items: [{ id: 'i1', kind: 'completed', text: 'Marker item.', sources: [{ document_id: 'doc1', quote: 'SOURCE-MARKER-7f3a' }] }],
  warnings: [],
});

let dir, fakeBin, logFile, modeFile, server, port;

// Fake claude: logs argv/stdin/pid as one JSON line, then behaves per mode file.
// If asked for --output-format json it wraps the text like `claude -p` does.
const FAKE_SOURCE = (log, mode) => `#!${process.execPath}
const fs = require('node:fs');
const mode = fs.readFileSync(${JSON.stringify(mode)}, 'utf8').trim();
fs.writeFileSync(${JSON.stringify(log)} + '.pid', String(process.pid));
let stdin = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { stdin += c; });
process.stdin.on('end', () => {
  const argv = process.argv.slice(2);
  const hasApiKey = 'ANTHROPIC_API_KEY' in process.env;
  fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ argv, stdin, pid: process.pid, cwd: process.cwd(), hasApiKey }) + '\\n');
  const i = argv.indexOf('--output-format');
  const fmt = i >= 0 ? argv[i + 1] : (argv.find((a) => a.startsWith('--output-format=')) || '').split('=')[1];
  const emit = (text) => process.stdout.write(fmt === 'json'
    ? JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: text })
    : text);
  if (mode === 'good') emit(${JSON.stringify(GOOD_DRAFT)});
  else if (mode === 'reply-not-json') { emit('not json at all'); process.stderr.write(${JSON.stringify(STDERR_SECRET)}); }
  else if (mode === 'envelope-broken') { process.stdout.write('Error: ' + ${JSON.stringify(STDERR_SECRET)}); }
  else if (mode === 'fail') { process.stderr.write(${JSON.stringify(STDERR_SECRET)}); process.exit(3); }
  else if (mode === 'hang') setTimeout(() => emit(${JSON.stringify(GOOD_DRAFT)}), 60000);
});
`;

function setMode(mode) { writeFileSync(modeFile, mode); }
function invocations() {
  return existsSync(logFile) ? readFileSync(logFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
    s.on('error', reject);
  });
}

// Raw request so Host/Origin/Content-Type can be set to anything.
function send({ method = 'POST', path = '/api/draft', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const h = {
      Host: `127.0.0.1:${port}`,
      Origin: `http://127.0.0.1:${port}`,
      'Content-Type': 'application/json',
      ...(body !== undefined && { 'Content-Length': Buffer.byteLength(body) }), // as browsers send
      ...headers,
    };
    for (const k of Object.keys(h)) if (h[k] === null) delete h[k];
    const req = request({ host: '127.0.0.1', port, method, path, headers: h, setHost: false }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('request timed out')));
    if (body !== undefined) req.write(body);
    req.end();
  });
}

const promptBody = (prompt) => JSON.stringify({ prompt });
const oneDocBody = () => promptBody(PROMPT);

function assertNoLeak(res) {
  assert.ok(!res.body.includes(STDERR_SECRET), 'child stderr must not reach the client');
  assert.ok(!res.body.includes(dir), 'filesystem paths must not reach the client');
  assert.ok(!/Traceback|File ".*\.py", line/.test(res.body), 'no Python stack trace');
}

async function assertRejectedWithoutInvoking(res, statusRange = [400, 499]) {
  assert.ok(res.status >= statusRange[0] && res.status <= statusRange[1], `expected ${statusRange.join('-')}, got ${res.status}`);
  assert.equal(invocations().length, 0, 'claude must not be invoked for a rejected request');
  assertNoLeak(res);
}

before(async () => {
  if (skip) return;
  dir = mkdtempSync(join(tmpdir(), 'handoff-server-'));
  fakeBin = join(dir, 'claude');
  logFile = join(dir, 'invocations.jsonl');
  modeFile = join(dir, 'mode');
  writeFileSync(fakeBin, FAKE_SOURCE(logFile, modeFile));
  chmodSync(fakeBin, 0o755);
  setMode('good');
  port = await freePort();
  server = spawn(PYTHON, serverArgs(port), {
    cwd: repoRoot,
    env: { ...process.env, ...serverEnv(dir) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stdout.on('data', (c) => { output += c; });
  server.stderr.on('data', (c) => { output += c; });
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(`server exited early:\n${output}`);
    try { await send({ method: 'GET', path: '/', body: undefined }); return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`server did not start on port ${port}:\n${output}`);
});

after(() => {
  if (server && server.exitCode === null) server.kill();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

beforeEach(() => {
  if (skip) return;
  rmSync(logFile, { force: true });
  rmSync(logFile + '.pid', { force: true });
  setMode('good');
});

test('valid localhost request runs claude once, source text via stdin only, and returns its draft', { skip }, async () => {
  const res = await send({ body: oneDocBody() });
  assert.equal(res.status, 200, res.body);
  assert.match(res.headers['content-type'] || '', /application\/json/);
  const calls = invocations();
  assert.equal(calls.length, 1);
  const [{ argv, stdin, cwd, hasApiKey }] = calls;
  assert.equal(stdin, PROMPT, 'the prompt reaches claude on stdin byte-for-byte (CRLF, spaces, HTML-like)');
  assert.ok(argv.includes('-p') || argv.includes('--print'), 'runs non-interactive print mode');
  assert.ok(!argv.join(' ').includes('SOURCE-MARKER'), 'source text is never placed in argv (visible in ps)');
  assert.ok(!argv.some((a) => /dangerously|bypassPermissions/i.test(a)), 'does not bypass CLI permissions');
  // Tool isolation: the draft session gets no built-in tools, no MCP servers, no user/project settings or hooks.
  const flagValue = (flag) => {
    const i = argv.indexOf(flag);
    if (i >= 0) return argv[i + 1];
    const eq = argv.find((x) => x.startsWith(`${flag}=`));
    return eq === undefined ? undefined : eq.slice(flag.length + 1);
  };
  assert.equal(flagValue('--tools'), '', "--tools ''");
  assert.ok(argv.includes('--strict-mcp-config'), '--strict-mcp-config');
  assert.equal(flagValue('--setting-sources'), '', "--setting-sources ''");
  assert.equal(hasApiKey, false, 'ANTHROPIC_API_KEY is stripped so no API billing can occur');
  assert.ok(!cwd.startsWith(repoRoot), 'claude runs outside the repo (no project files or CLAUDE.md)');
  assert.equal(JSON.parse(res.body).draft, GOOD_DRAFT, 'raw reply returned unchanged for browser validation');
});

test('Host header must be loopback (DNS-rebinding guard)', { skip }, async () => {
  for (const host of ['evil.example', `evil.example:${port}`, `127.0.0.1.evil.example:${port}`]) {
    await assertRejectedWithoutInvoking(await send({ headers: { Host: host }, body: oneDocBody() }));
  }
  const ok = await send({ headers: { Host: `localhost:${port}`, Origin: `http://localhost:${port}` }, body: oneDocBody() });
  assert.equal(ok.status, 200, 'localhost:<port> is accepted');
});

test('cross-site Origin is rejected', { skip }, async () => {
  for (const origin of ['http://evil.example', `http://127.0.0.1:${port + 1}`, 'null']) {
    await assertRejectedWithoutInvoking(await send({ headers: { Origin: origin }, body: oneDocBody() }));
  }
});

test('non-JSON content type is rejected (blocks simple-form CSRF)', { skip }, async () => {
  for (const type of ['text/plain', 'application/x-www-form-urlencoded', null]) {
    await assertRejectedWithoutInvoking(await send({ headers: { 'Content-Type': type }, body: oneDocBody() }));
  }
});

test('only POST is allowed on /api/draft', { skip }, async () => {
  const res = await send({ method: 'GET' });
  await assertRejectedWithoutInvoking(res);
});

test('malformed or invalid payloads are rejected before claude runs', { skip }, async () => {
  const bodies = [
    '{not json',
    '[]',
    JSON.stringify({}),
    promptBody(''),
    promptBody('   '),
    JSON.stringify({ prompt: 42 }),
    JSON.stringify({ prompt: ['x'] }),
    promptBody('x'.repeat(40001)), // far past any prompt built from 20,000 record characters
  ];
  for (const body of bodies) await assertRejectedWithoutInvoking(await send({ body }));
});

test('a prompt built from the full 20,000-character record allowance is accepted untruncated', { skip }, async () => {
  // Multi-byte and JSON-escaped characters: the server limit must fit what the browser allows.
  // Mostly BMP so the Python code-point count stays near the JS length the browser enforces.
  const text = 'SOURCE-MARKER-7f3a ' + ('가'.repeat(97) + '\u0001😀').repeat(200).slice(0, 20000 - 19);
  const docs = [{ title: '제목'.repeat(50), text: text.slice(0, 7000) }, { title: 'b', text: text.slice(7000, 14000) }, { title: 'c', text: text.slice(14000) }];
  const prompt = buildPrompt(docs);
  const res = await send({ body: promptBody(prompt) });
  assert.equal(res.status, 200, res.body);
  assert.equal(invocations()[0].stdin, prompt);
});

test('oversized request body is refused without buffering it into claude', { skip }, async () => {
  const res = await send({ body: promptBody('x'.repeat(2_000_000)) }).catch((err) => ({ status: 413, body: '', err }));
  await assertRejectedWithoutInvoking(res);
});

test('unreadable CLI output is reported as an error without echoing it', { skip }, async () => {
  setMode('envelope-broken');
  const res = await send({ body: oneDocBody() });
  assert.ok(res.status >= 500, `expected 5xx, got ${res.status}`);
  assert.equal(typeof JSON.parse(res.body).error, 'string');
  assertNoLeak(res);
});

test('a non-JSON reply is passed back verbatim for the browser validator to reject, stderr withheld', { skip }, async () => {
  setMode('reply-not-json');
  const res = await send({ body: oneDocBody() });
  assert.equal(res.status, 200, res.body);
  assert.equal(JSON.parse(res.body).draft, 'not json at all');
  assertNoLeak(res);
});

test('claude exiting non-zero is reported as an error without leaking stderr', { skip }, async () => {
  setMode('fail');
  const res = await send({ body: oneDocBody() });
  assert.ok(res.status >= 500, `expected 5xx, got ${res.status}`);
  assertNoLeak(res);
});

test('hung claude is killed at the timeout and the request fails promptly', { skip }, async () => {
  setMode('hang');
  const started = Date.now();
  const res = await send({ body: oneDocBody() });
  assert.ok(Date.now() - started < 10000, 'responds well before the fake would finish (60s)');
  assert.ok(res.status >= 500, `expected 5xx, got ${res.status}`);
  assertNoLeak(res);
  assert.ok(existsSync(logFile + '.pid'), 'claude was started');
  const pid = Number(readFileSync(logFile + '.pid', 'utf8'));
  let alive = true;
  for (let i = 0; i < 30 && alive; i++) {
    try { process.kill(pid, 0); await new Promise((r) => setTimeout(r, 100)); } catch { alive = false; }
  }
  if (alive) process.kill(pid, 'SIGKILL');
  assert.equal(alive, false, 'timed-out claude process is terminated');
});
