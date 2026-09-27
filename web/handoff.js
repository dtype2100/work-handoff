// Pure, dependency-free logic for Work Handoff. No DOM, network, or storage access.

export const MAX_DOCUMENTS = 3;
export const MAX_TOTAL_TEXT = 20000;
export const MAX_DRAFT_LENGTH = 200000;
export const KINDS = Object.freeze(['completed', 'in_progress', 'blocked', 'needs_confirmation']);
export const REVIEW_STATES = Object.freeze(['confirmed', 'needs_review']);

const DRAFT_KEYS = new Set(['items', 'warnings']);
const ITEM_KEYS = new Set(['id', 'kind', 'text', 'next_action', 'sources']);
const SOURCE_KEYS = new Set(['document_id', 'quote']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function rejectUnknownKeys(obj, allowed, where) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) throw new Error(`${where}에 허용되지 않은 필드 "${key}"가 있습니다.`);
  }
}

// Validates the 1-3 source records and returns normalized copies with IDs doc1..docN.
export function normalizeDocuments(documents) {
  if (!Array.isArray(documents)) throw new Error('작업 기록은 배열이어야 합니다.');
  if (documents.length < 1 || documents.length > MAX_DOCUMENTS) {
    throw new Error(`작업 기록은 1–${MAX_DOCUMENTS}개여야 합니다(현재 ${documents.length}개).`);
  }
  let total = 0;
  const normalized = documents.map((doc, index) => {
    const expectedId = `doc${index + 1}`;
    if (!isPlainObject(doc)) throw new Error(`작업 기록 ${expectedId}는 객체여야 합니다.`);
    if (doc.id !== undefined && doc.id !== expectedId) {
      throw new Error(`${index + 1}번째 작업 기록의 ID는 "${expectedId}"여야 합니다(현재 ${JSON.stringify(doc.id)}).`);
    }
    if (doc.title !== undefined && typeof doc.title !== 'string') {
      throw new Error(`작업 기록 ${expectedId}의 제목은 문자열이어야 합니다.`);
    }
    if (!isNonEmptyString(doc.text)) throw new Error(`작업 기록 ${expectedId}의 내용이 비어 있습니다. 내용을 넣거나 마지막 기록을 삭제하세요.`);
    total += doc.text.length;
    const title = typeof doc.title === 'string' && doc.title.trim() !== '' ? doc.title.trim() : `Untitled ${expectedId}`;
    return { id: expectedId, title, text: doc.text };
  });
  if (total > MAX_TOTAL_TEXT) {
    throw new Error(`작업 기록 합계가 ${total}자입니다. 한도는 ${MAX_TOTAL_TEXT}자입니다.`);
  }
  return normalized;
}

export function buildPrompt(documents) {
  const docs = normalizeDocuments(documents);
  const lines = [
    'You are preparing a work handoff from the AI-agent work records below.',
    'Return ONLY a single JSON object (no Markdown fences, no commentary) with this exact shape:',
    '',
    '{',
    '  "items": [',
    '    {',
    '      "id": "item1",',
    '      "kind": "completed | in_progress | blocked | needs_confirmation",',
    '      "text": "One concise statement about the work.",',
    '      "next_action": "Optional concrete next step, or omit this field.",',
    '      "sources": [ { "document_id": "doc1", "quote": "exact text copied from doc1" } ]',
    '    }',
    '  ],',
    '  "warnings": ["Optional notes about missing or unclear information."]',
    '}',
    '',
    'Rules:',
    '- Every item needs a unique string "id", a "kind" from the four values above, a non-empty "text", and at least one source.',
    `- "document_id" must be one of: ${docs.map((d) => d.id).join(', ')}.`,
    '- Each "quote" must be copied character-for-character from that record (same spacing, punctuation, and case). Do not paraphrase, merge, or add ellipses. Keep quotes short, ideally one sentence or line.',
    '- Use "completed" only when a record states the work was done. A plan, intention, or TODO is "in_progress" or "needs_confirmation", not "completed".',
    '- If records disagree or a claim cannot be verified from the records, use "needs_confirmation" and cite each relevant record.',
    '- Do not invent facts, file names, results, or next steps. If information is missing, say so in "warnings" instead of guessing.',
    '- Use no fields other than those shown.',
    '',
    'Source records:',
  ];
  for (const doc of docs) {
    lines.push('', `===== BEGIN ${doc.id}: ${doc.title} =====`, doc.text, `===== END ${doc.id} =====`);
  }
  return lines.join('\n');
}

