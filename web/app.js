// Browser UI for Work Handoff. All rendering uses textContent / DOM nodes; no innerHTML.
import {
  MAX_DOCUMENTS, MAX_TOTAL_TEXT, KINDS,
  buildPrompt, validateDraft, exportMarkdown, changedFields, normalizeDocuments, unwrapCodeFence,
} from './handoff.js';
import { EXAMPLE_DOCUMENTS, EXAMPLE_DRAFT } from './example.js';

const $ = (id) => document.getElementById(id);

// Korean display labels; the stored and exported values stay the English schema values.
const KIND_LABELS = {
  completed: '완료',
  in_progress: '진행 중',
  blocked: '막힘',
  needs_confirmation: '확인 필요',
};
const kindLabel = (kind) => `${KIND_LABELS[kind] || kind} (${kind})`;

const state = {
  docs: [], // no record card until a file, paste, or the example adds one
  review: null, // { items, warnings, docs } from the last successful validation
  reviewKey: null, // sources + draft text that produced state.review
  rejected: false, // the latest validation attempt failed; export stays off until a valid draft
};

function inputKey() {
  return JSON.stringify([currentDocs(), $('draft').value]);
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

function setStatus(id, message, kind = '') {
  const node = $(id);
  node.textContent = message;
  node.className = `status ${kind}`;
}

const NO_DOCS = '먼저 위 1단계에서 작업 기록을 넣으세요(파일 끌어다 놓기, 파일 고르기, 직접 붙여넣기).';

function currentDocs() {
  return state.docs.map((d, i) => ({ id: `doc${i + 1}`, title: d.title, text: d.text }));
}

// ---------- 1. Sources ----------

const PREVIEW_CHARS = 240;
const MAX_FILE_BYTES = MAX_TOTAL_TEXT * 4; // UTF-8 upper bound for 20,000 characters

function totalChars() {
  return state.docs.reduce((sum, d) => sum + d.text.length, 0);
}

function previewOf(text) {
  return text.length > PREVIEW_CHARS ? `${text.slice(0, PREVIEW_CHARS)}…` : text;
}

function renderDocs() {
  const host = $('docs');
  host.replaceChildren();
  state.docs.forEach((doc, index) => {
    const id = `doc${index + 1}`;
    const heading = el('h3', { id: `${id}-h` });
    const count = el('span', { class: 'muted' });
    const preview = el('div', { class: 'preview', 'aria-hidden': 'true' });
    const refresh = () => {
      heading.textContent = `${id} · ${doc.title.trim() || '(제목 없음)'}`;
      count.textContent = `${doc.text.length.toLocaleString()}자`;
      preview.textContent = previewOf(doc.text);
      preview.hidden = doc.text === '';
    };
    const title = el('input', { type: 'text', id: `${id}-title`, value: doc.title, placeholder: '예: Claude 세션 2026-09-26' });
    title.addEventListener('input', () => { doc.title = title.value; refresh(); onSourcesChanged(); });
    const text = el('textarea', { id: `${id}-text`, rows: 8, value: doc.text, spellcheck: false, placeholder: '작업 기록 내용을 붙여넣으세요.' });
    text.addEventListener('input', () => { doc.text = text.value; refresh(); onSourcesChanged(); });
    const remove = el('button', { type: 'button', class: 'secondary', text: `${id} 삭제` });
    remove.addEventListener('click', () => removeDoc(index));
    refresh();
    host.append(el('div', { class: 'doc', role: 'group', 'aria-labelledby': `${id}-h` }, [
      el('div', { class: 'doc-head' }, [heading, el('div', { class: 'row' }, [count, remove])]),
      preview,
      el('details', { open: doc.text === '' }, [
        el('summary', { text: `${id} 내용 보기·편집` }),
        el('label', { htmlFor: `${id}-title`, text: `${id} 제목` }), title,
        el('label', { htmlFor: `${id}-text`, text: `${id} 내용` }), text,
      ]),
    ]));
  });
  $('add-doc').disabled = state.docs.length >= MAX_DOCUMENTS && !state.docs.some((d) => d.text === '');
  updateCharCount();
}

function updateCharCount() {
  const total = totalChars();
  const node = $('char-count');
  const over = total - MAX_TOTAL_TEXT;
  node.textContent = `기록 ${state.docs.length}/${MAX_DOCUMENTS}개 · 합계 ${total.toLocaleString()} / ${MAX_TOTAL_TEXT.toLocaleString()}자`
    + (over > 0 ? ` — ${over.toLocaleString()}자 초과. 자르지 않았으니 내용을 줄이거나 기록을 삭제하세요.` : '');
  node.className = over > 0 ? 'error' : 'muted';
}

function onSourcesChanged() {
  updateCharCount();
  setStatus('sources-status', '');
  if ($('prompt').value) {
    $('prompt').value = '';
    $('copy-prompt').disabled = true;
    setStatus('prompt-status', '작업 기록이 바뀌었습니다. 복사하기 전에 프롬프트를 다시 만드세요.', 'warn');
  }
  if (!state.review) renderOriginals(currentDocs(), []);
  updateExport();
  refreshSourceStates();
}

// Removing a record renumbers the later ones (doc3 becomes doc2), which makes an existing draft
// cite the wrong records, so ask first in that case.
function removeDoc(index) {
  const last = index === state.docs.length - 1;
  const hasDraft = state.review !== null || $('draft').value.trim() !== '';
  if (!last && hasDraft && !window.confirm(`doc${index + 1}을 지우면 뒤 기록의 번호가 하나씩 당겨집니다. 지금 JSON 초안과 검토 화면은 그대로 남지만 인용 번호가 맞지 않을 수 있어, 초안을 다시 만들거나 다시 검증하기 전까지 내보낼 수 없습니다. 지울까요?`)) return;
  const [removed] = state.docs.splice(index, 1);
  renderDocs();
  onSourcesChanged();
  const renumbered = last ? '' : ' 뒤 기록의 번호가 하나씩 당겨졌습니다.'
    + (hasDraft ? ' JSON 초안은 그대로 두었습니다. 초안을 다시 만들거나 다시 검증하기 전까지 내보내기는 꺼집니다.' : '');
  setStatus('sources-status', `doc${index + 1}(${removed.title || '제목 없음'})을 지웠습니다.${renumbered}`, last ? 'ok' : 'warn');
  $('pick-files').focus();
}

// Replaces the source records (and clears any typed draft) after the user agrees.
function replaceDocs(docs, message) {
  state.docs = docs.map((d) => ({ title: d.title, text: d.text }));
  renderDocs();
  onSourcesChanged();
  setStatus('sources-status', message, 'ok');
}

function hasInput() {
  return state.docs.some((d) => d.title || d.text) || $('draft').value.trim() !== '';
}

// Decodes strictly, so a non-UTF-8 file is rejected instead of silently changing the source text.
async function readUtf8(file, label = file.name) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
  } catch (err) {
    if (err instanceof TypeError) throw new Error(`${label}은(는) UTF-8 텍스트가 아닙니다. UTF-8로 저장한 뒤 다시 넣으세요`);
    throw err;
  }
}

