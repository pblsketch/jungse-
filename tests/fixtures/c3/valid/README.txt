C3 내용 점검 시험용 예시 데이터 (게임 데이터 아님).
- valid/       : 모든 c3 점검과 font-coverage 가 통과해야 하는 작은 데이터 뿌리.
- <다른 폴더>/ : 일부러 틀린 세트. case.json 이 valid 를 복사한 뒤 무엇을 바꾸는지(patch/write/remove),
                 어느 점검이 실패해야 하는지(check), 출력에 무엇이 나와야 하는지(expect)를 적는다.
- 시험용 原文 블록(O-s4-TST1 등)은 실제 원문이 아니다. 대괄호 표기 조합을 시험하려고 만든 글자다.
돌리기: node tests/unit/c3-fixtures.mjs
