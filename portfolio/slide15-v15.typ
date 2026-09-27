// Slide 15 of 16 · three independent use scenarios.
#set page(width: 1440pt, height: 810pt, margin: 0pt, fill: rgb("#F3F1EA"))
#set text(font: "IBM Plex Sans KR", fill: rgb("#1B1B20"))

#let ink = rgb("#1B1B20")
#let muted = rgb("#56565D")
#let blue = rgb("#2445B5")
#let amber = rgb("#F3E3B0")
#let hair = rgb("#9D9B95")
#let ivory = rgb("#F3F1EA")

#let t(x, y, width, copy, size: 18pt, weight: "regular", fill: ink, font: "IBM Plex Sans KR") = {
  place(top + left, dx: x, dy: y)[
    #block(width: width)[
      #set par(leading: 0.45em)
      #text(font: font, size: size, weight: weight, fill: fill)[#copy]
    ]
  ]
}
#let bar(x, y, width, height, fill) = {
  place(top + left, dx: x, dy: y)[#rect(width: width, height: height, fill: fill, stroke: none)]
}

// Header and table labels follow the v14 deck's margins and type scale.
#t(66pt, 47pt, 28pt, "15", size: 15pt, weight: "bold", fill: blue, font: "IBM Plex Mono")
#t(96pt, 46pt, 900pt, "정리 · 활용 시나리오", size: 16pt, fill: muted)
#t(66pt, 80pt, 1308pt, "세 사례의 활용 시나리오", size: 42pt, weight: "bold")
#t(66pt, 146pt, 1308pt, "관찰한 결과와 기대 활용을 구분해 읽습니다.", size: 19pt, fill: muted)

#bar(1054pt, 190pt, 320pt, 493pt, amber)
#t(66pt, 192pt, 218pt, "언제 쓰나", size: 17pt, weight: "bold")
#t(310pt, 192pt, 428pt, "실제 실증 · 관찰", size: 17pt, weight: "bold", fill: blue)
#t(764pt, 192pt, 278pt, "남긴 정보", size: 17pt, weight: "bold")
#t(1070pt, 192pt, 288pt, "기대 활용 · 가설", size: 17pt, weight: "bold")
#bar(66pt, 221pt, 1308pt, 2pt, ink)
#bar(66pt, 376pt, 1308pt, 1pt, hair)
#bar(66pt, 528pt, 1308pt, 1pt, hair)
#bar(66pt, 682pt, 1308pt, 2pt, ink)
#bar(294pt, 236pt, 1pt, 430pt, hair)
#bar(748pt, 236pt, 1pt, 430pt, hair)
#bar(1054pt, 221pt, 1pt, 461pt, hair)

// 01 · Work Handoff.
#t(66pt, 239pt, 200pt, "01 / SERVICE", size: 13pt, weight: "semibold", fill: blue, font: "IBM Plex Mono")
#t(66pt, 265pt, 210pt, "Work Handoff", size: 23pt, weight: "bold")
#t(66pt, 310pt, 207pt, [에이전트 작업 기록을 #linebreak()다음 담당자에게 넘길 때], size: 16pt, fill: muted)

#t(310pt, 238pt, 422pt, [합성 세션 기록 2건으로 실제 Claude 초안 생성 #linebreak()인용 6개가 원문과 정확히 일치 #linebreak()AI 에이전트 검토 후 Markdown 내보냄], size: 17pt)
#t(764pt, 238pt, 274pt, [AI 검토 상태: 확인 1 / 검토 필요 4 #linebreak()인용 근거와 수정 전 AI 값 #linebreak()사람 사용자 검토 미관찰], size: 16pt)
#t(1070pt, 238pt, 285pt, [후속 담당자가 인용과 #linebreak()미확인 항목을 보며 #linebreak()인계받는 데 활용], size: 17pt)

// 02 · AI Evidence Review.
#t(66pt, 393pt, 200pt, "02 / EVIDENCE", size: 13pt, weight: "semibold", fill: blue, font: "IBM Plex Mono")
#t(66pt, 418pt, 220pt, "AI Evidence Review", size: 20pt, weight: "bold")
#t(66pt, 464pt, 207pt, [AI 코드 리뷰 주장을 #linebreak()고정 테스트와 분리할 때], size: 16pt, fill: muted)

#t(310pt, 391pt, 422pt, [공개 urllib3 이슈의 수정 전 로컬 fixture #linebreak()AI 리뷰 주장과 고정 테스트 실패를 분리 #linebreak()독립 발견·수정 사례는 아님], size: 17pt)
#t(764pt, 391pt, 274pt, [#text(font: "IBM Plex Mono", size: 15pt, weight: "semibold", fill: blue)[verdict unresolved] #linebreak()#text(font: "IBM Plex Mono", size: 15pt)[sample_size 0] #linebreak()#text(font: "IBM Plex Mono", size: 15pt)[precision null]], size: 17pt)
#t(1070pt, 391pt, 285pt, [판정 전 AI 주장을 #linebreak()결론으로 쓰지 않는 #linebreak()검토 절차에 활용], size: 17pt)

// 03 · The authored coordination SKILL.md.
#t(66pt, 546pt, 200pt, "03 / OPERATION", size: 13pt, weight: "semibold", fill: blue, font: "IBM Plex Mono")
#t(66pt, 571pt, 220pt, "에이전트 작업 조율", size: 20pt, weight: "bold")
#t(66pt, 608pt, 205pt, [직접 만든 SKILL.md #linebreak()작성·리뷰·통합을 나눌 때], size: 16pt, fill: muted)

#t(310pt, 544pt, 422pt, [Work Handoff 구현 중 #linebreak()독립 리뷰가 CR 줄바꿈 누락 발견 #linebreak()원 작성자 수정·회귀 테스트 #linebreak()같은 리뷰어 PASS 후 조율자 통합], size: 17pt)
#t(764pt, 544pt, 274pt, [리뷰 지적·수정·재검증 기록 #linebreak()같은 리뷰어의 PASS #linebreak()사람 리뷰 미관찰], size: 16pt)
#t(1070pt, 544pt, 285pt, [작성·리뷰·통합 책임과 #linebreak()수정 이력을 추적하는 #linebreak()운영 방식에 활용], size: 17pt)

#t(66pt, 700pt, 1308pt, "세 사례는 런타임으로 자동 연결되지 않음 · 업무 효과, 시간 절감, 정확도는 측정하지 않음", size: 15pt, fill: muted)
#bar(66pt, 747pt, 1308pt, 1pt, ink)
#t(1208pt, 761pt, 166pt, "AI Harness · 15 / 16", size: 13pt, fill: muted, font: "IBM Plex Mono")
