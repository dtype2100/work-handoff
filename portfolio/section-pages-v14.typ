// Three case dividers, a real provider-selection capture and the final slate.
// Divider illustrations are generated assets; all other lettering is native PDF text.
#set page(width: 1440pt, height: 810pt, margin: 0pt)
#set text(font: "IBM Plex Sans KR")

#let ink = rgb("#1B1B20")
#let muted = rgb("#56565D")
#let blue = rgb("#2445B5")
#let ivory = rgb("#F3F1EA")
#let amber = rgb("#F3E3B0")

#let t(x, y, width, copy, size: 18pt, weight: "regular", fill: ink, font: "IBM Plex Sans KR") = {
  place(top + left, dx: x, dy: y)[
    #block(width: width)[#text(font: font, size: size, weight: weight, fill: fill)[#copy]]
  ]
}
#let bar(x, y, width, height, fill) = {
  place(top + left, dx: x, dy: y)[#rect(width: width, height: height, fill: fill, stroke: none)]
}
#let photo(path) = {
  place(top + left)[#image(path, width: 1440pt, height: 810pt, fit: "cover")]
}
#let footer(n) = {
  bar(66pt, 747pt, 1308pt, 1pt, ink)
  bar(1190pt, 754pt, 184pt, 30pt, ivory)
  t(1200pt, 761pt, 174pt, "AI Harness · " + n + " / 16", size: 13pt, fill: muted, font: "IBM Plex Mono")
}

// Page 04: local service case.
#photo("assets/divider-work-handoff-v13.png")
#t(66pt, 54pt, 500pt, "01 / SERVICE", size: 17pt, weight: "semibold", fill: blue, font: "IBM Plex Mono")
#bar(66pt, 91pt, 520pt, 2pt, ink)
#t(66pt, 262pt, 545pt, "Work", size: 72pt, weight: "bold")
#t(66pt, 345pt, 545pt, "Handoff", size: 72pt, weight: "bold")
#t(66pt, 462pt, 545pt, "원문·인용·검토 상태를", size: 24pt, weight: "medium")
#t(66pt, 499pt, 545pt, "함께 넘기는 로컬 서비스", size: 24pt, weight: "medium")
#t(66pt, 555pt, 545pt, "독립 구현 사례", size: 17pt, fill: muted)
#footer("04")
#pagebreak()

// Page 08: live-browser capture of the merged provider selector.
#bar(0pt, 0pt, 1440pt, 810pt, ivory)
#t(66pt, 47pt, 26pt, "08", size: 15pt, weight: "bold", fill: blue, font: "IBM Plex Mono")
#t(96pt, 46pt, 900pt, "Work Handoff · AI 선택", size: 16pt, fill: muted)
#t(66pt, 82pt, 1308pt, "한 번 선택하고 초안을 만든다", size: 42pt, weight: "bold")
#t(66pt, 148pt, 1308pt, "자동 실행은 Claude CLI, ChatGPT·Gemini·Codex·기타 AI는 프롬프트와 JSON을 직접 전달", size: 19pt, fill: muted)
#bar(66pt, 190pt, 1308pt, 2pt, ink)
#place(top + left, dx: 66pt, dy: 207pt)[
  #image("assets/work-handoff-provider-options-v14.png", width: 1308pt, height: 394pt, fit: "contain")
]
#bar(1354pt, 207pt, 20pt, 394pt, ivory)
#bar(66pt, 622pt, 630pt, 3pt, blue)
#bar(744pt, 622pt, 630pt, 3pt, ink)
#t(66pt, 637pt, 630pt, "Claude CLI · 자동", size: 22pt, weight: "bold", fill: blue)
#t(66pt, 674pt, 630pt, "기존 로그인으로 실행 · 버튼을 눌러야 기록 전송", size: 17pt)
#t(744pt, 637pt, 630pt, "다른 AI · 직접", size: 22pt, weight: "bold")
#t(744pt, 674pt, 630pt, "앱은 연결하지 않음 · 프롬프트 복사와 JSON 붙여넣기", size: 17pt)
#t(66pt, 716pt, 1000pt, "실제 브라우저 캡처 · GPT 선택 상태 · 기록을 보내기 전 화면", size: 14pt, fill: muted)
#footer("08")
#pagebreak()

