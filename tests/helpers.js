import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..');
const examplesDir = join(repoRoot, 'examples');

// Returns { documents, draftText, draft } for an examples/<name>/ fixture.
// draftText is the raw JSON string, exactly as a user would paste it.
export function loadExample(name) {
  const documents = JSON.parse(readFileSync(join(examplesDir, name, 'sources.json'), 'utf8'));
  const draftText = readFileSync(join(examplesDir, name, 'draft.json'), 'utf8');
  return { documents, draftText, draft: JSON.parse(draftText) };
}

export function oneDoc(text, title = 'Record') {
  return [{ id: 'doc1', title, text }];
}

export function draftOf(items, warnings) {
  const draft = { items };
  if (warnings !== undefined) draft.warnings = warnings;
  return JSON.stringify(draft);
}

export function item(overrides = {}) {
  return {
    id: 'i1',
    kind: 'completed',
    text: 'Did the thing.',
    sources: [{ document_id: 'doc1', quote: 'did the thing' }],
    ...overrides,
  };
}

const LIST_ITEM = /^\s{0,3}([-*+]|\d{1,9}[.)])(\s|$)/;
const ATX_HEADING = /^\s{0,3}#{1,6}(\s|$)/;
const INDENT = /^( {4}|\t)/;
const BLANK = /^[ \t]*$/;

// CommonMark line endings: CRLF, lone CR, or LF.
export function splitLines(s) {
  return s.split(/\r\n|\r|\n/);
}

// Marks which lines of a Markdown string sit inside a CommonMark *indented*
// code block (4 spaces or a tab, started after a blank line, a heading, or the
// start of the document, and not a continuation of a list item).
// Returns an array of booleans, one per line.
export function indentedCodeLines(md) {
  const lines = splitLines(md);
  const flags = new Array(lines.length).fill(false);
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inCode) {
      if (INDENT.test(line)) { flags[i] = true; continue; }
      if (BLANK.test(line)) continue;
      inCode = false;
    }
    if (!INDENT.test(line) || BLANK.test(line)) continue;
    const prev = i === 0 ? '' : lines[i - 1];
    if (!(i === 0 || BLANK.test(prev) || ATX_HEADING.test(prev))) continue; // lazy paragraph continuation
    let j = i - 1;
    while (j >= 0 && BLANK.test(lines[j])) j--;
    if (j >= 0 && LIST_ITEM.test(lines[j])) continue; // would nest inside the list item
    inCode = true;
    flags[i] = true;
  }
  return { lines, flags };
}

// Asserts every line of `text` appears, in order, on consecutive lines inside
// one indented code block, byte-for-byte (no entity escaping).
export function assertInIndentedCode(assert, md, text, label = text) {
  const { lines, flags } = indentedCodeLines(md);
  const want = splitLines(text);
  const body = (k) => lines[k].replace(INDENT, '');
  for (let start = 0; start + want.length <= lines.length; start++) {
    if (want.every((w, k) => flags[start + k] && body(start + k).includes(w))) return;
  }
  assert.fail(`expected ${JSON.stringify(label)} literally inside an indented code block`);
}

// Asserts no line outside indented code blocks carries raw HTML that a
// Markdown renderer would treat as a tag. Inline code spans, backslash escapes
// (\<) and entity escapes (&lt;) are all inert and tolerated.
export function assertNoActiveHtml(assert, md) {
  const { lines, flags } = indentedCodeLines(md);
  const offenders = [];
  lines.forEach((line, k) => {
    if (flags[k]) return;
    const stripped = line
      .replace(/(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, '')
      .replace(/\\[!-\/:-@\[-`{-~]/g, ''); // backslash-escaped punctuation, e.g. \<
    if (/<[A-Za-z!?\/]/.test(stripped)) offenders.push(`line ${k + 1}: ${line}`);
  });
  assert.deepEqual(offenders, [], 'raw HTML outside indented code blocks');
}

// Turn a validated item into the reviewed shape exportMarkdown expects.
export function reviewed(validItem, { review_state = 'needs_review', edits = {} } = {}) {
  return {
    ...validItem,
    ...edits,
    review_state,
    original: {
      kind: validItem.kind,
      text: validItem.text,
      next_action: validItem.next_action,
    },
  };
}
