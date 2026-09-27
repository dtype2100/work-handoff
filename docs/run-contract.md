# Work Handoff run contract

## Objective

Build a local web app that helps a person turn AI-agent work records into a reviewed handoff. The app can ask the user's already authenticated Claude CLI to draft JSON, then checks exact source quotations, supports human review/edit, and exports Markdown. A manual prompt and JSON path remains available. The app needs no model API key, new subscription, or payment.

## Audience and flow

One developer working across AI sessions. On one page: import 1–3 source records (title and text, combined text <=20,000 characters) by selecting a source folder, drag and drop, file picker, or paste; inspect and edit each record; explicitly request a Claude CLI draft or use the manual prompt/JSON path with another AI; validate citations; inspect originals; edit status/text/next action; mark each item confirmed or needs review; download Markdown. Folder selection lists candidate files from the user-chosen location in supported desktop browsers; the app imports only the files the user selects and does not retain folder access. The first screen prioritizes records and a clear next action. The long guide and manual prompt/JSON fields are secondary. Import shows titles, character counts, previews, and removal; it never silently truncates. An invalid draft stays editable, and original source records remain on screen. The UI is in Korean. The built-in example's sample draft is labeled as not agent-produced. A reply wrapped in a single Markdown code fence is unwrapped visibly in the draft box before validation; the validator itself still rejects non-JSON.

On the Claude CLI path, the browser sends the source records to a local server only after the user clicks the draft button. The server calls the authenticated Claude CLI through stdin without a shell, key, or added dependency. The UI states that Claude receives the records. The other-AI path only prepares a prompt and accepts JSON that the user brings back; it does not call another provider. Bind the server to localhost; restrict request origin, host, content type, size, execution time, and CLI tools. Do not log the records. Show actionable errors and retain the manual fallback. Generated items remain unconfirmed until a person reviews them. The app does not persist records.

## Draft contract

JSON object with `items` array and optional `warnings` string array. Each item has unique string `id`, `kind` (completed, in_progress, blocked, needs_confirmation), nonempty `text`, optional `next_action` string, and nonempty `sources` array. Each source has `document_id` and `quote`. Document IDs are assigned by the UI as doc1, doc2, doc3. An exact quote must occur in the identified document text. Reject missing/unknown citations, duplicate IDs, invalid status, excessive input, malformed JSON, and unexpected schema values with a visible error. The validator checks quotation presence, not whether a claim is true. No automatic semantic conflict detection claim.

## Review and export

For each valid item show source quotations alongside the original record. Let the user edit kind, text, and next action, and set confirmed or needs_review. Export includes source titles/quotes, original AI draft text and final text when edited, review state, next action, warnings, and a clear note that human review is required for unconfirmed entries. Use safe text rendering, no HTML injection. Source text is sent to Claude only on the AI path; there is no persistent app storage.

## Independent checks

Use built-in test tools, no framework. Retain checks for normal input; fabricated/unknown quote; plan-vs-complete; conflicting source records represented as needs_confirmation; missing information left unresolved; malformed JSON; duplicate IDs; over-limit input; HTML-like text roundtrip. Add a small HTTP check with a fake Claude executable for the local trust boundary and a browser check of import, keyboard navigation, errors, edit, confirmation, and Markdown download.

## Ownership

- Root: this contract, initial repo configuration, final acceptance.
- Claude Opus implementation: `web/`, `prompts/`, `README.md`. May not change tests or this contract.
- Separate Claude Opus test writer: `tests/`, `examples/`. May not change implementation or this contract.
- agy Gemini 3.8 Flash: read-only source research and evaluation suggestions; no source edits.
- Separate Claude Opus portfolio writer: `portfolio/`, `output/` after verified app evidence; no implementation edits.
- Copilot CLI: reviewed Git integration operations; no product/code changes.
- Fresh reviewer: read-only; sends findings to original owner.

## Acceptance

Service completes the local Claude draft path and manual fallback; tests and browser checks pass; one real agent-produced handoff is evaluated; every portfolio claim points to an observed artifact. PPTX and PDF have the same final content, and every PDF page is visually checked. Preserve existing ai-evidence-review unresolved evidence. Submit only after user review; user performs final application submission.
