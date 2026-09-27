# AI Harness portfolio: claims and sources

## Current version · v14 (16 slides)

Deliverables: `output/pdf/AI-Harness-Portfolio-2026-v14.pdf` and the matching
`output/pptx/AI-Harness-Portfolio-2026-v14.pptx`. The PDF retains searchable
text and links. PPTX pages are full-slide images of the PDF, so text in the
PPTX is not individually editable. The three cases are independent work, not
one connected runtime. Generated images on slides 4, 11 and 13 are editorial
illustrations, not product screenshots or measured evidence. The overview has
no image background so its text and diagram remain readable. Slide 16 is a
separate end slate; observed results and expected effects remain on slide 15.

| Slide | Point | Source and limit |
|---|---|---|
| 1–3 | Portfolio frame, profile and problem. | Slide 2 profile came from the user's logged-in LinkedIn on 2026-09-28. Its three public GitHub links were anonymously reachable when checked. The conflicting-log example on slide 3 is synthetic. |
| 4 | Work Handoff section. | Generated illustration, not evidence. |
| 5–7 | Record → selected AI draft → exact-quote and schema check → review → Markdown. File-based context can be reopened by a next agent. | `web/index.html`, `web/app.js`, `web/server.py`, `web/handoff.js`, `portfolio/assets/work-handoff-real-reviewed.md`; `agent-workspace/CLAUDE.md` and `llm-wiki/wiki/index.md`. No automatic runtime connection, app persistence, truth judgment or observed next-agent reuse. |
| 8 | One AI selection and one primary button: Claude CLI automatic, ChatGPT/GPT·Gemini·Codex·other AI manual. | Actual browser capture `portfolio/assets/work-handoff-provider-options-v14.png`, GPT selected before sending records. Independent QA observed 0 `/api/draft` calls on manual GPT/Gemini paths and 1 local request with a fake CLI on the Claude path. No real Claude call in that QA pass. |
| 9–10 | Enlarged review screen and synthetic-record demo with a real Claude draft and AI-agent review. | `portfolio/assets/work-handoff-main-item3-focus.png`, `work-handoff-real-draft.json`, `work-handoff-real-reviewed.md`. Five items, six exact-match quotes; one confirmed and four needing review. The reviewer was an AI agent, not a human user. The native folder dialog was not completed on this Mac. |
| 11 | AI Evidence Review section. | Generated illustration, with no performance implication. |
| 12 | `validate`, `check`, `report`, `evaluate`; `unresolved`, `sample_size 0`, `precision null`. | Public `dtype2100/ai-evidence-review`, local `cases/urllib3-fingerprint-5211/`. This is a pre-fix fixture, not an independent discovery/fix or whole-package validation. |
| 13 | Agent coordination section. | Generated illustration. The coordination SKILL.md is authored by the portfolio owner; Orca itself is not. |
| 14 | `agent-workspace` rules/decision files → separate Orca worktrees/sessions → coordinator acceptance; re-review → original writer correction → same reviewer PASS. | `agent-workspace/CLAUDE.md`, `llm-wiki/wiki/index.md`, `plugins/tower-core/skills/project-preflight/SKILL.md`; public `dtype2100/orca-orchestrate-engineering/SKILL.md`; Orca run `run_0b2336ab328a`. Tower queue/fix automation is not claimed as used in this loop. All roles were agent sessions. No runtime link to Work Handoff. |
| 15 | Observed outputs beside expected effects. | Time saved, accuracy, security benefits, real-user adoption and cross-session memory benefits were not measured. |
| 16 | End slate and GitHub profile link. | Closing sentence states design intent, not a measured result. |

For Claude CLI, pressing **Claude로 초안 만들기** posts the prompt and source
text to localhost `/api/draft`; the signed-in CLI sends them to Anthropic's
Claude. The other selections use **프롬프트 준비하기** and user copy/paste; the app
does not connect to those AI services. Both paths share validation, per-item
review and Markdown export. A matching quote does not establish truth.

Current build: `portfolio/slide10-control-tower.typ` produced the revised
coordination page in v12; `portfolio/section-pages-v14.typ` adds the case
dividers, AI selection, enlarged review screen and end slate;
`portfolio/content-overlays-v14.typ` changes page numbers and route wording;
`portfolio/assemble-v14.py` redacts superseded text and assembles the PDF.
Then `cd portfolio && npm ci && npm run build` builds the PPTX from the PDF at
144 dpi and carries its HTTPS links. IBM Plex files in `portfolio/fonts/` are
redistributed under OFL.

## Previous versions

Earlier decks and their detailed claim notes remain in Git history.
