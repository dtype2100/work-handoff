# Work Handoff

A local, dependency-free web page that turns AI-agent work records into a human-reviewed
handoff. Select Claude CLI, ChatGPT/GPT, Gemini, Codex, or another AI, then use one draft
button. Claude CLI can run through your existing sign-in; for every other selection the app
prepares a prompt that you copy into your AI chat and paste the JSON reply back. The app does
not connect to those other AIs. No API key, new subscription, payment, or
added dependency is needed. Both drafts go through the same checks: the app checks that every quote in the draft appears exactly in your records, and then you
review each item. An AI draft is never confirmed automatically.

This is **not local AI inference**. With Claude CLI selected, when you press **Claude로 초안 만들기**, the source
records and the drafting instructions go to Anthropic's Claude through the `claude` CLI, and
your Claude plan's usage applies. Nothing is sent before you press the button. If you do
not want to send a record to Claude through the app, select a manual AI option instead.

## Portfolio

- [AI Harness portfolio PDF](output/pdf/AI-Harness-Portfolio-2026-v16.pdf)
- [Matching PowerPoint](output/pptx/AI-Harness-Portfolio-2026-v16.pptx)
- [Claims and source map](portfolio/claim-map.md)

## Run

Requires Python 3 (standard library only) and, for AI drafts, Claude Code (`claude`) already
logged in (`claude` → `/login`).

```sh
python3 web/server.py            # or: python3 web/server.py --port 8123
```

Then open <http://127.0.0.1:8000/>. The server binds 127.0.0.1 only.

Serving `web/` with any other static server (for example `python3 -m http.server --directory web`)
still works for the manual flow and the built-in sample. Claude CLI selection then reports
that the draft API is unavailable.

### What `web/server.py` does