// Reads local text files in the browser into empty record slots in place (existing records keep
// their doc IDs), then new slots. Rejects the whole batch rather than dropping or truncating anything.
// describe gives each record's title (and, from the source browser, its in-memory origin).
// One import at a time: drop, file picker, and folder import share this, and the free slots are
// counted again after reading, since records may change while files are read.
// Returns true when the files were added.
let importing = false;

function emptySlotsNow() {
  const emptySlots = state.docs.flatMap((d, i) => (d.title || d.text ? [] : [i]));
  const used = state.docs.length - emptySlots.length;
  return { emptySlots, used, free: MAX_DOCUMENTS - used };
}

const tooManyFiles = (used, free, count) => `기록은 최대 ${MAX_DOCUMENTS}개입니다. 지금 ${used}개가 있어 ${free}개만 더 넣을 수 있는데 파일 ${count}개를 넣으려 했습니다. 아무것도 추가하지 않았습니다.`;

async function addFiles(fileList, describe = (file) => ({ title: file.name })) {
  const files = [...fileList];
  if (files.length === 0) return false;
  if (importing) {
    setStatus('sources-status', '앞서 넣은 파일을 아직 읽는 중입니다. 끝난 뒤 다시 넣으세요. 이번 파일은 추가하지 않았습니다.', 'warn');
    return false;
  }
  const { used, free } = emptySlotsNow();
  if (files.length > free) {
    setStatus('sources-status', tooManyFiles(used, free, files.length), 'error');
    return false;
  }
  const described = files.map((file) => ({ file, ...describe(file) }));
  const tooBig = described.find((d) => d.file.size > MAX_FILE_BYTES);
  if (tooBig) {
    setStatus('sources-status', `${tooBig.title} 파일이 너무 큽니다(${tooBig.file.size.toLocaleString()}바이트). 기록 합계 한도는 ${MAX_TOTAL_TEXT.toLocaleString()}자입니다. 아무것도 추가하지 않았습니다.`, 'error');
    return false;
  }
  importing = true;
  refreshSourceStates();
  try {
    const docs = await Promise.all(described.map(async ({ file, ...info }) => ({ ...info, text: await readUtf8(file, info.title) })));
    const binary = docs.find((d) => d.text.includes('\u0000'));
    if (binary) throw new Error(`${binary.title}은(는) 텍스트 파일이 아닌 것 같습니다`);
    const empty = docs.find((d) => d.text.trim() === '');
    if (empty) throw new Error(`${empty.title} 파일이 비어 있습니다`);
    // No await from here on: slots are taken from the records as they are now.
    const now = emptySlotsNow();
    if (docs.length > now.free) {
      setStatus('sources-status', `파일을 읽는 동안 기록이 바뀌었습니다. ${tooManyFiles(now.used, now.free, docs.length)}`, 'error');
      return false;
    }
    const next = state.docs.slice();
    for (const doc of docs) {
      const slot = now.emptySlots.shift();
      if (slot === undefined) next.push(doc);
      else next[slot] = doc;
    }
    state.docs = next;
    renderDocs();
    onSourcesChanged();
    const over = totalChars() > MAX_TOTAL_TEXT;
    setStatus('sources-status', `파일 ${docs.length}개를 불러왔습니다: ${docs.map((d) => d.title).join(', ')}.`
      + (over ? ' 합계가 한도를 넘습니다. 자르지 않았으니 줄이거나 삭제한 뒤 초안을 만드세요.' : ' 다음은 [Claude CLI로 바로 초안 만들기] 또는 [다른 AI에서 초안 만들기]입니다.'), over ? 'error' : 'ok');
    return true;
  } catch (err) {
    setStatus('sources-status', `파일을 읽지 못했습니다: ${err.message}. 아무것도 추가하지 않았습니다.`, 'error');
    return false;
  } finally {
    importing = false;
    refreshSourceStates();
  }
}

