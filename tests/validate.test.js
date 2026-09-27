import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateDraft } from '../web/handoff.js';
import { loadExample, oneDoc, draftOf, item } from './helpers.js';

const DOC = 'We did the thing today. Next we plan to ship it.';

// Every rejection must be a real Error with a message the UI can show.
function assertRejects(documents, draftText) {
  assert.throws(
    () => validateDraft(documents, draftText),
    (err) => {
      assert.ok(err instanceof Error, 'must throw an Error instance');
      assert.equal(typeof err.message, 'string');
      assert.ok(err.message.trim().length > 0, 'error message must be non-empty');
      return true;
    },
  );
}

describe('exact citations', () => {
  test('normal example: every item accepted with kinds, text, next_action and sources preserved', () => {
    const { documents, draftText, draft } = loadExample('normal');
    const result = validateDraft(documents, draftText);
    assert.ok(Array.isArray(result.items));
    assert.ok(Array.isArray(result.warnings));
    assert.equal(result.items.length, draft.items.length);
    for (const expected of draft.items) {
      const got = result.items.find((i) => i.id === expected.id);
      assert.ok(got, `item ${expected.id} missing from result`);
      assert.equal(got.kind, expected.kind);
      assert.equal(got.text, expected.text);
      if (expected.next_action === undefined) {
        assert.ok(got.next_action === undefined || got.next_action === '');
      } else {
        assert.equal(got.next_action, expected.next_action);
      }
      assert.deepEqual(
        got.sources.map((s) => ({ document_id: s.document_id, quote: s.quote })),
        expected.sources,
      );
    }
  });

  test('a quote that is an exact substring (mid-line) is accepted', () => {
    const result = validateDraft(oneDoc(DOC), draftOf([item()]));
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].sources[0].quote, 'did the thing');
  });

  test('invalid-quote example: fabricated quote rejects the draft', () => {
    const { documents, draftText } = loadExample('invalid-quote');
    assertRejects(documents, draftText);
  });

  test('quote with changed wording is rejected', () => {
    const draft = draftOf([item({ sources: [{ document_id: 'doc1', quote: 'did the work' }] })]);
    assertRejects(oneDoc(DOC), draft);
  });

  test('quote with different letter case is rejected (exact match, not fuzzy)', () => {
    const draft = draftOf([item({ sources: [{ document_id: 'doc1', quote: 'Did The Thing' }] })]);
    assertRejects(oneDoc(DOC), draft);
  });

  test('empty quote is rejected even though "" is a substring of everything', () => {
    const draft = draftOf([item({ sources: [{ document_id: 'doc1', quote: '' }] })]);
    assertRejects(oneDoc(DOC), draft);
  });

  test('quote present in another document but cited to the wrong document is rejected', () => {
    const documents = [
      { id: 'doc1', title: 'A', text: 'Alpha work finished.' },
      { id: 'doc2', title: 'B', text: 'Beta work started.' },
    ];
    const draft = draftOf([item({ sources: [{ document_id: 'doc1', quote: 'Beta work started.' }] })]);
    assertRejects(documents, draft);
  });

  test('unknown document_id is rejected', () => {
    const draft = draftOf([item({ sources: [{ document_id: 'doc4', quote: 'did the thing' }] })]);
    assertRejects(oneDoc(DOC), draft);
  });

  test('document_id for a slot the user did not fill (doc2 with one record) is rejected', () => {
    const draft = draftOf([item({ sources: [{ document_id: 'doc2', quote: 'did the thing' }] })]);
    assertRejects(oneDoc(DOC), draft);
  });

  test('one bad source among good ones rejects the draft', () => {
    const draft = draftOf([
      item({
        sources: [
          { document_id: 'doc1', quote: 'did the thing' },
          { document_id: 'doc1', quote: 'shipped to production' },
        ],
      }),
    ]);
    assertRejects(oneDoc(DOC), draft);
  });

  test('missing sources array is rejected', () => {
    const { sources, ...noSources } = item();
    assertRejects(oneDoc(DOC), draftOf([noSources]));
  });

  test('empty sources array is rejected', () => {
    assertRejects(oneDoc(DOC), draftOf([item({ sources: [] })]));
  });

  test('source missing quote or document_id is rejected', () => {
    assertRejects(oneDoc(DOC), draftOf([item({ sources: [{ document_id: 'doc1' }] })]));
    assertRejects(oneDoc(DOC), draftOf([item({ sources: [{ quote: 'did the thing' }] })]));
  });
});