// Agents often wrap their JSON reply in a Markdown code fence (```json ... ```).
// Returns the inner text when the whole input is exactly one fenced block, otherwise null.
export function unwrapCodeFence(text) {
  const match = /^\s*```[\w-]*[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```\s*$/.exec(String(text));
  return match ? match[1] : null;
}

// Parses and validates an agent JSON draft against the source records.
// Returns { items, warnings } where each item starts as needs_review with an original snapshot.
export function validateDraft(documents, draftJson) {
  const docs = normalizeDocuments(documents);
  const byId = new Map(docs.map((d) => [d.id, d]));

  if (typeof draftJson !== 'string') throw new Error('초안은 JSON 텍스트여야 합니다.');
  if (draftJson.trim() === '') throw new Error('초안이 비어 있습니다. 에이전트가 돌려준 JSON을 붙여넣으세요.');
  if (draftJson.length > MAX_DRAFT_LENGTH) {
    throw new Error(`초안이 ${draftJson.length}자입니다. 한도는 ${MAX_DRAFT_LENGTH}자입니다.`);
  }

  let draft;
  try {
    draft = JSON.parse(draftJson);
  } catch (err) {
    throw new Error(`초안이 올바른 JSON이 아닙니다. 에이전트 답변 중 JSON 부분만 붙여넣었는지 확인하세요. (${err.message})`);
  }

  if (!isPlainObject(draft)) throw new Error('초안은 "items" 배열을 가진 JSON 객체여야 합니다.');
  rejectUnknownKeys(draft, DRAFT_KEYS, '초안');
  if (!Array.isArray(draft.items)) throw new Error('초안의 "items"는 배열이어야 합니다.');
  if (draft.items.length === 0) throw new Error('초안의 "items"에 항목이 하나 이상 있어야 합니다.');

  let warnings = [];
  if (draft.warnings !== undefined) {
    if (!Array.isArray(draft.warnings) || !draft.warnings.every((w) => typeof w === 'string')) {
      throw new Error('초안의 "warnings"는 문자열 배열이어야 합니다.');
    }
    warnings = draft.warnings.slice();
  }

  const seenIds = new Set();
  const items = draft.items.map((item, index) => {
    const where = `${index + 1}번째 항목`;
    if (!isPlainObject(item)) throw new Error(`${where}은(는) 객체여야 합니다.`);
    rejectUnknownKeys(item, ITEM_KEYS, where);
    if (!isNonEmptyString(item.id)) throw new Error(`${where}에 비어 있지 않은 문자열 "id"가 필요합니다.`);
    const label = `항목 "${item.id}"`;
    if (seenIds.has(item.id)) throw new Error(`항목 id "${item.id}"가 중복됩니다.`);
    seenIds.add(item.id);
    if (!KINDS.includes(item.kind)) {
      throw new Error(`${label}의 kind ${JSON.stringify(item.kind)}는 허용되지 않습니다. ${KINDS.join(', ')} 중 하나여야 합니다.`);
    }
    if (!isNonEmptyString(item.text)) throw new Error(`${label}에 비어 있지 않은 "text"가 필요합니다.`);
    if (item.next_action !== undefined && typeof item.next_action !== 'string') {
      throw new Error(`${label}의 "next_action"은 문자열이어야 합니다(없으면 null 대신 필드를 빼세요).`);
    }
    if (!Array.isArray(item.sources) || item.sources.length === 0) {
      throw new Error(`${label}에 비어 있지 않은 "sources" 배열이 필요합니다.`);
    }
    const sources = item.sources.map((source, sIndex) => {
      const sWhere = `${label}의 ${sIndex + 1}번째 출처`;
      if (!isPlainObject(source)) throw new Error(`${sWhere}는 객체여야 합니다.`);
      rejectUnknownKeys(source, SOURCE_KEYS, sWhere);
      if (typeof source.document_id !== 'string' || !byId.has(source.document_id)) {
        throw new Error(`${sWhere}가 없는 기록 ${JSON.stringify(source.document_id)}를 가리킵니다.`);
      }
      if (!isNonEmptyString(source.quote)) throw new Error(`${sWhere}에 비어 있지 않은 "quote"가 필요합니다.`);
      const doc = byId.get(source.document_id);
      const offset = doc.text.indexOf(source.quote);
      if (offset === -1) {
        throw new Error(`${sWhere} 인용문이 ${doc.id}("${doc.title}") 원문에 글자 그대로 없습니다. 띄어쓰기·문장부호·대소문자까지 같아야 합니다.`);
      }
      return { document_id: doc.id, quote: source.quote, offset };
    });
    const nextAction = typeof item.next_action === 'string' ? item.next_action : '';
    return {
      id: item.id,
      kind: item.kind,
      text: item.text,
      next_action: nextAction,
      sources,
      review_state: 'needs_review',
      original: { kind: item.kind, text: item.text, next_action: nextAction },
    };
  });

  return { items, warnings };
}

