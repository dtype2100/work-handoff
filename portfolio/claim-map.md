# AI Harness portfolio: claims and sources

The current review copy is Claude Design version 11 (provisional, 11 slides):
`output/pdf/AI-Harness-Portfolio-2026-v11.pdf` with a matching
`output/pptx/AI-Harness-Portfolio-2026-v11.pptx`. This public snapshot includes
the v11 pair. PPTX pages are full-slide images of the PDF; text in the PPTX is not
individually editable, and the private Claude Design canvas is the editable
source. The three named artifacts (Work Handoff, AI Evidence Review, the agent
work coordination skill) are independent implementations or operating examples,
not one connected runtime. Slides carry no source footers since v10; sources
live in this file.

v11 reflects Work Handoff on `main` at `993c93f` (merge of the source-location
picker and the two draft paths; README updated in `ecc1028`). It stays
provisional only for slide 2's repository column: ai-evidence-review and
work-handoff are not yet publicly reachable.

## Revision history

- **v11:** new slide 2 (profile and repositories) after the cover; former slides
  2–10 became 3–11 and every slide-number reference was shifted (cover row, slide
  4 flow and footer notes, slide 11 row labels). Work Handoff is presented with
  two draft paths (Claude CLI direct, other AI via prompt/JSON) and the source
  record location picker on slides 4, 7, 8 and 11. Slide 8 uses captures of
  `main` `993c93f`, with the item3 review screen as the main image. Slide 7 puts
  quotes, review state and edit history first; slides 10–11 put the review loop
  and the unresolved / sample_size 0 / precision null verdict ahead of test
  counts, which remain as small evidence notes. Slide 11's expected effects are
  one short line each. Slide 5 (r6) now presents file-based memory as a design
  flow and uses the real wiki index path `llm-wiki/wiki/index.md`.
- **v10:** removed slide 2's "그래서 분리" bar (the cover already presents AI
  claim, deterministic check, human judgment) and enlarged the two problem cases;
  removed the small bottom-left source line on every slide, keeping the rule and
  "AI Harness · NN / total"; moved slide 7's footer-only limitation into the body.
