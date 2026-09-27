// Transparent replacement headings, in page order: 6, 7, 8, 9, 11, 14.
#set page(width: 1440pt, height: 810pt, margin: 0pt, fill: none)
#set text(font: "IBM Plex Sans KR", fill: rgb("#1B1B20"))

#let heading(y, copy, size: 42pt, weight: "bold", color: rgb("#1B1B20")) = {
  place(top + left, dx: 66pt, dy: y)[
    #text(size: size, weight: weight, fill: color)[#copy]
  ]
}

#heading(82pt, "기억 공유는 파일로: 다음 작업에서 다시 열 수 있는 인계 파일", color: rgb("#17171B"))
#pagebreak()
#heading(80pt, "인계 파일의 항목별 근거와 검토 상태", size: 40.5pt, color: rgb("#17171B"))
#pagebreak()
#heading(82pt, "AI 선택 후 초안 생성")
#pagebreak()
#heading(81pt, "원문 옆 초안 수정과 검토 상태 기록", size: 41pt)
#pagebreak()
#heading(462pt, "주장·체크·판정 분리로", size: 24pt, weight: "medium")
#heading(499pt, "명시한 검증 범위", size: 24pt, weight: "medium")
#pagebreak()
#heading(80pt, "계약으로 분리한 역할과 원 작성자에게 돌려보낸 리뷰 지적", size: 40pt)