function addPastedDoc() {
  let index = state.docs.findIndex((d) => d.text === '');
  if (index === -1) {
    if (state.docs.length >= MAX_DOCUMENTS) {
      setStatus('sources-status', `기록은 최대 ${MAX_DOCUMENTS}개입니다. 먼저 하나를 삭제하세요.`, 'error');
      return;
    }
    state.docs.push({ title: '', text: '' });
    index = state.docs.length - 1;
    renderDocs();
    onSourcesChanged();
  }
  $(`doc${index + 1}-text`).closest('details').open = true;
  $(`doc${index + 1}-text`).focus();
}

function loadExample() {
  if (hasInput() && !window.confirm('지금 입력된 기록과 초안을 예시로 바꿀까요?')) return;
  replaceDocs(EXAMPLE_DOCUMENTS, '예시 기록 2개를 넣었습니다.');
  makePrompt();
  $('draft').value = EXAMPLE_DRAFT;
  $('manual').open = true;
  updateExport();
  setStatus('draft-status', '체험용 예시 JSON 초안을 수동 칸에 넣었습니다. Claude가 만든 것이 아니라 미리 준비한 예시입니다. [초안 검증]을 눌러 보세요. 실제 기록으로는 [Claude CLI로 바로 초안 만들기]를 쓰거나 [다른 AI에서 초안 만들기]로 받은 답변을 붙여넣습니다.', 'warn');
  $('validate').focus();
}