describe('schema checks', () => {
  test('malformed JSON is rejected with an Error (not a silent empty result)', () => {
    assertRejects(oneDoc(DOC), '{"items": [ {"id": "i1", ');
    assertRejects(oneDoc(DOC), "{items: []}");
    assertRejects(oneDoc(DOC), '');
  });

  test('top-level value that is not an object with an items array is rejected', () => {
    assertRejects(oneDoc(DOC), JSON.stringify([item()]));
    assertRejects(oneDoc(DOC), JSON.stringify({ items: 'none' }));
    assertRejects(oneDoc(DOC), JSON.stringify({ warnings: [] }));
    assertRejects(oneDoc(DOC), 'null');
  });

  test('duplicate item IDs are rejected', () => {
    const draft = draftOf([item({ id: 'dup' }), item({ id: 'dup', text: 'Other claim.' })]);
    assertRejects(oneDoc(DOC), draft);
  });

  test('invalid status/kind values are rejected', () => {
    for (const kind of ['done', 'planned', 'Completed', '', null]) {
      assertRejects(oneDoc(DOC), draftOf([item({ kind })]));
    }
  });

  test('each allowed kind is accepted', () => {
    for (const kind of ['completed', 'in_progress', 'blocked', 'needs_confirmation']) {
      const result = validateDraft(oneDoc(DOC), draftOf([item({ kind })]));
      assert.equal(result.items[0].kind, kind);
    }
  });

  test('missing or non-string id is rejected', () => {
    const { id, ...noId } = item();
    assertRejects(oneDoc(DOC), draftOf([noId]));
    assertRejects(oneDoc(DOC), draftOf([item({ id: 7 })]));
  });

  test('empty or missing text is rejected', () => {
    assertRejects(oneDoc(DOC), draftOf([item({ text: '' })]));
    const { text, ...noText } = item();
    assertRejects(oneDoc(DOC), draftOf([noText]));
  });

  test('non-string next_action is rejected', () => {
    assertRejects(oneDoc(DOC), draftOf([item({ next_action: 42 })]));
    assertRejects(oneDoc(DOC), draftOf([item({ next_action: ['a'] })]));
  });

  test('next_action: null is rejected (omit the field instead)', () => {
    assertRejects(oneDoc(DOC), draftOf([item({ next_action: null })]));
  });

  test('empty items array is rejected', () => {
    assertRejects(oneDoc(DOC), draftOf([]));
    assertRejects(oneDoc(DOC), draftOf([], ['only a warning']));
  });

  test('unknown top-level field is rejected', () => {
    assertRejects(oneDoc(DOC), JSON.stringify({ items: [item()], summary: 'extra' }));
  });

  test('unknown item field is rejected', () => {
    assertRejects(oneDoc(DOC), draftOf([item({ confidence: 0.9 })]));
    assertRejects(oneDoc(DOC), draftOf([item({ status: 'completed' })]));
  });

  test('unknown source field is rejected', () => {
    assertRejects(
      oneDoc(DOC),
      draftOf([item({ sources: [{ document_id: 'doc1', quote: 'did the thing', line: 1 }] })]),
    );
  });

  test('non-object item or source is rejected', () => {
    assertRejects(oneDoc(DOC), draftOf(['did the thing']));
    assertRejects(oneDoc(DOC), draftOf([null]));
    assertRejects(oneDoc(DOC), draftOf([item({ sources: ['did the thing'] })]));
  });

  test('warnings that are not an array of strings are rejected', () => {
    assertRejects(oneDoc(DOC), draftOf([item()], 'watch out'));
    assertRejects(oneDoc(DOC), draftOf([item()], [1, 2]));
  });

  test('draft warnings are passed through', () => {
    const result = validateDraft(oneDoc(DOC), draftOf([item()], ['Check owner.']));
    assert.ok(result.warnings.includes('Check owner.'));
  });

  test('omitted warnings still yields a warnings array', () => {
    const result = validateDraft(oneDoc(DOC), draftOf([item()]));
    assert.ok(Array.isArray(result.warnings));
  });
});

describe('input limits', () => {
  test('combined source text of exactly 20,000 characters is accepted', () => {
    const text = 'did the thing ' + 'x'.repeat(20000 - 'did the thing '.length);
    assert.equal(text.length, 20000);
    const result = validateDraft(oneDoc(text), draftOf([item()]));
    assert.equal(result.items.length, 1);
  });

  test('combined source text over 20,000 characters is rejected', () => {
    const half = 'did the thing ' + 'y'.repeat(10000 - 'did the thing '.length);
    const documents = [
      { id: 'doc1', title: 'A', text: half },
      { id: 'doc2', title: 'B', text: half + 'z' },
    ];
    assert.equal(documents[0].text.length + documents[1].text.length, 20001);
    assertRejects(documents, draftOf([item()]));
  });

  test('more than three source records is rejected', () => {
    const documents = [1, 2, 3, 4].map((n) => ({ id: `doc${n}`, title: `R${n}`, text: 'did the thing' }));
    assertRejects(documents, draftOf([item()]));
  });
});

