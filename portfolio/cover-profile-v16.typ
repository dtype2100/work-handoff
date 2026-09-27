// Two transparent overlays: cover wording and one LinkedIn link label.
#set page(width: 1440pt, height: 810pt, margin: 0pt, fill: none)
#set text(font: "IBM Plex Sans KR")
#let ink = rgb("#1B1B20")
#let blue = rgb("#2445B5")

#place(top + left, dx: 66pt, dy: 524.4pt)[
  #text(font: "IBM Plex Sans KR", size: 23.25pt, weight: "medium", fill: ink)[이어받도록 설계·구현한 검증 가능한 인계 도구]
]
#pagebreak()
#place(top + left, dx: 66pt, dy: 252pt)[
  #underline[#text(font: "IBM Plex Sans KR", size: 17pt, weight: "medium", fill: blue)[LinkedIn 프로필 ↗]]
]