function initDropzone() {
  const zone = $('dropzone');
  const hasFiles = (event) => [...(event.dataTransfer?.types || [])].includes('Files');
  zone.addEventListener('dragover', (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    zone.classList.add('over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('over');
    addFiles(event.dataTransfer.files);
  });
  // A file dropped next to the zone would otherwise replace the page and lose the review.
  window.addEventListener('dragover', (event) => { if (hasFiles(event)) event.preventDefault(); });
  window.addEventListener('drop', (event) => {
    if (!hasFiles(event) || zone.contains(event.target)) return;
    event.preventDefault();
    setStatus('sources-status', '파일은 점선 상자 안에 놓으세요.', 'warn');
  });
}

// ---------- Source record location (showDirectoryPicker) ----------
// Lists text record candidates inside the one folder the user picks. Nothing is kept after the
// page closes; files are read only for a short preview and when the user imports them.

const TEXT_EXTENSIONS = /\.(txt|md|markdown|log|json|csv)$/i;
const SKIP_DIRS = new Set(['node_modules', '__pycache__', 'venv']);
const SCAN_MAX_DEPTH = 6;
const SCAN_MAX_ENTRIES = 5000;
const PAGE_SIZE = 20;
const PREVIEW_BYTES = 2048;

// origin: in-memory ID of the current folder pick; every pick gets a new one, even for the same folder name.
const browser = { root: '', origin: 0, candidates: [], shown: PAGE_SIZE, selected: new Set(), scan: 0 };

const accessDenied = (err) => ['NotAllowedError', 'SecurityError'].includes(err?.name);

async function pickSourceDir() {
  if (typeof window.showDirectoryPicker !== 'function') {
    setStatus('source-dir-status', '이 브라우저는 원본 기록 위치 선택을 지원하지 않습니다(Chrome·Edge 등 Chromium 계열 데스크톱 브라우저에서 됩니다). [파일 고르기]로 여러 파일을 고르거나 파일을 점선 상자에 끌어다 놓으세요.', 'warn');
    return;
  }
  let dir;
  try {
    dir = await window.showDirectoryPicker({ mode: 'read' });
  } catch (err) {
    setStatus('source-dir-status', err?.name === 'AbortError'
      ? '폴더 선택이 완료되지 않았습니다. 다시 시도하거나 [파일 고르기]를 이용하세요. 기존 기록은 그대로입니다.'
      : accessDenied(err)
        ? '이 폴더를 읽을 권한을 받지 못했습니다(시스템 폴더는 브라우저가 막기도 합니다). 다른 폴더를 고르거나 [파일 고르기]를 쓰세요.'
        : `원본 기록 위치를 열지 못했습니다: ${err?.message || err}. [파일 고르기]를 쓸 수 있습니다.`, 'warn');
    return;
  }
  const scan = ++browser.scan;
  setStatus('source-dir-status', `${dir.name} 폴더에서 텍스트 기록 후보를 찾는 중입니다…`, 'warn');
  const candidates = [];
  const skipped = { depth: false, entries: false, unreadable: 0 };
  let entries = 0;
  const walk = async (handle, prefix, depth) => {
    for await (const entry of handle.values()) {
      if (scan !== browser.scan) return;
      if (++entries > SCAN_MAX_ENTRIES) { skipped.entries = true; return; }
      const path = prefix + entry.name;
      if (entry.kind === 'directory') {
        if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
        if (depth >= SCAN_MAX_DEPTH) { skipped.depth = true; continue; }
        try {
          await walk(entry, `${path}/`, depth + 1);
        } catch {
          skipped.unreadable += 1; // a failure listing the chosen folder itself still reaches the caller
        }
        if (skipped.entries) return;
      } else if (TEXT_EXTENSIONS.test(entry.name) && !entry.name.startsWith('.')) {
        try {
          const file = await entry.getFile();
          candidates.push({ handle: entry, path, size: file.size, modified: file.lastModified, preview: null, problem: '' });
        } catch {
          skipped.unreadable += 1;
        }
      }
    }
  };
  try {
    await walk(dir, '', 0);
  } catch (err) {
    if (scan !== browser.scan) return;
    setStatus('source-dir-status', accessDenied(err)
      ? `${dir.name} 폴더를 읽을 권한이 없거나 권한이 취소되었습니다. [원본 기록 위치 선택]을 다시 눌러 읽기를 허용하세요. 지금 기록은 그대로입니다.`
      : `${dir.name} 폴더를 살피다 실패했습니다: ${err?.message || err}. 다시 선택하거나 [파일 고르기]를 쓰세요. 지금 기록은 그대로입니다.`, 'error');
    return;
  }
  if (scan !== browser.scan) return;
  candidates.sort((a, b) => b.modified - a.modified || a.path.localeCompare(b.path));
  Object.assign(browser, { root: dir.name, origin: scan, candidates, shown: PAGE_SIZE, selected: new Set() });
  $('source-search').value = '';
  $('source-browser').hidden = false;
  $('source-browser').open = true;
  $('source-browser-h').textContent = `원본 기록 후보 · ${dir.name} (${candidates.length}개)`;
  const notes = [];
  if (skipped.entries) notes.push(`항목이 많아 앞의 ${SCAN_MAX_ENTRIES.toLocaleString()}개까지만 살폈습니다`);
  if (skipped.depth) notes.push(`${SCAN_MAX_DEPTH}단계보다 깊은 폴더는 살피지 않았습니다`);
  if (skipped.unreadable) notes.push(`읽지 못한 폴더·파일 ${skipped.unreadable}개는 뺐습니다`);
  const narrow = notes.length ? ` ${notes.join('; ')}. 찾는 기록이 없으면 그 기록이 있는 더 안쪽 폴더를 고르세요.` : '';
  setStatus('source-dir-status', candidates.length
    ? `원본 기록 위치 ${dir.name}에서 텍스트 기록 후보 ${candidates.length}개를 찾았습니다(숨김 폴더·node_modules 제외).${narrow}`
    : `원본 기록 위치 ${dir.name}에서 텍스트 기록 후보(.txt .md .log .json .csv)를 찾지 못했습니다.${narrow || ' 다른 폴더를 고르거나 [파일 고르기]를 쓰세요.'}`,
  candidates.length && !notes.length ? 'ok' : 'warn');
  renderSourceBrowser();
}

function freeSlots() {
  return MAX_DOCUMENTS - state.docs.filter((d) => d.title || d.text).length;
}

// A record imported from this folder pick keeps { root: pick ID, path } in memory (not in
// currentDocs). Only that exact match is labeled as imported; anything else (a re-pick, a parent
// folder, the file picker) gets a neutral label, since the app cannot prove it is not on the page.
const candidateTitle = (c, root = browser.root) => `${root}/${c.path}`;

// Assigns only when the text changes, so live regions are not re-announced on every refresh.
function setText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

function docIdFor(c) {
  const index = state.docs.findIndex((d) => d.origin?.root === browser.origin && d.origin.path === c.path);
  return index === -1 ? '' : `doc${index + 1}`;
}

function formatSize(bytes) {
  return bytes < 1024 ? `${bytes}바이트` : `${(bytes / 1024).toFixed(1)}KB`;
}

async function loadPreview(candidate) {
  candidate.preview = '';
  try {
    const file = await candidate.handle.getFile();
    const bytes = new Uint8Array(await file.slice(0, PREVIEW_BYTES).arrayBuffer());
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes, { stream: true });
    if (text.includes('\u0000')) candidate.problem = '텍스트 파일이 아닌 것 같아 불러올 수 없습니다';
    else if (text.trim() === '' && file.size <= PREVIEW_BYTES) candidate.problem = '비어 있어 불러올 수 없습니다';
    candidate.preview = text.replace(/\s+/g, ' ').trim().slice(0, 160);
  } catch (err) {
    candidate.problem = err instanceof TypeError
      ? 'UTF-8 텍스트가 아니어서 불러올 수 없습니다'
      : '읽지 못했습니다(권한이 취소되었거나 파일이 옮겨졌을 수 있습니다)';
  }
  if (candidate.problem) browser.selected.delete(candidate);
  if (candidate.row) candidate.row.preview.textContent = candidate.preview || '(미리보기 없음)';
  refreshSourceStates();
}

// Rebuilds the visible rows (after a new scan, search, or More).
function renderSourceBrowser() {
  const query = $('source-search').value.trim().toLowerCase();
  const matches = browser.candidates.filter((c) => candidateTitle(c).toLowerCase().includes(query));
  const visible = matches.slice(0, browser.shown);
  browser.candidates.forEach((c) => { c.row = null; });
  const list = $('source-list');
  list.replaceChildren();
  visible.forEach((c, index) => {
    const id = `source-${index}`;
    const box = el('input', { type: 'checkbox', id, checked: browser.selected.has(c) });
    box.addEventListener('change', () => {
      if (box.checked) browser.selected.add(c); else browser.selected.delete(c);
      refreshSourceStates();
    });
    const meta = el('div', { class: 'meta' });
    const preview = el('div', { class: 'preview', text: c.preview === null ? '미리보기 읽는 중…' : c.preview || '(미리보기 없음)' });
    c.row = { box, meta, preview };
    list.append(el('li', {}, [el('label', { htmlFor: id }, [box, el('div', {}, [
      el('div', { class: 'path', text: candidateTitle(c) }), meta, preview,
    ])])]));
    if (c.preview === null) loadPreview(c);
  });
  setText($('source-summary'), `${query ? `검색 결과 ${matches.length}개 / ` : ''}후보 ${browser.candidates.length}개 중 ${visible.length}개 표시 · 최근 수정 순`
    + ' · "새 기록으로 추가"는 이 페이지에 같은 내용이 없다는 뜻이 아닙니다. 앱은 이전 가져오기나 인계·검토 이력을 알지 못합니다.');
  // Stays focusable on the last page (aria-disabled, not disabled), so keyboard focus is not lost.
  const more = $('source-more');
  const done = matches.length <= visible.length;
  more.hidden = matches.length <= PAGE_SIZE;
  more.setAttribute('aria-disabled', String(done));
  more.textContent = done ? '더 볼 후보 없음' : '20개 더 보기';
  refreshSourceStates();
}