describe('meaning is carried by the draft, not invented by the validator', () => {
  test('normal example: planned production deploy is not labelled completed', () => {
    const { documents, draftText } = loadExample('normal');
    const { items } = validateDraft(documents, draftText);
    const planned = items.filter((i) => i.sources.some((s) => /^Plan:/.test(s.quote)));
    assert.ok(planned.length > 0, 'fixture must contain a planned-work item');
    for (const p of planned) {
      assert.notEqual(p.kind, 'completed', `planned item ${p.id} must not be completed`);
    }
  });

  test('validator preserves kind exactly; it never upgrades in_progress to completed', () => {
    const doc = oneDoc('Plan: deploy to production on Friday.');
    const draft = draftOf([
      item({ kind: 'in_progress', sources: [{ document_id: 'doc1', quote: 'Plan: deploy to production on Friday.' }] }),
    ]);
    assert.equal(validateDraft(doc, draft).items[0].kind, 'in_progress');
  });

  test('conflict example: represented as needs_confirmation with both exact quotes from both records', () => {
    const { documents, draftText } = loadExample('conflict');
    const { items, warnings } = validateDraft(documents, draftText);
    const conflict = items.find((i) => i.id === 'conflict-1');
    assert.ok(conflict);
    assert.equal(conflict.kind, 'needs_confirmation');
    const byDoc = Object.fromEntries(conflict.sources.map((s) => [s.document_id, s.quote]));
    assert.equal(byDoc.doc1, 'Migration finished on Tuesday; row counts matched.');
    assert.equal(byDoc.doc2, 'Migration still running as of Wednesday morning; 60% of rows copied.');
    assert.ok(documents[0].text.includes(byDoc.doc1));
    assert.ok(documents[1].text.includes(byDoc.doc2));
    assert.ok(warnings.includes('Session A and Session B give conflicting migration status.'));
  });

  test('no automatic semantic conflict detection: a one-sided draft over conflicting records is accepted unchanged', () => {
    // The validator checks quote presence only. It must not claim to detect
    // that doc2 contradicts this item, nor silently rewrite the kind.
    const { documents } = loadExample('conflict');
    const draft = draftOf([
      item({
        id: 'one-sided',
        kind: 'completed',
        text: 'Migration is finished.',
        sources: [{ document_id: 'doc1', quote: 'Migration finished on Tuesday; row counts matched.' }],
      }),
    ]);
    const { items } = validateDraft(documents, draft);
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, 'completed');
    assert.equal(items[0].text, 'Migration is finished.');
  });

  test('missing-info example: unknowns stay needs_confirmation with no invented next_action', () => {
    const { documents, draftText } = loadExample('missing-info');
    const { items, warnings } = validateDraft(documents, draftText);
    for (const id of ['rel-2', 'rel-3']) {
      const it = items.find((i) => i.id === id);
      assert.ok(it, `${id} missing`);
      assert.equal(it.kind, 'needs_confirmation');
      assert.ok(it.next_action === undefined || it.next_action === '', `${id} must not gain a next_action`);
    }
    assert.ok(warnings.includes('Rollback owner and release date are unknown; do not assume them.'));
  });

  test('validator does not mutate the documents it checks against', () => {
    const { documents, draftText } = loadExample('normal');
    const before = JSON.stringify(documents);
    validateDraft(documents, draftText);
    assert.equal(JSON.stringify(documents), before);
  });
});

describe('HTML-like text', () => {
  test('HTML-like quote that exists in the source is accepted and kept verbatim', () => {
    const payload = 'Saw <script>alert("x")</script> & <img src=x onerror=alert(1)> in the log.';
    const draft = draftOf([
      item({ text: 'Log contained <b>markup</b>.', sources: [{ document_id: 'doc1', quote: payload }] }),
    ]);
    const { items } = validateDraft(oneDoc(`Line 1.\n${payload}\nLine 3.`), draft);
    assert.equal(items[0].sources[0].quote, payload);
    assert.equal(items[0].text, 'Log contained <b>markup</b>.');
  });
});
