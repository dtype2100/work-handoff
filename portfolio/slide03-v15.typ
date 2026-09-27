// Portfolio v15, slide 03: the two missing-evidence problems at presentation size.
#set page(width: 1440pt, height: 810pt, margin: 0pt, fill: rgb("#F3F1EA"))
#set text(font: "IBM Plex Sans KR")
#let paper = rgb("#F3F1EA")
#let ink = rgb("#1B1B20")
#let muted = rgb("#56565D")
#let blue = rgb("#2445B5")
#let amber = rgb("#F3E3B0")
#let hair = rgb("#9D9B95")
#let t(x,y,w,s,size:18pt,weight:"regular",fill:ink,font:"IBM Plex Sans KR") = {
  place(top + left, dx:x, dy:y)[#block(width:w)[#text(font:font,size:size,weight:weight,fill:fill)[#s]]]
}
#let bar(x,y,w,h,fill) = { place(top + left,dx:x,dy:y)[#rect(width:w,height:h,fill:fill,stroke:none)] }
#let frame(x,y,w,h) = {
  place(top + left,dx:x,dy:y)[#rect(width:w,height:h,fill:paper,stroke:ink)]
}

#t(66pt,47pt,28pt,"03",size:15pt,weight:"bold",fill:blue,font:"IBM Plex Mono")
#t(96pt,46pt,900pt,"문제 정의",size:16pt,fill:muted)
#t(66pt,81pt,1308pt,"결론만 받으면 원문과 판정을 다시 찾아야 한다",size:43pt,weight:"bold")
#t(66pt,146pt,1308pt,"작업 인계와 AI 코드 리뷰에서 다음 담당자가 다시 찾아야 하는 정보",size:19pt,fill:muted)
#bar(66pt,188pt,1308pt,2pt,ink)
#bar(728pt,211pt,1pt,427pt,hair)

// Two record states, without assuming they refer to the same run.
#t(66pt,211pt,620pt,"01 / 작업 인계",size:18pt,weight:"bold",fill:blue,font:"IBM Plex Mono")
#frame(66pt,253pt,620pt,76pt)
#t(86pt,267pt,180pt,"화요일 기록",size:19pt,fill:muted)
#t(301pt,263pt,340pt,"완료",size:32pt,weight:"bold")
#frame(66pt,341pt,620pt,76pt)
#t(86pt,355pt,180pt,"수요일 기록",size:19pt,fill:muted)
#t(301pt,351pt,340pt,"진행 중",size:32pt,weight:"bold",fill:blue)
#t(66pt,430pt,620pt,"합성 기록 · 두 문장이 같은 실행을 가리키는지는 미확인",size:15pt,fill:muted)
#bar(66pt,478pt,620pt,1pt,hair)
#t(66pt,493pt,620pt,"다음 담당자가 확인할 것",size:17pt,weight:"bold")
#t(66pt,532pt,620pt,"원문 위치   ·   실행 대상   ·   최신 상태",size:22pt)
#bar(66pt,588pt,620pt,55pt,amber)
#t(81pt,601pt,590pt,"한쪽만 요약하면 미확인 상태가 완료로 전달될 수 있다",size:18pt,weight:"medium")

// A failed check is an observation, not a verdict about a model's cause claim.
#t(754pt,211pt,620pt,"02 / AI 코드 리뷰",size:18pt,weight:"bold",fill:blue,font:"IBM Plex Mono")
#frame(754pt,253pt,620pt,76pt)
#t(774pt,267pt,180pt,"AI 주장",size:19pt,fill:muted)
#t(963pt,263pt,380pt,"원인 추정 · 수정 권고",size:27pt,weight:"bold")
#frame(754pt,341pt,620pt,76pt)
#t(774pt,355pt,180pt,"검사 결과",size:19pt,fill:muted)
#t(963pt,351pt,380pt,"고정 테스트 실패",size:27pt,weight:"bold",fill:blue)
#t(754pt,430pt,620pt,"구조 예시 · 실제 AI 문장을 옮긴 것이 아님",size:15pt,fill:muted)
#bar(754pt,478pt,620pt,1pt,hair)
#t(754pt,493pt,620pt,"다음 담당자가 확인할 것",size:17pt,weight:"bold")
#t(754pt,532pt,620pt,"실행 명령   ·   실패 내용   ·   판정 상태",size:22pt)
#bar(754pt,588pt,620pt,55pt,amber)
#t(769pt,601pt,590pt,"테스트 실패만으로 AI의 원인 추정을 입증할 수 없다",size:18pt,weight:"medium")

#bar(66pt,676pt,1308pt,57pt,ink)
#t(84pt,688pt,1275pt,"인계에 남길 정보     원문 인용     ·     실제 검사 결과     ·     미확인 판정",size:23pt,weight:"medium",fill:paper)
#bar(66pt,747pt,1308pt,1pt,ink)
#t(1208pt,761pt,166pt,"AI Harness · 03 / 16",size:13pt,fill:muted,font:"IBM Plex Mono")
