# AI Harness portfolio: claims and sources

## Current version · v16 (16 slides)

Deliverables: `output/pdf/AI-Harness-Portfolio-2026-v16.pdf` and the matching
`output/pptx/AI-Harness-Portfolio-2026-v16.pptx`. The PDF retains searchable
text and links. PPTX pages are full-slide images of the PDF, so text in the
PPTX is not individually editable. The three cases are independent work, not
one connected runtime. Generated images on slides 4, 11 and 13 are editorial
illustrations, not product screenshots or measured evidence. The overview has
no image background so its text and diagram remain readable. Slide 16 is a
separate end slate. Slide 15 now compresses three observed local scenarios and
their possible use into one page; practical effects remain unmeasured.

| Slide | Point | Source and limit |
|---|---|---|
| 1–2 | Portfolio frame and profile. | Slide 2 profile came from the user's logged-in LinkedIn on 2026-09-28. Its three public GitHub links were anonymously reachable when checked. v16 adds one clickable link to the user-provided LinkedIn URL. |
| 3 | Two records say “complete” and “still running”; an AI code-review claim and a failed fixed check require different judgments. | The record example is synthetic (`examples/conflict/sources.json`), and whether the notes refer to the same run is unknown. The code-review side is a structure illustration, not a quote from a specific review. A failing check does not prove the model's cause claim. |
| 4 | Work Handoff section. | Generated illustration, not evidence. |
| 5–7 | Record → selected AI draft → exact-quote and schema check → review → Markdown. File-based context can be reopened by a next agent. | `web/index.html`, `web/app.js`, `web/server.py`, `web/handoff.js`, `portfolio/assets/work-handoff-real-reviewed.md`; `agent-workspace/CLAUDE.md` and `llm-wiki/wiki/index.md`. No automatic runtime connection, app persistence, truth judgment or observed next-agent reuse. Slide 5's redundant independent-case note and slide 7's test-count footnote were removed in v15. |
| 8 | One AI selection and one primary button: Claude CLI automatic, ChatGPT/GPT·Gemini·Codex·other AI manual. | Actual browser capture `portfolio/assets/work-handoff-provider-options-v14.png`, GPT selected before sending records. Independent QA observed 0 `/api/draft` calls on manual GPT/Gemini paths and 1 local request with a fake CLI on the Claude path. No real Claude call in that QA pass. |
| 9–10 | Enlarged review screen and synthetic-record demo with a real Claude draft and AI-agent review. | `portfolio/assets/work-handoff-main-item3-focus.png`, `work-handoff-real-draft.json`, `work-handoff-real-reviewed.md`. Five items, six exact-match quotes; one confirmed and four needing review. The reviewer was an AI agent, not a human user. The native folder dialog was not completed on this Mac. |
| 11 | AI Evidence Review section. | Generated illustration, with no performance implication. |
| 12 | `validate`, `check`, `report`, `evaluate`; `unresolved`, `sample_size 0`, `precision null`. | Public `dtype2100/ai-evidence-review`, local `cases/urllib3-fingerprint-5211/`. This is a pre-fix fixture, not an independent discovery/fix or whole-package validation. |
| 13 | Agent coordination section. | Generated illustration. The coordination SKILL.md is authored by the portfolio owner; Orca itself is not. |
| 14 | `agent-workspace` rule/decision files and preflight → task contract with scope, ownership and acceptance → Orca task/dispatch to isolated writers and a read-only reviewer → coordinator collects `worker_done` and review findings → correction returns to original owners → same reviewer PASS → coordinator accepts the integrated result. | `agent-workspace/CLAUDE.md`, `llm-wiki/wiki/index.md`, `plugins/tower-core/skills/project-preflight/SKILL.md`; public `dtype2100/orca-orchestrate-engineering/SKILL.md`; Orca run `run_0b2336ab328a`, including separate lone-CR implementation, regression-test and re-review tasks. Tower queue/fix automation is not claimed as used in this loop. All roles were agent sessions; no human review was observed and the skill does not run inside Work Handoff. |
| 15 | Three concrete use scenarios: agent-session handoff, AI code-review evidence, and supervised agent collaboration. Each separates observed local output from expected use. | Sources and limits from slides 9–10, 12 and 14. The handoff records are synthetic, the urllib3 check is a pre-fix local fixture, and the reviewer roles were AI agents. Next-agent use, human-user review, time saved, accuracy, security benefits, real-user adoption and cross-session memory benefits were not measured. |
| 16 | End slate and GitHub profile link. | Closing sentence states design intent, not a measured result. |

For Claude CLI, pressing **Claude로 초안 만들기** posts the prompt and source
text to localhost `/api/draft`; the signed-in CLI sends them to Anthropic's
Claude. The other selections use **프롬프트 준비하기** and user copy/paste; the app
does not connect to those AI services. Both paths share validation, per-item
review and Markdown export. A matching quote does not establish truth.

Current build: `portfolio/assemble-v16.py` starts from the reviewed v15 PDF,
replaces three authored declarative phrases on slide 3 using
`portfolio/slide03-v16.typ`, and adjusts one cover line and adds the LinkedIn
link with `portfolio/cover-profile-v16.typ`. Then
`portfolio/replace-v16-headings.py` replaces six authored headings on slides
6, 7, 8, 9, 11 and 14 using `portfolio/headings-v16.typ`. Verbatim AI draft,
Markdown excerpts and natural explanatory sentences remain unchanged. The v15
assembly and source files remain for reference.
Then `cd portfolio && npm ci && npm run build` builds the PPTX from the PDF at
144 dpi and carries its HTTPS links. IBM Plex files in `portfolio/fonts/` are
redistributed under OFL.

## Previous versions

Earlier decks and their detailed claim notes remain in Git history.