// Updates checkbox availability and labels in place, so keyboard focus stays where it is.
function refreshSourceStates() {
  if ($('source-browser').hidden) return;
  for (const c of browser.selected) if (docIdFor(c)) browser.selected.delete(c);
  const free = freeSlots();
  for (const c of browser.candidates) {
    if (!c.row) continue;
    const docId = docIdFor(c);
    const tooBig = c.size > MAX_FILE_BYTES;
    const checked = browser.selected.has(c);
    const full = !checked && browser.selected.size >= free;
    const reason = docId ? `이 선택에서 이 페이지의 ${docId}로 불러옴`
      : tooBig ? `너무 커서 불러올 수 없습니다(한도 ${MAX_TOTAL_TEXT.toLocaleString()}자)`
        : c.problem || (full ? '빈 기록 자리가 없어 더 고를 수 없음' : '선택하면 새 기록으로 추가');
    c.row.box.checked = checked;
    c.row.box.disabled = Boolean(docId || tooBig || c.problem) || full;
    setText(c.row.meta, `수정 ${new Date(c.modified).toLocaleString('ko-KR')} · ${formatSize(c.size)} · ${reason}`);
  }
  $('source-import').disabled = importing || browser.selected.size === 0 || browser.selected.size > free;
  const hidden = [...browser.selected].filter((c) => !c.row).length;
  setText($('source-selected'), importing ? '파일을 읽는 중…' : `${browser.selected.size}개 고름`
    + (hidden ? `(지금 목록에 보이지 않는 ${hidden}개 포함, 함께 불러옵니다)` : '')
    + (free === 0 ? ' · 빈 기록 자리가 없습니다. 기록을 삭제해야 더 불러올 수 있습니다.'
      : browser.selected.size > free ? ` · 빈 기록 자리는 ${free}개입니다. ${browser.selected.size - free}개 체크를 풀어야 불러올 수 있습니다.`
      : browser.selected.size === free ? ` · 빈 기록 자리 ${free}개를 모두 골랐습니다. 다른 파일을 고르려면 체크를 푸세요.`
        : ` · 빈 기록 자리 ${free}개`));
}

async function importSelected() {
  const picked = [...browser.selected];
  if (picked.length === 0 || importing) return;
  // Snapshot the pick, so choosing another folder while reading cannot change titles or origins.
  const { root, origin } = browser;
  importing = true;
  refreshSourceStates();
  const origins = new Map();
  let files;
  try {
    files = await Promise.all(picked.map(async (c) => {
      const file = await c.handle.getFile();
      origins.set(file, c);
      return file;
    }));
  } catch (err) {
    setStatus('sources-status', accessDenied(err)
      ? '원본 기록 위치를 읽을 권한이 취소되었습니다. [원본 기록 위치 선택]을 다시 눌러 허용하세요. 아무것도 추가하지 않았습니다.'
      : `고른 파일을 읽지 못했습니다(옮겨졌거나 지워졌을 수 있습니다): ${err?.message || err}. [원본 기록 위치 선택]으로 목록을 새로 만드세요. 아무것도 추가하지 않았습니다.`, 'error');
    return;
  } finally {
    importing = false; // addFiles takes it again synchronously below
    if (!files) refreshSourceStates();
  }
  const describe = (file) => {
    const c = origins.get(file);
    return { title: candidateTitle(c, root), origin: { root: origin, path: c.path } };
  };
  if (await addFiles(files, describe)) {
    picked.forEach((c) => browser.selected.delete(c));
    if (browser.origin === origin) {
      // Fold the list so the next step stays close; the summary reopens it.
      $('source-browser').open = false;
      $('source-browser-h').focus();
    }
  }
  refreshSourceStates();
}

// ---------- 2. AI draft (Claude CLI through web/server.py) ----------