// Returns true when a reviewed field differs from the original AI draft value.
export function changedFields(item) {
  const original = item.original || {};
  return ['kind', 'text', 'next_action'].filter((key) => (item[key] ?? '') !== (original[key] ?? ''));
}

// Untrusted multi-line text becomes an indented code block, so Markdown renderers show it
// literally (raw HTML, links, and emphasis are not interpreted). Must follow a blank line
// after a paragraph, never directly inside a list.
function codeBlock(text) {
  return String(text).split(/\r\n|\r|\n/).map((line) => (line === '' ? '' : `    ${line}`)).join('\n');
}

// Untrusted single-line text becomes an inline code span; newlines collapse to spaces.
function inlineCode(text) {
  const value = String(text).replace(/\s*[\r\n]+\s*/g, ' ');
  if (value.trim() === '') return '(none)';
  const runs = value.match(/`+/g) || [];
  const fence = '`'.repeat(Math.max(0, ...runs.map((r) => r.length)) + 1);
  const pad = /^`|`$/.test(value) ? ' ' : '';
  return `${fence}${pad}${value}${pad}${fence}`;
}

export function exportMarkdown(documents, reviewedItems, warnings = []) {
  const docs = normalizeDocuments(documents);
  const byId = new Map(docs.map((d) => [d.id, d]));
  if (!Array.isArray(reviewedItems)) throw new Error('Reviewed items must be an array.');
  const items = reviewedItems;
  const warningList = Array.isArray(warnings) ? warnings : [];
  for (const item of items) {
    if (!isNonEmptyString(item.text)) throw new Error(`항목 "${item.id}"의 내용이 비어 있습니다. 내보내기 전에 내용을 입력하세요.`);
  }

  const confirmed = items.filter((i) => i.review_state === 'confirmed').length;
  const pending = items.length - confirmed;

  const out = ['# Work Handoff', ''];
  out.push(`- Items: ${items.length} (confirmed: ${confirmed}, needs review: ${pending})`);
  out.push('- Source quotations were checked for exact presence in the source records only; the app does not verify that claims are true.');
  if (pending > 0) {
    out.push(`- **Human review required:** ${pending} item(s) are not confirmed and must be reviewed before relying on them.`);
  }
  out.push('', '## Source records', '');
  for (const doc of docs) out.push(`- ${inlineCode(doc.id)}: ${inlineCode(doc.title)} (${doc.text.length} characters)`);

  out.push('', '## Warnings', '');
  if (warningList.length === 0) out.push('- None reported by the draft.');
  for (const w of warningList) out.push(`- ${inlineCode(w)}`);

  out.push('', '## Items');
  items.forEach((item, index) => {
    const state = item.review_state === 'confirmed' ? 'confirmed' : 'needs_review';
    const changed = changedFields(item);
    out.push('', `### ${index + 1}. ${inlineCode(item.id)} — ${inlineCode(item.kind)}`, '');
    out.push(`- Review state: **${state}**${state === 'needs_review' ? ' (human review required)' : ''}`);
    out.push(`- Kind: ${inlineCode(item.kind)}`);
    out.push(`- Next action: ${inlineCode(item.next_action ?? '')}`);
    out.push(`- Edited by reviewer: ${changed.length ? changed.join(', ') : 'no'}`);
    out.push('', 'Final text:', '', codeBlock(item.text));
    if (changed.length && item.original) {
      out.push('', 'Original AI draft:', '');
      out.push(`- Kind: ${inlineCode(item.original.kind)}`);
      out.push(`- Next action: ${inlineCode(item.original.next_action ?? '')}`);
      out.push('', 'Original AI text:', '', codeBlock(item.original.text));
    }
    for (const source of item.sources || []) {
      const doc = byId.get(source.document_id);
      const title = doc ? doc.title : '(unknown record)';
      out.push('', `Source ${inlineCode(source.document_id)} ${inlineCode(title)} quote:`, '', codeBlock(source.quote));
    }
  });

  return `${out.join('\n').trimEnd()}\n`;
}
