import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateDraft, exportMarkdown } from '../web/handoff.js';
import { loadExample, oneDoc, draftOf, item, reviewed, assertInIndentedCode, assertNoActiveHtml } from './helpers.js';

function validated(name) {
  const ex = loadExample(name);
  return { ...ex, ...validateDraft(ex.documents, ex.draftText) };
}

test('export returns a string containing item text, next action, source titles and quotes', () => {
  const { documents, items, warnings } = validated('normal');
  const md = exportMarkdown(documents, items.map((i) => reviewed(i, { review_state: 'confirmed' })), warnings);
  assert.equal(typeof md, 'string');
  for (const it of items) {
    assert.ok(md.includes(it.text), `missing text of ${it.id}`);
    if (it.next_action) assert.ok(md.includes(it.next_action), `missing next_action of ${it.id}`);
    for (const s of it.sources) assert.ok(md.includes(s.quote), `missing quote "${s.quote}"`);
  }
  assert.ok(md.includes(documents[0].title));
});

test('export shows each item review state', () => {
  const { documents, items, warnings } = validated('normal');
  const [a, b, ...rest] = items;
  const md = exportMarkdown(
    documents,
    [reviewed(a, { review_state: 'confirmed' }), reviewed(b, { review_state: 'needs_review' }), ...rest.map((i) => reviewed(i))],
    warnings,
  );
  assert.match(md, /confirmed/i);
  assert.match(md, /needs[_ ]review/i);
});

test('export always carries a note that unconfirmed entries need human review', () => {
  const { documents, items, warnings } = validated('normal');
  const md = exportMarkdown(documents, items.map((i) => reviewed(i)), warnings);
  assert.match(md, /human review/i);
});

test('edited item: export shows both the original AI draft text and the final text', () => {
  const { documents, items, warnings } = validated('normal');
  const target = items[0];
  const finalText = 'Rounding bug fixed (integer cents); regression test added and passing.';
  const rows = items.map((i) =>
    i.id === target.id
      ? reviewed(i, { review_state: 'confirmed', edits: { text: finalText, next_action: 'Monitor totals after deploy.' } })
      : reviewed(i),
  );
  const md = exportMarkdown(documents, rows, warnings);
  assert.ok(md.includes(finalText), 'final text missing');
  assert.ok(md.includes(target.text), 'original AI text missing');
  assert.ok(md.includes('Monitor totals after deploy.'), 'edited next action missing');
});

test('edited kind: export shows the final kind chosen by the reviewer', () => {
  const documents = oneDoc('We did the thing today.');
  const { items } = validateDraft(documents, draftOf([item({ kind: 'completed' })]));
  const md = exportMarkdown(documents, [reviewed(items[0], { edits: { kind: 'blocked' } })], []);
  assert.match(md, /blocked/);
});

test('conflict example: export keeps needs_confirmation and both exact quotes with both titles', () => {
  const { documents, items, warnings } = validated('conflict');
  const md = exportMarkdown(documents, items.map((i) => reviewed(i)), warnings);
  assert.match(md, /needs_confirmation|needs confirmation/i);
  assert.ok(md.includes('Migration finished on Tuesday; row counts matched.'));
  assert.ok(md.includes('Migration still running as of Wednesday morning; 60% of rows copied.'));
  assert.ok(md.includes(documents[0].title));
  assert.ok(md.includes(documents[1].title));
});

test('missing-info example: warnings exported and unknowns not resolved', () => {
  const { documents, items, warnings } = validated('missing-info');
  const md = exportMarkdown(documents, items.map((i) => reviewed(i)), warnings);
  assert.ok(md.includes('Rollback owner and release date are unknown; do not assume them.'));
  assert.ok(md.includes('Rollback owner: TBD.'));
  assert.match(md, /needs[_ ]review/i);
});

