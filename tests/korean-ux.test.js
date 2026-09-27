// Covers the input helpers added for first-time Korean users: the built-in example and
// unwrapping a Markdown code fence around a pasted agent reply.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDraft, unwrapCodeFence, MAX_DOCUMENTS, MAX_TOTAL_TEXT } from '../web/handoff.js';
import { EXAMPLE_DOCUMENTS, EXAMPLE_DRAFT } from '../web/example.js';

const withIds = (docs) => docs.map((d, i) => ({ id: `doc${i + 1}`, ...d }));

test('built-in example draft passes exact-quote validation against the example records', () => {
  assert.ok(EXAMPLE_DOCUMENTS.length >= 1 && EXAMPLE_DOCUMENTS.length <= MAX_DOCUMENTS);
  assert.ok(EXAMPLE_DOCUMENTS.reduce((n, d) => n + d.text.length, 0) <= MAX_TOTAL_TEXT);
  const { items, warnings } = validateDraft(withIds(EXAMPLE_DOCUMENTS), EXAMPLE_DRAFT);
  assert.equal(items.length, 3);
  assert.ok(items.every((i) => i.review_state === 'needs_review'), 'example items still start unconfirmed');
  assert.ok(items.some((i) => i.kind === 'needs_confirmation'), 'example shows a conflict left for the reviewer');
  assert.ok(warnings.length > 0, 'example shows missing information as a warning');
});

test('example draft is rejected when a record no longer contains its quote', () => {
  const docs = withIds(EXAMPLE_DOCUMENTS);
  docs[0] = { ...docs[0], text: docs[0].text.replace('42개', '41개') };
  assert.throws(() => validateDraft(docs, EXAMPLE_DRAFT), /글자 그대로/);
});

test('unwrapCodeFence returns the inner JSON of a single fenced block', () => {
  const json = '{"items":[]}';
  assert.equal(unwrapCodeFence('```json\n' + json + '\n```'), json);
  assert.equal(unwrapCodeFence('  ```\r\n' + json + '\r\n```  \n'), json);
  assert.equal(unwrapCodeFence('```json\n{\n  "a": 1\n}\n```'), '{\n  "a": 1\n}');
});

test('unwrapCodeFence leaves anything else alone, so malformed input is still rejected', () => {
  assert.equal(unwrapCodeFence('{"items":[]}'), null);
  assert.equal(unwrapCodeFence('Here is the JSON:\n```json\n{}\n```'), null);
  assert.equal(unwrapCodeFence('```json\n{}'), null);
  const docs = [{ id: 'doc1', title: 'T', text: 'did the thing' }];
  assert.throws(() => validateDraft(docs, '```json\n{"items":[]}\n```'), Error, 'validator itself does not accept fences');
});