- Serves the static files in `web/` and one endpoint, `POST /api/draft`, which takes
  `{"prompt": "..."}` built in the browser by `buildPrompt` and returns `{"draft": "..."}`
  (Claude's raw reply) or `{"error": "<Korean message>"}`.
- Runs `claude -p --output-format json` through `subprocess` with an argument list and the
  prompt on stdin (no shell). The session has no built-in tools (`--tools ""`), no MCP
  servers (`--strict-mcp-config` with an empty config), no user/project settings or hooks
  (`--setting-sources ""`), no slash commands, and no saved session
  (`--no-session-persistence`). It runs in a fresh empty temporary directory.
  API keys and alternate API/billing routes (`ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`,
  `ANTHROPIC_BASE_URL`, and the Bedrock, Vertex, and Foundry switches, keys, and URLs) are
  removed from its environment, so the CLI uses its existing sign-in. Settings managed by an
  organization still apply to the CLI.
- Limits: request body 256 KiB, prompt 40,000 characters, CLI output 1 MiB, draft 200,000
  characters, 180-second timeout, one draft at a time.
- Accepts a POST only when `Host` is exactly `127.0.0.1:<port>` or `localhost:<port>`,
  `Origin` is the matching `http://` origin, and `Content-Type` is `application/json`. Other
  websites open in your browser therefore cannot call it. GET requests with any other `Host`
  are refused (DNS-rebinding guard).
- Logs only the request line and status. It never logs record text, prompts, or Claude output.
- Reports specific Korean errors for: CLI not found or not runnable, text that cannot be
  encoded as UTF-8, not logged in, usage limit reached,
  server overloaded, timeout, CLI failure, and unreadable, empty, or oversized output. The
  manual fallback stays available in every case.
- `WORK_HANDOFF_CLAUDE_BIN` (CLI path, default `claude`) and `WORK_HANDOFF_CLAUDE_TIMEOUT`
  (seconds, default 180) override the defaults, for example to run against a fake CLI in tests.

## Flow (one page)

The page UI is in Korean.

1. **작업 기록 넣기 (records)**: drag and drop local text files onto the dashed box, press
   **파일 고르기** (file picker), or **직접 붙여넣기** (paste into a new record). 1–3 records,
   combined text ≤ 20,000 characters, IDs `doc1`..`doc3` by position. Files are read in the
   browser as strict UTF-8, so a file in another encoding is rejected instead of being
   changed silently. Each file name becomes the title. Files fill empty record slots in place,
   then new slots, so existing records keep their IDs. The page starts with no
   record card, so the AI button stays on the first screen. A card appears when you add a file
   or press **직접 붙여넣기**, and deleting the last record returns to that empty state. Each record shows its
   ID, editable title, character count, a short preview, a collapsible full-text editor, and
   a delete button. Nothing is truncated: adding more files than free slots, an oversized,
   empty, or binary file adds nothing and says why. A combined total over the limit is kept
   as entered, and a red counter says how much to cut.
   **원본 기록 위치 선택** (source record location) is for when the records to hand off sit
   in one folder, such as an agent's session logs. The browser's own folder dialog
   (`showDirectoryPicker`, read-only) picks the folder; the page then lists text record
   candidates inside it (`.txt .md .markdown .log .json .csv`), newest first, with the path
   relative to the chosen folder, modification time, size, and a short preview. Search by
   file name or path, show 20 more at a time, tick up to the number of free record slots, and
   press **고른 기록 불러오기**. Ticked files go through the same checks as the file picker
   (strict UTF-8, size, empty, binary, free slots, whole batch or nothing) and fill only empty
   slots, so existing records, the draft, and the review are not replaced; the title is the
   chosen folder name plus the relative path. Ticked files hidden by a later search are still
   imported, and the counter says how many are hidden. Search matches the folder name and
   relative path. Only one import runs at a time: a drop, file pick, or folder import started
   while files are still being read adds nothing and says so, and free slots are counted again
   after reading, so records added meanwhile are never overwritten and the limit of 3 holds. For a single source file use **파일 고르기**. Limits:
   - This location is only where the source records are read from. It is not where the app
     saves anything or where the Markdown export goes; the app writes nothing there.
   - Browsers do not reveal the absolute path of a picked folder, so the page shows the
     folder name and relative paths only. Access covers that one folder for the current page;
     the app keeps no handle, list, or permission after reload.
   - Supported only in Chromium desktop browsers (Chrome, Edge) on `localhost` or HTTPS.
     Firefox and Safari do not provide `showDirectoryPicker`; the button then explains how to
     use the file picker or drag and drop instead. Browsers may refuse system folders.
   - Hidden folders (starting with `.`), `node_modules`, `__pycache__`, and `venv` are
     skipped; the scan stops at 6 folder levels and 5,000 entries and says so, so pick a
     narrower folder if a record is missing. Unreadable subfolders or files are left out and
     counted. A file over the size limit is listed but cannot be ticked. An empty file is
     disabled when the first 2 KB contains the whole file; a larger whitespace-only file can
     be ticked but is rejected on import. Non-UTF-8 or binary content found in the first 2 KB
     preview also disables a file, and anything else is caught on import.
   - Each folder pick gets an in-memory ID that records imported from it carry (not sent to
     Claude or exported). Only a file imported from the current pick and still on the page is
     labeled "이 선택에서 이 페이지의 docN로 불러옴" and cannot be ticked again. Every other
     file is labeled neutrally "선택하면 새 기록으로 추가": the app does not claim it is absent
     from the page, because the same file may already be there through a re-pick of the same
     folder, a parent folder, the file picker, or paste. The app keeps no history, so it cannot
     tell whether a file was handed off or reviewed before.
   - Nothing is sent to Claude until you select Claude CLI and press **Claude로 초안 만들기**.

   **예시로 체험하기** loads a built-in
   Korean example ([`web/example.js`](web/example.js)) with a hand-written sample JSON draft
   that is labeled as not produced by Claude.
2. **AI 초안 만들기 (AI draft)**: choose an AI, then press the single primary button. Claude
   CLI runs automatically; ChatGPT/GPT, Gemini, Codex, and other AI selections prepare a
   prompt for you to copy. Both routes use the same `validateDraft`, review, and export, and
   neither judges whether a claim is true.
   - **Claude CLI · 자동**: the button reads **Claude로 초안 만들기**. The note explains that
     records go through the local CLI to Anthropic's Claude only when you press it. The reply goes into the draft box and
     is validated immediately. If validation fails, the error is shown, and the collapsible
     manual section opens with the draft editable.
   - **ChatGPT/GPT, Gemini, Codex, 다른 AI · 직접**: the button reads **프롬프트 준비하기**. It opens the collapsible manual section, makes the
     prompt, and moves focus to **프롬프트 복사**. The app sends nothing and is not connected
     to any other AI: you copy the prompt (template: [`prompts/handoff.md`](prompts/handoff.md))
     into any AI chat yourself, paste the JSON reply into **JSON 초안**, and press
     **초안 검증**. With no records yet, it says to add records first. If the whole reply is a single Markdown
     code fence (```` ```json ... ``` ````), the fence lines are removed from the text box
     before validation and the status says so. `validateDraft` itself still rejects fenced
     input.
   - **자세한 사용 안내 (collapsed)**: the step-by-step guide.
3. **사람이 검토하기 (review)**: each item shows its cited quotations. The original records
   stay on screen with the quotes highlighted. Edit kind, text, and next action, then mark
   each item *확인함* (confirmed) or *검토 필요* (needs review). Every item starts as
   *Needs review*, including items from an AI draft.
4. **내보내기 (export)**: download `work-handoff.md`. The Markdown headings and labels stay in
   English. Record text, quotes, and edited text appear exactly as entered. The file includes source titles and
   quotes, review state, next action, warnings, the original AI values when a reviewer edited
   them, and a note that unconfirmed items need human review.

Behaviors that keep the review in sync with its inputs:

- Record IDs follow position. Deleting a record other than the last renumbers the later ones
  (`doc3` becomes `doc2`). When a draft or review exists, the page asks before doing that,
  because the draft's citations would then point at different records.
- Editing any source record clears the generated prompt. Generate it again before copying.
- If the records change while an AI draft is being made, the reply is put in the draft box
  but not validated, and the page says so.
- Export is disabled when any of these is true: a source record or the draft text changed
  after validation, the latest validation was rejected, or an item's text is blank. The
  previous review stays on screen, and export comes back after a valid draft is validated.
- Validating the same draft against the same sources again keeps your edits and review
  states. Validating a changed draft replaces the review. If the current review has edits or
  confirmations, the page asks first (before sending, for the AI button). If you decline, the
  review stays and export stays off.
- If the JSON draft box holds text that has not been validated, the AI button asks before
  replacing it.
- If you edit the JSON draft box while Claude is working, the reply is discarded instead of
  overwriting your edit. If you edit the review while Claude is working, the reply goes into
  the draft box unvalidated and the review is left alone. The page says which happened.
- "Show in original" moves keyboard focus to the highlighted quote in the original record.

## Markdown output

The export treats every title, warning, next action, item text, and quote as untrusted:

- Single-line values (record titles, warnings, kinds, next actions, IDs) are written as
  inline code spans. Line breaks are collapsed to spaces.
- Multi-line free text (final item text, the original AI text) and source quotes are
  written as indented code blocks (four spaces), so they keep their line breaks.

Because of this, raw HTML, links, and Markdown syntax in the source or draft appear as
literal text in any CommonMark renderer instead of being interpreted. Leading and trailing
blank lines in a text block are not preserved.

## Draft schema

```json
{
  "items": [
    {
      "id": "item1",
      "kind": "completed",
      "text": "Added the login form.",
      "next_action": "Run the browser check.",
      "sources": [{ "document_id": "doc1", "quote": "Added the login form" }]
    }
  ],
  "warnings": ["Test results were not included in the records."]
}
```

- `kind` must be one of `completed`, `in_progress`, `blocked`, `needs_confirmation`.
- `id` must be a unique, non-empty string. `text` must not be empty. `next_action` is an
  optional string. Omit it when there is none, because `null` is rejected. `sources` must be a non-empty array.
- Each `quote` must be a non-empty, **exact** substring (case, spacing, and punctuation
  must match) of the cited `document_id`.
- The validator rejects malformed JSON, unknown fields, unknown document IDs, missing or
  non-exact quotes, duplicate IDs, invalid kinds, wrong source counts, and input over the
  limits (20,000 characters of source text; 200,000 characters of draft JSON).

## What validation does *not* do

This applies to AI drafts and manual drafts alike. The validator checks that each quotation exists in the record. It does **not** check that a claim is
true, that a quote supports the claim, or whether records conflict. That is the reviewer's
job. Conflicts and gaps appear only when the agent reports them (for example, as
`needs_confirmation` items or `warnings`), and a person has to confirm them.

## Module API (`web/handoff.js`)

Pure functions with no DOM, network, or storage access (the network call lives in `web/app.js`). They are usable from Node:

- `buildPrompt(documents) -> string` (the prompt text stays in English)
- `validateDraft(documents, draftJson) -> { items, warnings }` (throws `Error` on invalid
  input). Each item is `{ id, kind, text, next_action, sources: [{ document_id, quote, offset }],
  review_state: 'needs_review', original: { kind, text, next_action } }`.
- `exportMarkdown(documents, reviewedItems, warnings) -> string`
- `unwrapCodeFence(text) -> string | null`: the inner text when `text` is exactly one fenced
  code block, otherwise `null`.

Error messages are in Korean.

`documents` is an array of `{ id?, title, text }`. When `id` is present, it must equal
`doc1`, `doc2`, or `doc3` in order.

## Safety

- All user and agent text is rendered with `textContent` or DOM text nodes, never as HTML.
- A Content-Security-Policy on the page blocks external scripts and allows network
  connections only to the page's own origin (`connect-src 'self'`), which is the local
  `/api/draft` endpoint. Only the AI draft button uses it.
- The download is created in the browser with a `Blob`. The app uses no persistent
  browser storage (no `localStorage`, `sessionStorage`, IndexedDB, or cookies). Some browsers
  may restore form values after a reload, and a downloaded Markdown file stays wherever you
  save it.

## Tests

```sh
node --test
```