describe('Markdown safety', () => {
  const script = '<script>alert("x")</script>';
  const img = '<img src=x onerror=alert(1)>';
  const sourceLine = `Saw ${script} and ${img} in the log.`;
  const documents = [{ id: 'doc1', title: 'Log <b>dump</b> <script>t()</script>', text: `Header\n${sourceLine}\nFooter` }];
  const { items, warnings } = validateDraft(
    documents,
    draftOf(
      [item({ text: `Log contained ${script}.`, next_action: `Strip ${img} from logs.`, sources: [{ document_id: 'doc1', quote: sourceLine }] })],
      [`Warning with ${script}`],
    ),
  );

  test('quotes and item text appear byte-for-byte inside indented code blocks', () => {
    const md = exportMarkdown(documents, items.map((i) => reviewed(i)), warnings);
    assertInIndentedCode(assert, md, sourceLine, 'quote');
    assertInIndentedCode(assert, md, `Log contained ${script}.`, 'item text');
  });

  test('edited multi-line text and the original AI text both sit in indented code blocks', () => {
    const finalText = `Line one <b>bold</b>\n${img}\n# not a heading`;
    const md = exportMarkdown(documents, [reviewed(items[0], { edits: { text: finalText } })], warnings);
    assertInIndentedCode(assert, md, finalText, 'final edited text');
    assertInIndentedCode(assert, md, `Log contained ${script}.`, 'original AI text');
    assertNoActiveHtml(assert, md);
  });

  test('lone CR and CRLF in AI text and final text stay inside the indented code block', () => {
    // CommonMark treats a lone CR as a line ending, so the segment after it
    // must be indented too or it escapes the code block as live Markdown/HTML.
    const docs = oneDoc('We did the thing today.');
    const aiText = `AI line one\r${script}\r\nAI line three`;
    const { items: crItems } = validateDraft(docs, draftOf([item({ text: aiText })]));
    const finalText = `Final line one\r${img}\rFinal line three`;
    const md = exportMarkdown(docs, [reviewed(crItems[0], { edits: { text: finalText } })], []);
    assertInIndentedCode(assert, md, aiText, 'original AI text with CR');
    assertInIndentedCode(assert, md, finalText, 'final text with lone CR');
    assertNoActiveHtml(assert, md);
  });

  test('titles, warnings and next actions cannot become active HTML, but their content is kept', () => {
    const md = exportMarkdown(documents, items.map((i) => reviewed(i)), warnings);
    assertNoActiveHtml(assert, md);
    assert.match(md, /Log .*dump/, 'title content missing');
    assert.match(md, /Warning with/, 'warning content missing');
    assert.match(md, /Strip .*from logs\./, 'next action content missing');
  });

  test('reviewer edits to next_action with HTML-like text stay inert', () => {
    const md = exportMarkdown(
      documents,
      [reviewed(items[0], { edits: { next_action: `Ping <a href="javascript:alert(1)">ops</a>` } })],
      warnings,
    );
    assertNoActiveHtml(assert, md);
    assert.match(md, /Ping /);
  });

  test('plain text without HTML still exports unchanged', () => {
    const { documents: docs, items: its, warnings: ws } = validated('normal');
    const md = exportMarkdown(docs, its.map((i) => reviewed(i)), ws);
    assertNoActiveHtml(assert, md);
    for (const it of its) {
      assertInIndentedCode(assert, md, it.text, `text of ${it.id}`);
      for (const s of it.sources) assertInIndentedCode(assert, md, s.quote, `quote of ${it.id}`);
    }
  });
});

describe('export rejects blank reviewed text', () => {
  const documents = oneDoc('We did the thing today.');
  const { items } = validateDraft(documents, draftOf([item()]));

  for (const [label, text] of [['empty', ''], ['whitespace-only', '   \n\t ']]) {
    test(`${label} edited text throws an Error`, () => {
      assert.throws(
        () => exportMarkdown(documents, [reviewed(items[0], { edits: { text } })], []),
        (err) => err instanceof Error && err.message.trim().length > 0,
      );
    });
  }
});

test('export does not mutate its inputs', () => {
  const { documents, items, warnings } = validated('normal');
  const rows = items.map((i) => reviewed(i));
  const snapshot = JSON.stringify({ documents, rows, warnings });
  exportMarkdown(documents, rows, warnings);
  assert.equal(JSON.stringify({ documents, rows, warnings }), snapshot);
});