async function aiDraft() {
  if (state.docs.length === 0) {
    setStatus('ai-status', NO_DOCS, 'error');
    return;
  }
  let prompt;
  try {
    prompt = buildPrompt(currentDocs());
  } catch (err) {
    setStatus('ai-status', err.message, 'error');
    return;
  }
  const unvalidated = $('draft').value.trim() !== '' && (!state.review || state.rejected || inputKey() !== state.reviewKey);
  if (unvalidated && !window.confirm('JSON 초안 칸에 아직 검증하지 않은 내용이 있습니다. Claude 초안이 오면 그 내용을 바꿉니다. 계속할까요?')) {
    setStatus('ai-status', '취소했습니다. JSON 초안 칸은 그대로입니다.', 'warn');
    return;
  }
  if (reviewHasEdits() && !window.confirm(DISCARD_REVIEW_QUESTION)) {
    setStatus('ai-status', '취소했습니다. 지금 검토는 그대로입니다.', 'warn');
    return;
  }
  const sent = JSON.stringify(currentDocs());
  const reviewBefore = reviewSnapshot();
  const draftBefore = $('draft').value;
  const button = $('ai-draft');
  button.disabled = true;
  setStatus('draft-status', '');
  setStatus('ai-status', '기록을 Claude로 보내 초안을 만드는 중입니다. 보통 수십 초, 길면 몇 분 걸립니다…', 'warn');
  let response;
  let data = null;
  try {
    response = await fetch('/api/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    data = await response.json().catch(() => null);
  } catch {
    setStatus('ai-status', '로컬 서버에 연결하지 못했습니다. AI 초안은 python3 web/server.py로 실행한 페이지에서만 됩니다. [다른 AI에서 초안 만들기]를 쓸 수 있습니다.', 'error');
    return;
  } finally {
    button.disabled = false;
  }
  if (!response.ok || !data || typeof data.draft !== 'string') {
    const noApi = [404, 405, 501].includes(response.status) && !(data && data.error);
    const message = noApi
      ? '이 페이지는 AI 초안 기능이 없는 서버에서 열렸습니다. python3 web/server.py로 실행하세요. [다른 AI에서 초안 만들기]는 그대로 쓸 수 있습니다.'
      : (data && data.error) || `AI 초안을 받지 못했습니다(HTTP ${response.status}).`;
    setStatus('ai-status', message, 'error');
    return;
  }
  if ($('draft').value !== draftBefore) {
    $('manual').open = true;
    setStatus('ai-status', '기다리는 동안 JSON 초안 칸이 바뀌어서, 고친 내용을 덮어쓰지 않도록 받은 Claude 초안을 버렸습니다. 필요하면 다시 만드세요.', 'warn');
    return;
  }
  $('draft').value = data.draft;
  if (reviewSnapshot() !== reviewBefore) {
    $('manual').open = true;
    updateExport();
    setStatus('ai-status', '기다리는 동안 검토 내용이 바뀌어서 검토를 자동으로 바꾸지 않았습니다. 받은 Claude 초안은 수동 칸에 넣었지만 검증하지 않았습니다. 검토를 바꾸려면 [초안 검증]을 누르세요.', 'warn');
    return;
  }
  if (JSON.stringify(currentDocs()) !== sent) {
    $('manual').open = true;
    updateExport();
    setStatus('ai-status', '기다리는 동안 기록이 바뀌었습니다. 받은 초안을 수동 칸에 넣었지만 검증하지 않았습니다. 초안을 다시 만들거나 [초안 검증]을 누르세요.', 'warn');
    return;
  }
  validate({ discardConfirmed: true });
  if (state.rejected) {
    setStatus('ai-status', 'Claude 초안을 받았지만 검증을 통과하지 못했습니다. 아래 수동 칸에서 초안을 고쳐 다시 검증하거나 초안을 다시 만드세요.', 'error');
  } else {
    setStatus('ai-status', 'Claude 초안을 받아 인용문을 검증했습니다. AI 초안은 확인된 내용이 아닙니다. 아래에서 사람이 원문과 대조해 검토하세요.', 'ok');
  }
}

// ---------- Manual path: "다른 AI에서 초안 만들기" ----------

// Opens the manual section and makes the prompt; the user copies it to any AI chat themselves.
function startOtherAi() {
  $('manual').open = true;
  makePrompt();
  if ($('prompt').value) {
    setStatus('ai-status', '다른 AI 경로: 아래 프롬프트를 복사해 원하는 AI 대화창에 직접 붙여넣고, 받은 JSON 답변을 [JSON 초안] 칸에 붙여넣은 뒤 [초안 검증]을 누르세요. 이 앱은 그 AI에 아무것도 보내지 않습니다.', 'ok');
    $('copy-prompt').focus();
  } else {
    setStatus('ai-status', '다른 AI 경로: 먼저 1단계에서 작업 기록을 넣은 뒤 다시 누르거나 [프롬프트 만들기]를 누르세요.', 'warn');
    $('make-prompt').focus();
  }
  $('prompt-h').scrollIntoView({ block: 'start', behavior: 'smooth' });
}


function makePrompt() {
  try {
    $('prompt').value = buildPrompt(currentDocs());
    $('copy-prompt').disabled = false;
    setStatus('prompt-status', '프롬프트를 만들었습니다. 복사해서 에이전트 대화창에 직접 붙여넣고, 받은 JSON 답변을 아래 칸에 붙여넣으세요.', 'ok');
  } catch (err) {
    $('prompt').value = '';
    $('copy-prompt').disabled = true;
    setStatus('prompt-status', state.docs.length ? err.message : NO_DOCS, 'error');
  }
}

async function copyPrompt() {
  const area = $('prompt');
  try {
    await navigator.clipboard.writeText(area.value);
    setStatus('prompt-status', '프롬프트를 복사했습니다. 이제 에이전트 대화창에 붙여넣으세요(이 앱은 보내지 않습니다).', 'ok');
  } catch {
    area.focus();
    area.select();
    setStatus('prompt-status', '클립보드 접근이 막혔습니다. 프롬프트를 선택해 두었으니 Ctrl+C(Mac은 Cmd+C)로 복사하세요.', 'warn');
  }
}

// ---------- Validate ----------

const DISCARD_REVIEW_QUESTION = '새 초안으로 바꾸면 지금 검토에서 고친 내용과 확인 표시가 사라집니다. 계속할까요?';

// Kind, text, next action, and review state of every reviewed item, to detect edits made while waiting.
function reviewSnapshot() {
  return state.review === null ? null
    : JSON.stringify(state.review.items.map((i) => [i.kind, i.text, i.next_action, i.review_state]));
}

function reviewHasEdits() {
  return state.review !== null
    && state.review.items.some((i) => i.review_state === 'confirmed' || changedFields(i).length > 0);
}

// discardConfirmed: the caller already asked before replacing an edited review.
function validate({ discardConfirmed = false } = {}) {
  const docs = currentDocs();
  // Remove a ``` fence around the reply in the visible textarea, so what is validated is what is shown.
  const unwrapped = unwrapCodeFence($('draft').value);
  if (unwrapped !== null) $('draft').value = unwrapped;
  const fenceNote = unwrapped !== null ? '답변을 감싼 ``` 코드 블록 표시를 지웠습니다. ' : '';
  const key = inputKey();
  try {
    const result = validateDraft(docs, $('draft').value);
    state.rejected = false;
    const valid = `${fenceNote}초안 형식이 유효합니다: 항목 ${result.items.length}개, 모든 인용문이 원문에 글자 그대로 있습니다(인용이 있다고 내용이 사실이라는 뜻은 아닙니다).`;
    if (state.review && key === state.reviewKey) {
      setStatus('draft-status', `${valid} 초안과 기록이 그대로여서 검토 중 수정한 내용과 표시를 유지했습니다.`, 'ok');
      updateExport();
      return;
    }
    if (!discardConfirmed && reviewHasEdits() && !window.confirm(DISCARD_REVIEW_QUESTION)) {
      setStatus('draft-status', `${valid} 취소했습니다. 이전 검토를 그대로 두었습니다. 초안이나 기록이 바뀌어 내보내기는 꺼져 있습니다.`, 'warn');
      updateExport();
      return;
    }
    const replaced = state.review !== null;
    state.review = { items: result.items, warnings: result.warnings, docs: normalizeDocuments(docs) };
    state.reviewKey = key;
    setStatus('draft-status', replaced
      ? `${valid} 이전 검토를 새 초안으로 바꿨습니다. 이전에 수정한 내용과 확인 표시는 사라졌습니다. 아래 항목을 다시 검토하세요.`
      : `${valid} 아래 3단계에서 항목을 하나씩 검토하세요. 모든 항목은 검토 필요로 시작합니다.`, replaced ? 'warn' : 'ok');
    setStatus('export-status', '');
    renderReview();
  } catch (err) {
    state.rejected = true;
    setStatus('draft-status', `${fenceNote}초안을 받아들일 수 없습니다: ${err.message}${state.review ? ' 이전 검토는 화면에 남아 있지만, 유효한 초안을 다시 검증하기 전까지 내보낼 수 없습니다.' : ''}`, 'error');
    updateExport();
    $('manual').open = true;
    $('draft').focus();
  }
}

// ---------- 3. Review ----------

function renderOriginals(docs, highlights) {
  const host = $('originals');
  host.replaceChildren();
  for (const doc of docs) {
    const marks = highlights
      .filter((h) => h.document_id === doc.id)
      .sort((a, b) => a.offset - b.offset);
    const pre = el('div', { class: 'original-text', id: `original-${doc.id}`, tabIndex: 0, 'aria-label': `${doc.id} 원문` });
    let cursor = 0;
    for (const h of marks) {
      if (h.offset < cursor) continue; // overlapping quote; the earlier mark already covers it
      pre.append(document.createTextNode(doc.text.slice(cursor, h.offset)));
      pre.append(el('mark', { id: h.markId, tabIndex: -1, text: doc.text.slice(h.offset, h.offset + h.quote.length) }));
      cursor = h.offset + h.quote.length;
    }
    pre.append(document.createTextNode(doc.text.slice(cursor)));
    host.append(el('h4', { text: `${doc.id}: ${doc.title || '(제목 없음)'}` }), pre);
  }
}

function renderReview() {
  const { items, warnings, docs } = state.review;
  const byId = new Map(docs.map((d) => [d.id, d]));

  const warnHost = $('draft-warnings');
  warnHost.replaceChildren();
  if (warnings.length) {
    warnHost.append(el('h3', { text: '에이전트가 남긴 경고' }),
      el('ul', { class: 'warnings' }, warnings.map((w) => el('li', { text: w }))));
  }

  const highlights = [];
  const list = $('items');
  list.replaceChildren();
  items.forEach((item, index) => {
    const key = `item${index}`;
    const card = el('article', { class: 'item', 'aria-labelledby': `${key}-h` });

    const kind = el('select', { id: `${key}-kind` }, KINDS.map((k) => el('option', { value: k, text: kindLabel(k) })));
    kind.value = item.kind;
    const text = el('textarea', { id: `${key}-text`, rows: 3, value: item.text });
    const next = el('input', { type: 'text', id: `${key}-next`, value: item.next_action });
    const originalNote = el('div', { class: 'original-note', 'aria-live': 'polite' });

    const radios = ['needs_review', 'confirmed'].map((value) => {
      const input = el('input', { type: 'radio', name: `${key}-state`, id: `${key}-${value}`, value, checked: item.review_state === value });
      input.addEventListener('change', () => { item.review_state = value; refreshCard(); });
      return el('label', { htmlFor: `${key}-${value}` }, [input, ` ${value === 'confirmed' ? '확인함' : '검토 필요'}`]);
    });

    const refreshCard = () => {
      card.classList.toggle('confirmed', item.review_state === 'confirmed');
      const changed = changedFields(item);
      originalNote.textContent = changed.length
        ? `수정됨 (${changed.join(', ')}). AI 초안 원래 값 — 종류: ${kindLabel(item.original.kind)}; 내용: ${item.original.text}; 다음 할 일: ${item.original.next_action || '(없음)'}`
        : '';
      updateExport();
    };
    kind.addEventListener('change', () => { item.kind = kind.value; refreshCard(); });
    text.addEventListener('input', () => { item.text = text.value; refreshCard(); });
    next.addEventListener('input', () => { item.next_action = next.value; refreshCard(); });

    const citations = item.sources.map((source, sIndex) => {
      const markId = `mark-${key}-${sIndex}`;
      highlights.push({ ...source, markId });
      const doc = byId.get(source.document_id);
      const show = el('button', { type: 'button', class: 'secondary', text: '원문에서 보기' });
      show.addEventListener('click', () => {
        document.querySelectorAll('mark.active').forEach((m) => m.classList.remove('active'));
        const target = document.getElementById(markId) || document.getElementById(`original-${source.document_id}`);
        target.classList.add('active');
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return el('div', { class: 'citation' }, [
        el('span', { class: 'src', text: `${source.document_id} — ${doc.title} (원문 ${source.offset}번째 글자에서 정확히 일치)` }),
        el('span', { text: source.quote }),
        el('div', { class: 'row' }, [show]),
      ]);
    });

    card.append(
      el('h3', { id: `${key}-h`, text: `${index + 1}. ${item.id}` }),
      el('div', { class: 'grid' }, [
        el('div', {}, [el('label', { htmlFor: `${key}-kind`, text: '종류' }), kind]),
        el('div', {}, [el('label', { htmlFor: `${key}-next`, text: '다음 할 일' }), next]),
      ]),
      el('label', { htmlFor: `${key}-text`, text: '내용' }), text,
      originalNote,
      el('fieldset', {}, [el('legend', { class: 'muted', text: '검토 상태' }), ...radios]),
      el('h4', { text: '인용한 원문' }),
      ...citations,
    );
    list.append(card);
    refreshCard();
  });

  renderOriginals(docs, highlights);
  updateExport();
}

// ---------- 4. Export ----------

// Returns why export is unavailable, or '' when the reviewed result may be exported.
function exportBlocker() {
  if (!state.review) return '먼저 AI 초안을 만들거나 JSON 초안을 검증하세요.';
  if (state.rejected) return '내보내기 꺼짐: 마지막 초안 검증이 실패했습니다. 유효한 초안을 검증하면 켜집니다.';
  if (inputKey() !== state.reviewKey) return '내보내기 꺼짐: 검증 뒤에 기록이나 초안이 바뀌었습니다. 다시 검증하세요.';
  const blank = state.review.items.find((i) => i.text.trim() === '');
  if (blank) return `내보내기 꺼짐: 항목 "${blank.id}"의 내용이 비어 있습니다.`;
  return '';
}

function updateExport() {
  const blocker = exportBlocker();
  $('download').disabled = blocker !== '';
  const summary = $('export-summary');
  if (!state.review) {
    summary.textContent = blocker;
    return;
  }
  const total = state.review.items.length;
  const confirmed = state.review.items.filter((i) => i.review_state === 'confirmed').length;
  summary.textContent = `${total}개 중 ${confirmed}개 확인함, ${total - confirmed}개 검토 필요. ${blocker}`.trim();
  summary.className = blocker ? 'warn' : 'muted';
}

function download() {
  if (exportBlocker()) return;
  try {
    const markdown = exportMarkdown(state.review.docs, state.review.items, state.review.warnings);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = el('a', { href: url, download: 'work-handoff.md' });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('export-status', 'work-handoff.md 파일로 내려받았습니다.', 'ok');
  } catch (err) {
    setStatus('export-status', err.message, 'error');
  }
}

$('add-doc').addEventListener('click', addPastedDoc);
$('pick-files').addEventListener('click', () => $('doc-files').click());
$('doc-files').addEventListener('change', () => {
  const input = $('doc-files');
  addFiles(input.files).finally(() => { input.value = ''; });
});
$('load-example').addEventListener('click', loadExample);
$('pick-source-dir').addEventListener('click', pickSourceDir);
$('source-search').addEventListener('input', () => { browser.shown = PAGE_SIZE; renderSourceBrowser(); });
$('source-more').addEventListener('click', () => {
  if ($('source-more').getAttribute('aria-disabled') === 'true') return;
  browser.shown += PAGE_SIZE;
  renderSourceBrowser();
});
$('source-import').addEventListener('click', importSelected);
$('ai-draft').addEventListener('click', aiDraft);
$('other-ai').addEventListener('click', startOtherAi);
$('make-prompt').addEventListener('click', makePrompt);
$('copy-prompt').addEventListener('click', copyPrompt);
$('draft').addEventListener('input', updateExport);
$('validate').addEventListener('click', () => validate());
$('download').addEventListener('click', download);

initDropzone();
renderDocs();
renderOriginals(currentDocs(), []);
updateExport();
