# Handoff drafting prompt

The app builds this prompt with `buildPrompt(documents)` in `web/handoff.js` and inserts the
source records as `doc1`..`doc3`. It is used in two ways:

- **AI draft button**: when the user presses **Claude로 초안 만들기**, the browser sends this
  prompt, including the full record text, to `web/server.py`. The server passes it on stdin
  to the locally signed-in `claude` CLI, which sends it to Anthropic's Claude. Nothing is sent
  before the button is pressed. The reply is validated like any pasted draft, and every item
  still starts as *needs review*.
- **Manual fallback**: copy the prompt into any existing AI agent session yourself and paste
  the agent's JSON reply back into the app. In this path the app sends nothing.

## Template

```text
You are preparing a work handoff from the AI-agent work records below.
Return ONLY a single JSON object (no Markdown fences, no commentary) with this exact shape:

{
  "items": [
    {
      "id": "item1",
      "kind": "completed | in_progress | blocked | needs_confirmation",
      "text": "One concise statement about the work.",
      "next_action": "Optional concrete next step, or omit this field.",
      "sources": [ { "document_id": "doc1", "quote": "exact text copied from doc1" } ]
    }
  ],
  "warnings": ["Optional notes about missing or unclear information."]
}

Rules:
- Every item needs a unique string "id", a "kind" from the four values above, a non-empty "text", and at least one source.
- "document_id" must be one of: doc1, doc2, doc3.   <- only the IDs actually entered
- Each "quote" must be copied character-for-character from that record (same spacing, punctuation, and case). Do not paraphrase, merge, or add ellipses. Keep quotes short, ideally one sentence or line.
- Use "completed" only when a record states the work was done. A plan, intention, or TODO is "in_progress" or "needs_confirmation", not "completed".
- If records disagree or a claim cannot be verified from the records, use "needs_confirmation" and cite each relevant record.
- Do not invent facts, file names, results, or next steps. If information is missing, say so in "warnings" instead of guessing.
- Use no fields other than those shown.

Source records:

===== BEGIN doc1: <title> =====
<text>
===== END doc1 =====
```

## Why these rules

- **Omit, don't null**: `next_action` is an optional string. The validator rejects
  `"next_action": null`, so the template tells the agent to leave the field out.

- **Exact quotes**: the app rejects any quote that is not a verbatim substring of the cited
  record. This proves the quote exists; it does not prove the item's claim is true, whether
  Claude or another agent wrote it.
- **Plan vs. complete**: agents often report intentions as done. The prompt asks for
  `in_progress` or `needs_confirmation` unless completion is stated.
- **Conflicts and gaps**: the app does not detect semantic conflicts. The prompt asks the
  agent to flag them as `needs_confirmation` or in `warnings`, and a human decides.
