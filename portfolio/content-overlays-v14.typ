// Transparent overlays for content-page numbers and the few cross-references
// affected when the 11-page v12 deck is reorganized into 16 pages.
#set page(width: 1440pt, height: 810pt, margin: 0pt, fill: none)
#set text(font: "IBM Plex Sans KR")

#let paper = rgb("#F3F1EA")
#let blue = rgb("#2445B5")
#let muted = rgb("#56565D")
#let ink = rgb("#1B1B20")
#let t(x, y, width, copy, size: 13pt, weight: "regular", fill: muted, font: "IBM Plex Sans KR") = {
  place(top + left, dx: x, dy: y)[
    #block(width: width)[#text(font: font, size: size, weight: weight, fill: fill)[#copy]]
  ]
}
#let mask(x, y, width, height) = {
  place(top + left, dx: x, dy: y)[#rect(width: width, height: height, fill: paper, stroke: none)]
}
#let bar(x, y, width, height, fill) = {
  place(top + left, dx: x, dy: y)[#rect(width: width, height: height, fill: fill, stroke: none)]
}
#let head(n) = {
  mask(64pt, 43pt, 29pt, 27pt)
  t(66pt, 47pt, 27pt, n, size: 15pt, weight: "bold", fill: blue, font: "IBM Plex Mono")
}
#let foot(n) = {
  mask(1197pt, 752pt, 178pt, 33pt)
  t(1208pt, 761pt, 166pt, "AI Harness · " + n + " / 16", size: 13pt, font: "IBM Plex Mono")
}

// Old page 1: cover contents row. The section ordering is now contiguous.
#mask(285pt, 718pt, 113pt, 25pt)
#t(288pt, 721pt, 110pt, "05–10", size: 12pt, font: "IBM Plex Mono")
#mask(820pt, 718pt, 38pt, 25pt)
#t(823pt, 721pt, 35pt, "12", size: 12pt, font: "IBM Plex Mono")
#mask(1245pt, 718pt, 44pt, 25pt)
#t(1248pt, 721pt, 40pt, "14", size: 12pt, font: "IBM Plex Mono")
#pagebreak()

// Old page 2: profile and public repository links remain on page 2.
#mask(734pt, 386pt, 145pt, 29pt)
#t(736pt, 389pt, 140pt, "05–10", size: 16pt, font: "IBM Plex Mono")
#mask(734pt, 492pt, 50pt, 28pt)
#t(736pt, 495pt, 48pt, "12", size: 16pt, font: "IBM Plex Mono")
#mask(734pt, 572pt, 50pt, 28pt)
#t(736pt, 575pt, 48pt, "14", size: 16pt, font: "IBM Plex Mono")
#foot("02")
#pagebreak()

// Old page 3: problem statement.
#foot("03")
#pagebreak()

