## 핵심 메모리 추가분

| ID | 태그 | 내용 |
|----|------|------|
| M-91 | 저장소분리 | GitHub 저장소를 3개로 완전 분리 (2026-08-08). `receipt-dashboard`(구, 브랜치 공유 방식) → `balmygarden-platform`(플랫폼, 이 저장소)과 `balmydaddy-receipt`(영수증 앱)로 코드 이관. `lord-of-dark`(게임)는 이미 독립. Vercel 프로젝트도 `balmygarden-platform`/`receipt-app` 각각 이름에 맞게 리네임 + 새 저장소로 Git 연결 재설정. 3트랙 저장소·배포가 서로 완전히 독립되어, M-85·M-87에서 반복된 "한 저장소 여러 브랜치, 브랜치별 다른 프로덕션" 배포 착오 구조 자체가 사라짐. |

