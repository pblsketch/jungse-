'use strict';
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.LEARNING_PATHS = {
  s0: [
    { title: '흩어진 글자를 먼저 갈라 보자.', items: ['s0.t1'] },
    { title: '펼친 교과서에서 스물여덟 자를 살펴보자.', contexts: ['s0.c1'] },
    { title: '옛 책과 선생님의 설명을 견주어 규칙을 완성하자.', contexts: ['s0.c2', 's0.c3'], items: ['s0.r1'] }
  ],
  s1: [
    { title: '돌비석의 두 이름부터 살펴보자.', contexts: ['s1.c1'] },
    { title: '서기의 목간과 견주어 뜻과 소리의 규칙을 찾아보자.', contexts: ['s1.c2'], items: ['s1.r1'] },
    { title: '아이의 노래에서 님과 은을 어떻게 적었는지 들어 보자.', contexts: ['s1.c3'] },
    { title: '여인의 노래와 견주어 노래를 적는 규칙을 완성하자.', contexts: ['s1.c4'], items: ['s1.r2'] },
    { title: '배운 규칙으로 뜻과 소리를 두 글자씩 가려 보자.', items: ['s1.t1'] }
  ],
  s2: [
    { title: '첫소리 원고에서 발음 기관의 모양을 살펴보자.', contexts: ['s2.c1'] },
    { title: '농부의 말소리와 견주어 기본자의 바탕을 찾아보자.', contexts: ['s2.c2'], items: ['s2.r1'] },
    { title: '돌계단의 원고에서 획을 더한 까닭을 확인하자.', contexts: ['s2.c3'], items: ['s2.r2', 's2.r5'] },
    { title: '기본자와 가획을 직접 만들어 보자.', items: ['s2.t1'] },
    { title: '가운뎃소리 원고와 청동 그릇에서 모음의 바탕을 찾자.', contexts: ['s2.c4', 's2.c5'], items: ['s2.r3'] },
    { title: '아이와 돌계단 원고에서 모음을 합치는 방법을 확인하자.', contexts: ['s2.c6', 's2.c7'], items: ['s2.r4'] },
    { title: '하늘, 땅, 사람의 글자로 모음을 만들어 보자.', items: ['s2.t2'] },
    { title: '임금과 서문 원고에서 새 글자를 만든 뜻을 찾아보자.', contexts: ['s2.c8', 's2.c9'], items: ['s2.r6'] }
  ],
  s3: [
    { title: '벽의 알림 글에서 글자를 모아 쓰는 모양을 보자.', contexts: ['s3.c1'] },
    { title: '옹기 가게와 곡식 노점에서 모아쓰기 규칙을 찾자.', contexts: ['s3.c2', 's3.c7'], items: ['s3.r1'] },
    { title: '짚단 노점과 선비에게서 모음을 합치는 법을 배우자.', contexts: ['s3.c5', 's3.c6'], items: ['s3.r3'] },
    { title: '한 음절씩 물건 이름표를 써 보자.', items: ['s3.t1'] },
    { title: '생선 가게와 아이에게서 나란히 쓰는 글자를 찾자.', contexts: ['s3.c3', 's3.c4'], items: ['s3.r2'] },
    { title: '센소리와 겹받침을 이름표에 넣어 보자.', items: ['s3.t2'] }
  ],
  s4: [
    { title: '인쇄대의 첫 장부터 살펴보자.', contexts: ['s4.c1'] },
    { title: '둘째 장과 견주어 이어 적기 규칙을 찾아보자.', contexts: ['s4.c2'], items: ['s4.r1', 's4.r5'] },
    { title: '책 탁자와 활자판에서 받침, 방점, 띄어쓰기를 살펴보자.', contexts: ['s4.c3', 's4.c4'], items: ['s4.r2', 's4.r3', 's4.r4'] },
    { title: '배운 표기 규칙으로 두 줄을 끊어 읽어 보자.', items: ['s4.t1'] }
  ],
  s5: [
    { title: '느티나무의 알림 글에서 낯익은 옛말을 만나 보자.', contexts: ['s5.c1'] },
    { title: '같은 말이 쓰인 곳을 골라 다니며 옛 뜻을 견주어 보자.', contexts: ['s5.c2', 's5.c3', 's5.c4', 's5.c5', 's5.c6', 's5.c7'], items: ['s5.r1', 's5.r2', 's5.r3', 's5.r4', 's5.r5', 's5.r6'] }
  ],
  s6: [
    { title: '서안의 책에서 낱말 몸통과 끈을 살펴보자.', contexts: ['s6.c1'] },
    { title: '관원의 책과 견주어 주격 조사를 찾아보자.', contexts: ['s6.c2'], items: ['s6.r1'] },
    { title: '왼쪽 깃발과 서당 책상에서 관형격 조사를 찾자.', contexts: ['s6.c3', 's6.c5'], items: ['s6.r2'] },
    { title: '서당 아이의 말에서 명사형 어미를 확인하자.', contexts: ['s6.c4'], items: ['s6.r3'] },
    { title: '오른쪽 책 꾸러미를 살피고 조사와 모음의 관계를 정리하자.', contexts: ['s6.c6'], items: ['s6.r4', 's6.r5'] }
  ],
  s7: [
    { title: '궁의 관원에게서 높이는 말을 만나 보자.', contexts: ['s7.c1'] },
    { title: '다리 끝 선비와 견주어 주체 높임을 확인하자.', contexts: ['s7.c3'], items: ['s7.r1'] },
    { title: '스님과 종각의 책에서 객체 높임을 찾아보자.', contexts: ['s7.c4', 's7.c5'], items: ['s7.r2'] },
    { title: '전령의 두루마리에서 듣는 이를 높이는 말을 찾자.', contexts: ['s7.c2'], items: ['s7.r3'] },
    { title: '누구를 높이는지 짚으며 활자를 끼워 보자.', items: ['s7.t1', 's7.t2'] }
  ],
  s8: [
    { title: '노스님에게서 주어가 너인 물음을 들어 보자.', contexts: ['s8.c1'] },
    { title: '툇마루의 책과 견주어 너에게 묻는 말끝을 확인하자.', contexts: ['s8.c2'], items: ['s8.r1'] },
    { title: '동자와 선비의 말을 견주어 의문사가 있는 물음을 찾자.', contexts: ['s8.c3', 's8.c4'], items: ['s8.r2'] },
    { title: '법당 앞 책에서 의문사가 없는 물음을 확인하자.', contexts: ['s8.c5'], items: ['s8.r3'] },
    { title: '물음 하나씩 대답과 말끝을 맞춰 보자.', items: ['s8.t1'] }
  ],
  s9: [
    { title: '단 위 서안에서 서문의 흐름을 먼저 살펴보자.', contexts: ['s9.c1'] },
    { title: '서문 종이와 한문 책을 견주어 새 글자를 만든 뜻을 찾자.', contexts: ['s9.c2', 's9.c3'], items: ['s9.r1'] },
    { title: '서문의 앞부분을 한 구절씩 읽어 보자.', items: ['s9.t1', 's9.t3'] },
    { title: '서문의 뒷부분을 읽고 백성을 위한 마음을 찾아보자.', items: ['s9.t2'] }
  ],
  s10: [
    { title: '훈장의 책상에서 백 년 전과 지금의 글을 살펴보자.', contexts: ['s10.c1'] },
    { title: '큰돌이의 글과 견주어 주격 조사를 확인하자.', contexts: ['s10.c3'], items: ['s10.r1'] },
    { title: '막동이와 평상의 책에서 이어 적기와 모음을 견주자.', contexts: ['s10.c2', 's10.c4'], items: ['s10.r2', 's10.r3'] },
    { title: '책 보따리와 훈장의 말에서 방점을 견주어 보자.', contexts: ['s10.c5', 's10.c6'], items: ['s10.r4'] },
    { title: '우물가 작은돌이에게서 달라진 모음을 찾아보자.', contexts: ['s10.c7'], items: ['s10.r5'] },
    { title: '수첩의 현상마다 판단하고 근거 낱말을 붙여 보자.', items: ['s10.t1', 's10.t2'] }
  ],
  s11: [
    { title: '역관의 새 판 책에서 달라진 글자를 만나 보자.', contexts: ['s11.c2'] },
    { title: '주막의 옛 판과 견주어 소리와 받침의 변화를 찾자.', contexts: ['s11.c3'], items: ['s11.r2', 's11.r4', 's11.r5'] },
    { title: '의유당의 말에서 입술 뒤의 모음을 살펴보자.', contexts: ['s11.c1'], items: ['s11.r6'] },
    { title: '신문사 사람과 아이에게서 조사와 명사형을 찾아보자.', contexts: ['s11.c4', 's11.c5'], items: ['s11.r1', 's11.r3'] },
    { title: '게시판에서 받침을 적는 방식을 견주어 보자.', contexts: ['s11.c6'], items: ['s11.r7'] },
    { title: '광고와 전차 앞에서 글자와 어휘의 변화를 찾아보자.', contexts: ['s11.c7', 's11.c8'], items: ['s11.r8', 's11.r9'] },
    { title: '세 시대의 말과 적는 방식을 이어 보자.', items: ['s11.t1'] }
  ],
  s12: {
    default: [
      { title: '왼쪽 다리의 종이배에서 옛 모습과 새 모습을 보자.', contexts: ['s12.c3'] },
      { title: '울타리와 오른쪽 다리에서 변화의 순서를 견주자.', contexts: ['s12.c4', 's12.c6'], items: ['s12.r1'] },
      { title: '가로등, 선생님, 바위에서 지금 바뀌는 말을 찾아보자.', contexts: ['s12.c1', 's12.c2', 's12.c5'], items: ['s12.r2'] },
      { title: '변화의 근거를 보며 한 낱말씩 강에 놓아 보자.', items: ['s12.t1'] }
    ],
    m: [
      { title: '다리 위 휴대 전화의 입력 방식을 먼저 보자.', contexts: ['s12.c3'] },
      { title: '오른쪽 휴대 전화와 견주어 입력 방식을 비교하자.', contexts: ['s12.c6'], items: ['s12.r1'] },
      { title: '가로등과 미래의 나무에서 글자와 소리를 비교하자.', contexts: ['s12.c1', 's12.c7'], items: ['s12.r2'] },
      { title: '선생님과 울타리의 종이에서 모아쓰기와 풀어쓰기를 보자.', contexts: ['s12.c2', 's12.c4'], items: ['s12.r3'] }
    ]
  }
};
