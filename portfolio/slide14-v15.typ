// AI Harness Portfolio v15 · slide 14. Standalone one-page source.
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
#let step(x, y, number, label, title, detail1, detail2) = {
  t(x, y, 282pt, number + "  " + label, size: 16pt, weight: "bold", fill: blue)
  t(x, y + 29pt, 282pt, title, size: 25pt, weight: "bold")
  t(x, y + 75pt, 282pt, detail1, size: 17pt)
  t(x, y + 103pt, 282pt, detail2, size: 17pt, fill: muted)
}

// The upper row moves work out; the lower row moves review findings back.
#t(66pt, 47pt, 28pt, "14", size: 15pt, weight: "bold", fill: blue, font: "IBM Plex Mono")
#t(96pt, 46pt, 900pt, "작업 운영 · 에이전트 협업", size: 16pt, fill: muted)
#t(66pt, 80pt, 1308pt, "계약으로 분리하고, 리뷰 지적을 원 작성자에게 되돌렸다", size: 40pt, weight: "bold")
#bar(66pt, 149pt, 1308pt, 2pt, ink)
#t(66pt, 166pt, 1308pt, "직접 만든 조율 SKILL.md의 역할·수용 규칙을 Work Handoff 작업에 적용", size: 18pt, fill: muted)

#t(66pt, 212pt, 600pt, "01—04   기준에서 분리 실행까지", size: 15pt, weight: "bold", fill: muted)
#bar(66pt, 240pt, 1308pt, 2pt, hair)
#step(66pt, 257pt, "01", "기준 확인", "agent-workspace", "규칙·결정 기록 참조", "preflight로 작업 대상 확인")
#step(408pt, 257pt, "02", "작업 계약", "task contract", "작업별 범위·수용 기준", "소유 경로·검증 조건 명시")
#step(750pt, 257pt, "03", "전달", "Orca task/dispatch", "계약을 각 세션에 전달", "작업·결과 기록 연결")
#step(1092pt, 257pt, "04", "분리 실행", "작성·검토 분리", "구현·테스트: 별도 worktree", "리뷰어: 읽기 전용")
#t(359pt, 302pt, 42pt, "→", size: 26pt, fill: blue)
#t(701pt, 302pt, 42pt, "→", size: 26pt, fill: blue)
#t(1043pt, 302pt, 42pt, "→", size: 26pt, fill: blue)
#t(1327pt, 385pt, 40pt, "↓", size: 26pt, fill: blue)

#t(66pt, 416pt, 600pt, "리뷰 지적을 되돌려 수용까지", size: 15pt, weight: "bold", fill: muted)
#bar(66pt, 444pt, 1308pt, 2pt, hair)
#step(66pt, 461pt, "08", "수용", "조율자 검증·통합", "재검증 결과 확인 뒤", "통합본을 수용")
#step(408pt, 461pt, "07", "재검증", "같은 리뷰어 PASS", "같은 읽기 전용 리뷰어가", "수정 범위를 다시 확인")
#step(750pt, 461pt, "06", "환류", "원 작성자에게 반송", "구현 작성자가 수정", "테스트 작성자가 회귀 보강")
#step(1092pt, 461pt, "05", "수집", "조율 세션", "worker_done·리뷰 지적 수집", "수용 기준과 대조")
#t(359pt, 506pt, 42pt, "←", size: 26pt, fill: blue)
#t(701pt, 506pt, 42pt, "←", size: 26pt, fill: blue)
#t(1043pt, 506pt, 42pt, "←", size: 26pt, fill: blue)

#bar(66pt, 604pt, 1308pt, 99pt, amber)
#t(80pt, 613pt, 1100pt, "실제 리뷰 루프  ·  Work Handoff", size: 17pt, weight: "bold")
#t(80pt, 640pt, 1280pt, "Markdown 내보내기에서 단독 CR 줄바꿈 누락 발견", size: 20pt, weight: "medium")
#t(80pt, 671pt, 1280pt, "구현 작성자: CRLF / CR / LF 처리  →  테스트 작성자: 단독 CR 회귀 사례  →  같은 리뷰어: PASS", size: 17pt)

#t(66pt, 718pt, 1308pt, "작성·리뷰·조율 모두 AI 에이전트 세션 · 사람 리뷰 미관찰", size: 13pt, fill: muted)
#bar(66pt, 747pt, 1308pt, 1pt, ink)
#t(1208pt, 761pt, 166pt, "AI Harness · 14 / 16", size: 13pt, fill: muted, font: "IBM Plex Mono")