- **v9:** replaced the v1 Work Handoff statements ("no model call, upload or
  persistent save", "CSP connect-src 'none'") with the v2 local Claude CLI flow;
  new real Claude CLI demo and Korean UI screenshots.

## Profile (slide 2)

Verified by the portfolio writer in the user's logged-in LinkedIn profile
(`https://www.linkedin.com/in/진웅-이-0088421a9/`) on 2026-09-28: display name
이진웅; headline "AI Engineer | RAG | Python · LangGraph · FastAPI"; about text
"LangGraph·vLLM·FastAPI 기반 온프레미스(On-premise) RAG 솔루션을 설계·구축하는 3년차
AI 엔지니어입니다." The profile also lists (주)PCN, 한국외국어대학교 and skills;
by user instruction these, contact details, follower counts and job-seeking
status are not on the slide. Slide text:

- "이진웅 | 3년차 AI 엔지니어" and "LangGraph·vLLM·FastAPI 기반 온프레미스 RAG
  솔루션 설계·구축": from the about text.
- "이번 포트폴리오: AI 에이전트 결과를 근거·검토 상태와 함께 인계하는 도구": a
  summary of the work shown in this deck, not a LinkedIn statement.

Repository column, checked by the portfolio writer on 2026-09-28 with
`gh repo view` and an anonymous request to `https://github.com/dtype2100/<repo>`:

| Artifact | Status | Slide shows |
|---|---|---|
| Agent work coordination skill | `dtype2100/orca-orchestrate-engineering` PUBLIC, anonymous HTTP 200 | the URL as a public link |
| AI Evidence Review | `dtype2100/ai-evidence-review` PRIVATE, anonymous HTTP 404 | "비공개 · 공개 준비 중", no URL |
| Work Handoff | no `dtype2100/work-handoff` repository, anonymous HTTP 404 | "저장소 공개 준비 중", no URL |

Recheck both non-public entries before any final export; replace a status label
with its URL only after an anonymous request returns 200.

## Work Handoff data boundary (slides 4, 7, 8, 11)

Source: `README.md`, `web/index.html`, `web/app.js`, `web/server.py`,
`web/handoff.js` on `main` at `993c93f` / `ecc1028`. The portfolio writer reran
`node --test` on that checkout on 2026-09-28: 81 tests, 81 pass, 0 fail, and read
the three button labels in `web/index.html`.

- **Records in:** drag and drop, file picker, paste, or **원본 기록 위치 선택**.
  The location picker uses the browser's own folder dialog (read-only) and lists
  text record candidates only inside the folder the user picks; ticked files are
  imported with the same checks as the file picker. The app writes nothing to
  that folder and keeps no absolute path, handle, list or permission after
  reload. Chromium desktop browsers only. The native folder dialog itself was not
  exercised in the portfolio captures (slide 8 shows the button only).
  Independent QA (root agent, 2026-09-28): candidate listing, paging and import
  passed only with synthetic directory handles; completing a real native folder
  pick is unverified, because on this Mac the dialog auto-cancelled in Neo and its
  "선택" button stayed disabled in Chrome, the same as with a minimal unrelated
  localhost page (no evidence of an app defect). Slides describe the
  implementation only and claim no real-user success with the picker.
- **Path A, "Claude CLI로 바로 초안 만들기":** the app sends nothing until the
  user presses this button. Then the page posts the prompt, which contains the
  record text, to `POST /api/draft` on the local Python server (standard library,
  bound to 127.0.0.1). The server runs the already signed-in `claude -p` CLI
  (stdin, no shell, no tools/MCP/settings, empty temp directory, API key and
  alternate billing variables removed). Prompt and records go to Anthropic's
  Claude. This is not local inference.
- **Path B, "다른 AI에서 초안 만들기":** opens the manual section, builds the
  prompt and moves focus to the copy button; the user pastes it into any AI chat
  and pastes the JSON reply back. The app does not call or integrate with any
  other AI.
- Both paths use the same `validateDraft` schema and exact-quote check, review
  beside the originals, and a Markdown download. Every item starts as needs
  review.
- No new API key, subscription change or payment step: path A uses the user's
  existing Claude login (a paid Claude plan whose usage applies). No persistent
  app storage. CSP `connect-src 'self'` is used only for the local endpoint. The
  server checks Host, Origin, content type, size and time, and does not log
  record text.
- Browser QA of the merged build (keyboard flow, fabricated-quote rejection,
  accessibility tree with the three buttons) was reported by the root agent; the
  portfolio writer confirmed the buttons in its own capture.
- Not claimed: truth or conflict judgment, prompt-injection prevention, data-leak
  guarantees, security effect, calls to other AIs.

## Claims by slide (v11 numbering)

| Slide | Claim or displayed evidence | Source and limit |
|---|---|---|
| 1 | AI claim, deterministic check, review state and handoff are the organizing model. Work Handoff is the principal service. The coordination skill is directly designed and authored. Cover row points to slides 04–05 · 07–09, 06 and 10. | Framing from the artifacts below and the user's authorship statement. The cover diagram is conceptual; no end-to-end run across all three artifacts was observed. |
| 2 | Profile lines and the three-artifact table with repository status. | See "Profile" above. |
| 3 | Two migration logs say “finished on Tuesday” and “still running as of Wednesday.” The code-review case lacks how tests ran and who judged them. | `examples/conflict/sources.json` is synthetic. The code-review pattern is an illustration, not an observed incident or quotation. |
| 4 | Records (1–3, ≤20,000 characters; drag/drop, file picker, paste or source location picker) → path A or path B draft → schema and exact-quote check → review beside originals → Markdown. The app sends records only on the path A button; path B is copied by the user. The location picker shows only candidates inside the folder the user picks, read-only; the app writes nothing there. | See the data boundary section. The checker does not judge truth or semantic conflict. A next agent's use of the file was not observed. |
| 5 | Design flow, not an observed practice: a person can leave rule/contract files (`AGENTS.md`, `docs/run-contract.md`), the decision wiki index (`llm-wiki/wiki/index.md`, each claim labelled user-stated / repo-verified / observed / unresolved) and `work-handoff.md`, and a later task instruction can name the handoff file to reopen. | Work Handoff `AGENTS.md` and `docs/run-contract.md`; agent-workspace `llm-wiki/SCHEMA.md` (labels) and `llm-wiki/wiki/index.md` (path checked 2026-09-28). This public snapshot includes `docs/run-contract.md`; the local `AGENTS.md` and agent-workspace wiki are not included. No current `AGENTS.md` or run-contract instruction tells an agent to reopen a handoff file, so the slide says "다시 열도록 지정할 수 있음". No automatic sync or sharing, no app storage, no observed reuse or measured effect. v11 r6 fixed the earlier wrong path `llm-wiki/index.md` and the unsupported line that `AGENTS.md` directs the reopening. |
| 6 | AI Evidence Review separates `validate`, `check`, `report` and `evaluate`. A local fixture reproduces a pre-fix urllib3 exception-type defect; its verdict is `unresolved`, `sample_size 0`, `precision null`. | ai-evidence-review repository (private when checked; no public URL yet): `README.md`, `cases/urllib3-fingerprint-5211/{findings,check,verdicts}.json`; upstream [issue #5211](https://github.com/urllib3/urllib3/issues/5211) and [PR #5212](https://github.com/urllib3/urllib3/pull/5212). Not whole-package validation or an independent discovery/fix; others merged the upstream PR. 27 local tests (rerun 2026-09-27) are a local check, not a performance measure. |
| 7 | Implementation steps and the boundary box; excerpt of the exported Markdown with three emphasized groups: quotes (item3 cites doc1 and doc2 once each), review state (item3 needs_review, item1 confirmed), edit history (item3 next_action edited, original AI value kept). Summary, scope and human-review lines shown smaller. Source-record and warning rows omitted and noted. Small note: Node tests 81. | `portfolio/assets/work-handoff-real-reviewed.md` (the exported file from the demo). Lines are verbatim; long lines abbreviated with “…”. |
| 8 | Captures of `main` `993c93f` running locally: the import button row (with 원본 기록 위치 선택), the two draft buttons, and, as the main image, the item3 review card with the edited next action, retained original AI value, needs-review state and the doc1 quote position (character 98). | `portfolio/assets/work-handoff-main-993c93f-full.png` and `portfolio/assets/work-handoff-main-993c93f-item3.png` (portfolio writer's captures, 2026-09-28) and their crops `work-handoff-main-import-buttons.png`, `work-handoff-main-btn-claude.png`, `work-handoff-main-btn-other-ai.png`, `work-handoff-main-item3-focus.png`. Records are the built-in synthetic example. The review screen was recreated by pasting the saved real Claude draft (`portfolio/assets/work-handoff-real-draft.json`) into the JSON box and editing item3's next action as in the AI-agent review; no new Claude call was made and no human user was involved. The folder dialog was not opened. |
| 9 | Built-in synthetic records → one real Claude CLI draft (path A: 5 items, 6 quotes, 3 warnings; all 6 quotes matched exactly) → review operated by a Codex AI agent: item3 next action edited and left needs review, item1 confirmed, items 2, 4, 5 needs review; export 1 confirmed, 4 needs review. | Records: `web/example.js` `EXAMPLE_DOCUMENTS` (synthetic). Draft: `portfolio/assets/work-handoff-real-draft.json`; the portfolio writer reran `validateDraft`: 5 items, 6 sources, 3 warnings, no error. Export: `portfolio/assets/work-handoff-real-reviewed.md`. No human-user result; one demo is not an accuracy measure. The conflict was reported by the model; the app does not detect conflicts. |
| 10 | The coordination skill separates writer, read-only reviewer and acceptance roles. Main flow: re-review found one CR line-break gap after eight fixes → the original writer fixed it (a test writer added a regression test) → the same reviewer rechecked PASS. Small note: final review recorded `node --test` 64/64 and `diff --check`. | [`SKILL.md`](https://github.com/dtype2100/orca-orchestrate-engineering/blob/master/SKILL.md) in the public repository; local Orca run `run_0b2336ab328a`. Orca was the execution environment; no claim of authoring Orca. All writing, review and coordination were agent sessions. 64/64 is that earlier run, not the current suite. The skill does not connect to the app at runtime. |
| 11 | Observed results vs intended effects. Work Handoff: real Claude draft with 6 exact quotes (synthetic records); 5-item file (1 confirmed, 4 needs review); AI-agent review, human-user review not observed; two draft paths (other AI by prompt/JSON copy); no app storage; small note Node 81/81. AI Evidence Review: the largest text is the verdict unresolved · sample_size 0 · precision null. Skill: re-review → original writer fix → same reviewer PASS; small note 64/64. Expected effects, one line each. | Sources above. Time savings, detection accuracy, real-user adoption, security effects and file-memory benefit were not measured. No claim of automatic truth/conflict judgment, prompt-injection prevention, data-leak guarantees, automatic cross-session memory, or independent urllib3 discovery/fix. |

## Build

`portfolio/build-from-design.mjs` (pptxgenjs 3.12.0 from `package-lock.json`)
rasterizes each page of the v11 PDF at 144 dpi with `pdftoppm`, checks there are
11 pages, and places each as a full-slide 13.333 × 7.5 in image. Links: it reads
the PDF's link annotations with `pdftohtml -xml` and places a fully transparent
1×1 PNG with the same `https://` hyperlink over each linked text box (0.04 in
padding), so the PPTX stays visually identical and carries only links the PDF
itself has. Run `npm run build` in `portfolio/`. To revise wording, update the
Claude Design canvas, export a new PDF, change the filename (and page count) in
the builder, and rebuild. The Design session produces each PDF by rendering its
saved artboards, not through the Design app's export menu.

| Version | Pages | SHA-256 (PDF) | PPTX check |
|---|---|---|---|
| v11 (provisional: repository column) | 11 | `170bc45c30c9055d51cf0f40504b7c8b9e5dcf5d89b6d3190f2f0a18ea3b641b` | 11/11 slide images byte-identical to the PDF render; 1 link (slide 2, orca-orchestrate-engineering) matches the PDF link annotation |

When ai-evidence-review and work-handoff become public: recheck each with an
anonymous request (HTTP 200), replace the status label on slide 2 with the URL
as a PDF link, re-export, and rebuild; the builder then adds the PPTX links
automatically.