// Old page 4 -> page 5: Work Handoff architecture.
#head("05")
#mask(200pt, 164pt, 948pt, 157pt)
#bar(201pt, 165pt, 946pt, 1pt, ink)
#bar(201pt, 307pt, 946pt, 1pt, ink)
#bar(201pt, 165pt, 1pt, 143pt, ink)
#bar(1146pt, 165pt, 1pt, 143pt, ink)
#t(220pt, 180pt, 900pt, "2  AI 초안 만들기 · 한 개의 실행 버튼", size: 19pt, weight: "bold", fill: ink)
#bar(220pt, 214pt, 906pt, 1pt, rgb("#9D9B95"))
#t(220pt, 229pt, 150pt, "Claude CLI", size: 16pt, weight: "bold", fill: blue)
#t(378pt, 229pt, 740pt, "로그인된 로컬 CLI로 자동 실행 · 버튼을 누를 때 기록 전송", size: 16pt, fill: ink)
#t(220pt, 258pt, 240pt, "GPT·Gemini·Codex·기타", size: 16pt, weight: "bold", fill: blue)
#t(459pt, 258pt, 658pt, "프롬프트 복사 → AI 대화창 → JSON 붙여넣기", size: 16pt, fill: ink)
#t(220pt, 285pt, 900pt, "두 방식 모두 앱에서 같은 스키마·인용 검사와 원문 옆 검토를 거칩니다.", size: 14pt, fill: muted)
#mask(200pt, 308pt, 948pt, 19pt)
#bar(673pt, 308pt, 2pt, 19pt, ink)
#bar(463pt, 541pt, 421pt, 79pt, ink)
#t(474pt, 549pt, 400pt, "경계 · Claude CLI 선택 후 실행할 때만 기록 전송", size: 13pt, weight: "bold", fill: white)
#t(474pt, 572pt, 400pt, "다른 AI 선택 시 앱은 전송하지 않음 · 사용자가 직접 복사", size: 12pt, fill: white)
#t(474pt, 594pt, 400pt, "앱은 인용만 검사 · 진위와 충돌은 검토자가 판단", size: 12pt, fill: white)
#mask(1014pt, 643pt, 28pt, 26pt)
#t(1017pt, 647pt, 25pt, "06", size: 12pt, font: "IBM Plex Mono")
#mask(260pt, 684pt, 788pt, 47pt)
#t(264pt, 689pt, 784pt, "AI Evidence Review 별도 Python CLI · 코드 리뷰 주장과 고정 테스트 결과를 나눠 기록 (12)", size: 12pt)
#t(264pt, 709pt, 784pt, "에이전트 작업 조율 스킬 직접 설계·제작한 SKILL.md, Work Handoff 제작에 쓴 작업 운영 방식 (14) · 둘 다 이 흐름과 런타임으로 연결되지 않음", size: 12pt)
#foot("05")
#pagebreak()

// Old page 5 -> page 6: file-based memory design.
#head("06")
#foot("06")
#pagebreak()

// Old page 6 -> page 12: AI Evidence Review.
#head("12")
#foot("12")
#pagebreak()

// Old page 7 stays page 7; its route label reflects the unified selector.
#mask(66pt, 276pt, 374pt, 87pt)
#t(66pt, 284pt, 35pt, "01", size: 18pt, weight: "bold", fill: blue, font: "IBM Plex Mono")
#t(106pt, 283pt, 334pt, "선택한 AI로 초안", size: 20pt, weight: "bold", fill: ink)
#t(106pt, 314pt, 334pt, "Claude CLI 자동 · GPT/Gemini 등 직접", size: 16pt, fill: muted)
#t(106pt, 340pt, 334pt, "같은 JSON 검증으로 이동", size: 16pt, fill: muted)
#bar(66pt, 617pt, 374pt, 91pt, ink)
#t(80pt, 626pt, 348pt, "Claude CLI 선택 후 실행할 때만 기록 전송", size: 15pt, weight: "bold", fill: white)
#t(80pt, 653pt, 348pt, "다른 AI는 앱 전송 없음 · 앱 저장 없음", size: 13pt, fill: white)
#t(80pt, 680pt, 348pt, "CSP connect-src 'self' → 로컬 /api/draft만", size: 12pt, fill: white, font: "IBM Plex Mono")
#foot("07")
#pagebreak()
#head("09")
#foot("09")
#pagebreak()
#head("10")
#foot("10")
#pagebreak()

// Old page 10 -> page 14: control-tower operating case.
#head("14")
#foot("14")
#pagebreak()

// Old page 11 -> page 15: observed evidence and expected effects.
#head("15")
#mask(177pt, 386pt, 107pt, 25pt)
#t(179pt, 390pt, 105pt, "05–10", size: 12pt, font: "IBM Plex Mono")
#mask(171pt, 518pt, 37pt, 22pt)
#t(173pt, 522pt, 35pt, "12", size: 12pt, font: "IBM Plex Mono")
#mask(219pt, 638pt, 36pt, 23pt)
#t(221pt, 642pt, 35pt, "14", size: 12pt, font: "IBM Plex Mono")
#foot("15")
