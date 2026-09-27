// Slide 10 of AI Harness Portfolio v12. IBM Plex fonts: OFL files in fonts/.
#set page(width: 1440pt, height: 810pt, margin: 0pt, fill: rgb("#F3F1EA"))
#set text(font: "IBM Plex Sans KR", fill: rgb("#1B1B20"))

#let ink = rgb("#1B1B20")
#let muted = rgb("#56565D")
#let blue = rgb("#2445B5")
#let amber = rgb("#F3E3B0")
#let hair = rgb("#9D9B95")

#let t(x, y, width, copy, size: 18pt, weight: "regular", fill: ink, font: "IBM Plex Sans KR") = {
  place(top + left, dx: x, dy: y)[
    #block(width: width)[#text(font: font, size: size, weight: weight, fill: fill)[#copy]]
  ]
}
#let bar(x, y, width, height, fill) = {
  place(top + left, dx: x, dy: y)[#rect(width: width, height: height, fill: fill, stroke: none)]
}

// Header keeps the original deck's left edge, colour and footer system.
#t(66pt, 47pt, 28pt, "10", size: 15pt, weight: "bold", fill: blue, font: "IBM Plex Mono")
#t(96pt, 46pt, 900pt, "작업 운영 · 에이전트 협업", size: 16pt, fill: muted)
#t(66pt, 80pt, 1308pt, "agent-workspace를 기준으로 분리 작업을 조율했다", size: 42pt, weight: "bold")
#bar(66pt, 143pt, 122pt, 29pt, blue)
#t(74pt, 147pt, 112pt, "직접 설계·제작", size: 16pt, weight: "bold", fill: white)
#t(202pt, 146pt, 1100pt, "조율 SKILL.md는 역할과 수용 규칙을 정의하고, 실제 작업은 분리된 세션에서 진행", size: 17pt, fill: muted)

// Operating architecture. agent-workspace was the control base; Orca was the
// worktree/session environment. The tower queue/fix automation was not run.
#t(66pt, 198pt, 800pt, "이번 작업에서 사용한 운영 흐름", size: 17pt, weight: "medium", fill: muted)
#bar(66pt, 225pt, 1308pt, 2pt, ink)
#bar(500pt, 241pt, 1pt, 125pt, hair)
#bar(938pt, 241pt, 1pt, 125pt, hair)

#t(66pt, 245pt, 410pt, "01   기준", size: 16pt, weight: "bold", fill: blue)
#t(66pt, 274pt, 410pt, "agent-workspace", size: 27pt, weight: "bold")
#t(66pt, 318pt, 410pt, "규칙·결정 기록을 파일로 관리", size: 18pt)
#t(66pt, 341pt, 410pt, "tower preflight로 작업 대상 확인", size: 17pt, fill: muted)

#t(523pt, 245pt, 390pt, "02   분리 실행", size: 16pt, weight: "bold", fill: blue)
#t(523pt, 274pt, 390pt, "Orca 작업 트리", size: 27pt, weight: "bold")
#t(523pt, 318pt, 390pt, "작성자와 읽기 전용 리뷰어 분리", size: 18pt)
#t(523pt, 341pt, 390pt, "직접 만든 조율 스킬의 역할 규칙 적용", size: 17pt, fill: muted)

#t(961pt, 245pt, 410pt, "03   수용", size: 16pt, weight: "bold", fill: blue)
#t(961pt, 274pt, 410pt, "조율 세션", size: 27pt, weight: "bold")
#t(961pt, 318pt, 410pt, "리뷰 지적을 원 작성자에게 환류", size: 18pt)
#t(961pt, 341pt, 410pt, "검증 결과 확인 후 통합", size: 17pt, fill: muted)

// One observed loop from the Work Handoff implementation.
#t(66pt, 389pt, 1100pt, "실제 기록 · Work Handoff 제작 중 남은 리뷰 지적 1건", size: 19pt, weight: "medium")
#bar(66pt, 422pt, 393pt, 4pt, ink)
#bar(523pt, 422pt, 393pt, 4pt, ink)
#bar(980pt, 422pt, 394pt, 4pt, blue)

#t(66pt, 440pt, 393pt, "1  ·  독립 리뷰어", size: 16pt, fill: muted)
#t(66pt, 469pt, 393pt, "재리뷰", size: 34pt, weight: "bold")
#t(66pt, 526pt, 393pt, "지정 수정 8건 확인 뒤", size: 18pt)
#t(66pt, 554pt, 393pt, "Markdown 내보내기의 일부", size: 18pt)
#t(66pt, 582pt, 393pt, "줄바꿈 누락을 발견", size: 18pt)

#t(523pt, 440pt, 393pt, "2  ·  원 작성자", size: 16pt, fill: muted)
#t(523pt, 469pt, 393pt, "수정", size: 34pt, weight: "bold")
#t(523pt, 526pt, 393pt, "줄바꿈 유형을 함께 처리", size: 18pt)
#t(523pt, 554pt, 393pt, "테스트 작성자가 단독 CR", size: 18pt)
#t(523pt, 582pt, 393pt, "회귀 사례를 추가", size: 18pt)

#t(980pt, 440pt, 394pt, "3  ·  같은 리뷰어", size: 16pt, fill: muted)
#t(980pt, 469pt, 394pt, "재검증", size: 34pt, weight: "bold", fill: blue)
#t(980pt, 526pt, 394pt, "수정 범위를 다시 읽고", size: 18pt)
#t(980pt, 554pt, 394pt, "누락 해소 확인", size: 18pt)
#t(980pt, 582pt, 394pt, "결과 PASS", size: 18pt, weight: "bold", fill: blue)

#bar(66pt, 636pt, 1308pt, 1pt, hair)
#t(66pt, 650pt, 1308pt, "이후 조율자가 통합본을 수용 · 당시 기록: node --test 64/64, git diff --check", size: 15pt, fill: muted)

#bar(66pt, 703pt, 402pt, 36pt, amber)
#t(78pt, 710pt, 383pt, "작성·리뷰·조율은 모두 에이전트 세션", size: 17pt, weight: "bold")
#t(485pt, 710pt, 880pt, "사람 리뷰는 관찰하지 않았고, 조율 스킬은 앱에 자동 연결되지 않습니다.", size: 16pt, fill: muted)
#bar(66pt, 747pt, 1308pt, 1pt, ink)
#t(1208pt, 761pt, 166pt, "AI Harness · 10 / 11", size: 13pt, fill: muted, font: "IBM Plex Mono")
