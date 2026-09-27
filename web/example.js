// Built-in example for first-time users. The draft is a hand-written sample, not real agent output.
// Every quote must stay an exact substring of its record (checked by tests/example.test.js).

export const EXAMPLE_DOCUMENTS = Object.freeze([
  {
    title: '예시: Claude 세션 – 결제 금액 버그 수정',
    text: [
      '장바구니 합계 반올림 오류를 정수 단위(원) 계산으로 바꿔서 고쳤습니다.',
      '회귀 테스트 cart-total.test.js를 추가했고 로컬에서 테스트 42개가 모두 통과했습니다.',
      '계획: 금요일 QA 승인 후 운영 서버에 배포.',
      '막힘: 스테이징 DB 접속 정보가 만료되어 운영팀 티켓 OPS-118 처리를 기다리는 중.',
    ].join('\n'),
  },
  {
    title: '예시: 팀 메모 – 배포 일정',
    text: [
      'QA 승인은 다음 주 월요일로 미뤄졌습니다.',
      '롤백 담당자는 아직 정해지지 않았습니다.',
    ].join('\n'),
  },
]);

export const EXAMPLE_DRAFT = `${JSON.stringify({
  items: [
    {
      id: 'item-1',
      kind: 'completed',
      text: '장바구니 합계 반올림 오류를 정수 계산으로 고치고 회귀 테스트를 추가했다.',
      sources: [
        { document_id: 'doc1', quote: '장바구니 합계 반올림 오류를 정수 단위(원) 계산으로 바꿔서 고쳤습니다.' },
        { document_id: 'doc1', quote: '로컬에서 테스트 42개가 모두 통과했습니다.' },
      ],
    },
    {
      id: 'item-2',
      kind: 'needs_confirmation',
      text: '운영 배포 시점이 기록마다 다르다(금요일 QA 승인 vs 월요일로 연기). 배포는 아직 하지 않았다.',
      next_action: 'QA 승인 날짜를 확인한 뒤 배포 일정을 정한다.',
      sources: [
        { document_id: 'doc1', quote: '계획: 금요일 QA 승인 후 운영 서버에 배포.' },
        { document_id: 'doc2', quote: 'QA 승인은 다음 주 월요일로 미뤄졌습니다.' },
      ],
    },
    {
      id: 'item-3',
      kind: 'blocked',
      text: '스테이징 DB 접속 정보 만료로 스테이징 작업이 막혀 있다.',
      next_action: '운영팀 티켓 OPS-118 진행 상황을 확인한다.',
      sources: [
        { document_id: 'doc1', quote: '스테이징 DB 접속 정보가 만료되어 운영팀 티켓 OPS-118 처리를 기다리는 중.' },
      ],
    },
  ],
  warnings: ['롤백 담당자가 기록에 없습니다. 추측하지 말고 확인이 필요합니다.'],
}, null, 2)}\n`;
