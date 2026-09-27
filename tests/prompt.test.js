import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt } from '../web/handoff.js';
import { loadExample } from './helpers.js';

test('prompt includes every document id, title and full text verbatim', () => {
  const { documents } = loadExample('conflict');
  const prompt = buildPrompt(documents);
  assert.equal(typeof prompt, 'string');
  for (const doc of documents) {
    assert.ok(prompt.includes(doc.id), `missing ${doc.id}`);
    assert.ok(prompt.includes(doc.title), `missing title ${doc.title}`);
    assert.ok(prompt.includes(doc.text), `missing text of ${doc.id}`);
  }
});

test('prompt states the draft contract: JSON, items, all four kinds, sources with document_id and quote', () => {
  const prompt = buildPrompt(loadExample('normal').documents);
  assert.match(prompt, /JSON/);
  for (const token of [
    'items',
    'warnings',
    'id',
    'kind',
    'text',
    'next_action',
    'sources',
    'document_id',
    'quote',
    'completed',
    'in_progress',
    'blocked',
    'needs_confirmation',
  ]) {
    assert.ok(prompt.includes(token), `prompt must mention "${token}"`);
  }
});

test('prompt asks for exact quotes copied from the records', () => {
  const prompt = buildPrompt(loadExample('normal').documents);
  assert.match(prompt, /exact/i);
});

test('prompt keeps HTML-like source text literally (no escaping that would break exact quotes)', () => {
  const text = 'Error: <div class="x">&amp; </div>';
  const prompt = buildPrompt([{ id: 'doc1', title: 'T <i>1</i>', text }]);
  assert.ok(prompt.includes(text));
  assert.ok(prompt.includes('T <i>1</i>'));
});

test('prompt is deterministic for the same input', () => {
  const { documents } = loadExample('missing-info');
  assert.equal(buildPrompt(documents), buildPrompt(documents));
});