// Page 09: the review screen stays large; the source picker remains visible.
#bar(0pt, 0pt, 1440pt, 810pt, ivory)
#t(66pt, 47pt, 26pt, "09", size: 15pt, weight: "bold", fill: blue, font: "IBM Plex Mono")
#t(96pt, 46pt, 900pt, "Work Handoff · 실제 검토 화면", size: 16pt, fill: muted)
#t(66pt, 81pt, 1308pt, "원문 옆에서 초안을 고치고 검토 상태를 남긴다", size: 41pt, weight: "bold")
#t(66pt, 148pt, 1308pt, "저장된 실제 Claude 초안을 불러와 item3의 다음 할 일을 수정한 화면", size: 18pt, fill: muted)
#bar(66pt, 189pt, 1308pt, 2pt, ink)
#t(66pt, 216pt, 430pt, "기록을 넣고", size: 19pt, weight: "bold")
#place(top + left, dx: 66pt, dy: 250pt)[
  #image("assets/work-handoff-main-import-buttons.png", width: 430pt, height: 95pt, fit: "contain")
]
#t(66pt, 367pt, 430pt, "원문 옆에서 확인", size: 19pt, weight: "bold")
#t(66pt, 405pt, 430pt, "01  수정한 값과 원래 AI 값 보존", size: 18pt)
#t(66pt, 449pt, 430pt, "02  검토 필요 상태 유지", size: 18pt)
#t(66pt, 493pt, 430pt, "03  인용 위치를 원문에서 확인", size: 18pt)
#bar(511pt, 211pt, 1pt, 527pt, rgb("#9D9B95"))
#place(top + left, dx: 535pt, dy: 211pt)[
  #image("assets/work-handoff-main-item3-focus.png", width: 839pt, height: 521pt, fit: "contain")
]
#t(66pt, 672pt, 430pt, "검토자는 AI 에이전트였습니다.", size: 15pt, weight: "medium", fill: muted)
#t(66pt, 695pt, 430pt, "사람 사용자 검토 결과는 관찰하지 않았습니다.", size: 15pt, fill: muted)
#footer("09")
#pagebreak()

// Page 11: evidence review case. Amber means unresolved, not success.
#photo("assets/divider-ai-evidence-review-v13.png")
#t(66pt, 54pt, 500pt, "02 / EVIDENCE", size: 17pt, weight: "semibold", fill: blue, font: "IBM Plex Mono")
#bar(66pt, 91pt, 520pt, 2pt, ink)
#t(66pt, 263pt, 585pt, "AI Evidence", size: 62pt, weight: "bold")
#t(66pt, 344pt, 545pt, "Review", size: 72pt, weight: "bold")
#t(66pt, 462pt, 545pt, "주장·체크·판정을 분리해", size: 24pt, weight: "medium")
#t(66pt, 499pt, 545pt, "검증 범위를 드러낸다", size: 24pt, weight: "medium")
#t(66pt, 555pt, 545pt, "독립 구현 사례", size: 17pt, fill: muted)
#footer("11")
#pagebreak()

// Page 13: authored coordination skill and observed operating example.
#photo("assets/divider-agent-coordination-v13.png")
#t(66pt, 54pt, 500pt, "03 / OPERATION", size: 17pt, weight: "semibold", fill: blue, font: "IBM Plex Mono")
#bar(66pt, 91pt, 520pt, 2pt, ink)
#t(66pt, 263pt, 600pt, "에이전트 작업", size: 57pt, weight: "bold")
#t(66pt, 344pt, 600pt, "조율 스킬", size: 65pt, weight: "bold")
#t(66pt, 462pt, 545pt, "작성·리뷰·수정·재검증을", size: 24pt, weight: "medium")
#t(66pt, 499pt, 545pt, "분리해 운영한 사례", size: 24pt, weight: "medium")
#t(66pt, 555pt, 545pt, "직접 설계·제작한 SKILL.md", size: 17pt, fill: muted)
#footer("13")
#pagebreak()

// Page 16: separate ending slate, with a clear exit and one resource pointer.
#bar(0pt, 0pt, 1440pt, 810pt, ink)
#t(66pt, 53pt, 350pt, "END / AI HARNESS", size: 17pt, weight: "semibold", fill: amber, font: "IBM Plex Mono")
#bar(66pt, 91pt, 1308pt, 2pt, ivory)
#bar(66pt, 239pt, 15pt, 275pt, blue)
#t(111pt, 242pt, 1180pt, "감사합니다.", size: 94pt, weight: "bold", fill: ivory)
#t(111pt, 380pt, 1090pt, "AI 결과를 근거와 검토 상태로 이어받도록 설계했습니다.", size: 31pt, weight: "medium", fill: ivory)
#t(111pt, 553pt, 600pt, "이진웅  ·  AI Engineer", size: 21pt, fill: ivory)
#place(top + left, dx: 111pt, dy: 598pt)[
  #link("https://github.com/dtype2100")[#text(font: "IBM Plex Mono", size: 21pt, fill: amber)[github.com/dtype2100]]
]
#bar(66pt, 747pt, 1308pt, 1pt, ivory)
#t(1210pt, 761pt, 164pt, "AI Harness · 16 / 16", size: 13pt, fill: ivory, font: "IBM Plex Mono")
