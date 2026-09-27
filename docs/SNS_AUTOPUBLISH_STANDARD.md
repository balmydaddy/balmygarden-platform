# SNS 자동 게시 기준 (AUTOPUB-01)

> CEO 지시 2026-09-27: "권고안대로 진행해. AI 자동 게시 때문에 수익이 안 나는 일이 없게
> 법적 규정과 각 SNS사 규제를 전부 검토해 반영하고, 법무팀과 함께 진행할 것."
> 검토: AEGIS(분리 에이전트, 2026-09-27). 세션 프록시가 support.google.com·canva.com·korea.kr
> 원문 열람을 막아서 검색 요약 기준으로 인용했다. 원문과 충돌하면 원문이 우선한다.

## 1. 결론

1. **자동 게시를 막는 건 규정이 아니라 수익화 조건이다.** 플랫폼들은 자동 게시 자체를
   금지하지 않는다. 대신 "템플릿으로 찍어낸 반복물"을 수익화와 추천 노출에서 뺀다.
   그래서 매 편에 **원본 기여 요소**가 없으면 게시하지 않는다.
2. **YouTube Shorts는 정지 컷 슬라이드로 자동화하지 않는다.** YPP의 진정성 없는 콘텐츠
   정책은 "같은 구성의 슬라이드쇼", "내레이션·해설 없는 이미지 슬라이드쇼"를 수익화 불가의
   예시로 든다. 이 판정은 편 단위가 아니라 **채널 단위**다. CEO 음성 해설이 들어간 편만
   Shorts로 낸다. 음성이 없으면 YouTube는 쉰다.
3. **인공지능 기본법(2026-01-22 시행) 제31조의 표시 의무는 AI 서비스 제공 사업자 대상이다.**
   balmydaddy는 '이용자'일 가능성이 높다(로펌 해설 기준, 가이드라인 원문은 미대조). 그래도
   플랫폼 규정과 Canva 약관 때문에 AI 생성 고지를 자율적으로 넣는다.
4. **크몽 홍보 편은 표시광고법 제3조 적용 대상이다.** 위반 시 제17조에 따라 2년 이하 징역
   또는 1억5천만원 이하 벌금이다. 정보 편과 홍보 편을 분리하고, 홍보 편은 주 1회 이하로 낸다.
5. **Threads에는 한국에서 확인된 직접 수익 경로가 없다.** 크몽 유입과 신뢰 형성 채널로 운영한다.

## 2. 채널별 운영 규칙

| 채널 | 게시 경로(채널당 하나) | 빈도 | 규칙 | 근거 |
|---|---|---|---|---|
| 인스타 | Windsor.ai `create_carousel_post` (1:1 JPEG 4장) | 매일 1편 | 외부 이미지·캡처 금지. 해시태그 5개 이하. 캡션마다 사례별 해설(원인·예방·CEO 판단)을 새로 쓴다. 게시 후 media_id를 기록하고, 재시도하기 전에 이미 게시됐는지 확인한다 | Meta 추천 가이드라인(독창성), 커뮤니티 가이드라인(스팸), 게시 API 24시간 한도 |
| Threads | Zapier→Buffer (Threads 채널) | 매일 1편 | 다른 채널 문장을 복사하지 않는다(MULTI-01). 구어체(SNS-01) | Meta 비독창 콘텐츠 노출 하향 |
| YouTube | Zapier→Buffer (YouTube 채널) | CEO 음성이 있는 편만 | 정지 컷 슬라이드만으로 된 영상 금지. 제목·설명·태그를 편마다 새로 쓴다 | YPP 진정성 없는 콘텐츠·재사용 콘텐츠, 스팸·현혹 행위 정책 |
| Blogger·네이버 | 기존대로 초안 | — | 이 기준의 적용 대상이 아니다. ADSENSE-01이 그대로 적용된다 | ADSENSE-01 |

- Buffer 인스타 초안 경로와 Windsor 즉시 게시 경로를 **동시에 쓰지 않는다.** 경로가 둘이면
  중복 게시 사고가 난다. 인스타 경로는 Windsor 하나로 고정한다.
- **Zapier 무료 한도**: 월 100태스크이고 MCP 호출 1번에 2태스크가 든다. Threads를 매일 올리면
  약 60태스크다. 월 80태스크에 도달하면 그 달 신규 게시를 멈춘다. 초과해도 과금이 아니라
  거절이 된다(COST-01).
- **Canva Pro 만료(약 2026-12-22)**: 만료되면 인스타 생산을 멈춘다. 갱신 여부는 CEO가 결정한다.

## 3. 발행 전 자동 검토 체크리스트

생성 세션과 분리된 리뷰 에이전트가 채점한다. **1~8번은 하나라도 '아니오'면 점수와 관계없이
게시 금지다.** 9~14번은 문항당 5점을 감점하고, 95점 미만이면 1회 재작성한다. 재작성해도
미달이면 그날은 게시하지 않고 Notion에 기록한다.

| # | 문항 |
|---|---|
| 1 | 채널당 게시 경로가 하나이고, 같은 편이 이미 게시되지 않았음을 게시 ID·대기열로 확인했는가? |
| 2 | 기업명·현장명·인명 등 특정인을 식별할 수 있는 정보가 0건인가? (정보통신망법 제70조) |
| 3 | 법령 조문 번호와 수치가 국가법령정보센터 원문과 대조됐고, 대조 URL이 기록돼 있는가? (언급이 없으면 '예') |
| 4 | 크몽을 언급하면 캡션 첫 줄에 "[광고] 본인 판매 상품 포함"이 있는가? (언급이 없으면 '예') |
| 5 | "보장·완벽·최고·유일·이것만 있으면·법적 요건 충족" 같은 효과 보증·최상급·단정 표현이 0건인가? (표시광고법 제3조) |
| 6 | 실제 사진·실존 인물로 오인할 만한 사실적 컷이 0개인가? (웹툰·일러스트 화풍은 허용) |
| 7 | 안전보건공단 사례를 참조했다면 공공누리 유형을 확인했고, 홍보 편이면 상업 이용이 허용되는 유형인가? (참조가 없으면 '예') |
| 8 | 원본 기여 요소(CEO 실무 판단 문장, CEO 음성, 직접 만든 도표) 중 하나 이상이 있는가? YouTube는 CEO 음성이 필수다 |
| 9 | "그림: AI 생성(Canva) · 기획·대사·검수: balmydaddy" 고지가 있고, "직접 그린" 같은 표현이 0건인가? |
| 10 | 같은 채널 직전 5편과 제목·첫 문장·CTA가 겹치지 않는가? |
| 11 | 다른 채널에 이미 게시된 문장을 그대로 옮긴 것이 아닌가? (MULTI-01) |
| 12 | 인스타 해시태그가 5개 이하인가? (인스타가 아니면 '예') |
| 13 | 이번 주 크몽 CTA가 들어간 게시물이 채널당 1편 이하인가? |
| 14 | 안전 정보 편에 "일반 정보이며 사업장별 위험성평가를 대체하지 않음"이 있는가? (안전 정보 편이 아니면 '예') |

## 4. 선행조건 — 이게 풀려야 자동 게시가 켜진다

1. **세션 권한**: 2026-09-27 이 세션에서 Buffer `share_now` 호출이 Claude Code 권한 검사
   ("외부 시스템 쓰기")에서 거절됐다. 자동 세션이 게시하려면 CEO가 권한 설정에 Zapier(Buffer)와
   Windsor.ai 게시 동작을 허용 규칙으로 넣어야 한다. 세션은 이 권한을 스스로 바꾸지 않는다.
2. 권한이 열리기 전까지는 SNS-01대로 Buffer 초안으로만 넣는다.

## 5. 미확인

- Buffer를 거쳐 YouTube에 올릴 때 'AI 사용(변경·합성 콘텐츠)' 속성을 지정할 수 있는지
- Canva AI 출력물에 C2PA 메타데이터가 들어가는지(들어가면 Meta가 'AI 정보' 라벨을 자동으로 붙인다)
- Canva AI 이미지 생성 월 한도
- 안전보건공단 재해사례 게시판의 공공누리 유형
- 한국 계정의 Instagram 선물·보너스 이용 가능 여부, Threads 보너스 대상 국가
- 크몽의 외부 SNS 홍보·외부 링크 정책
- 매일 자동 세션이 Claude Pro 사용한도에 주는 부담(USAGE-05)

## 6. 출처

- YPP 수익화 정책(진정성 없는 콘텐츠·재사용): https://support.google.com/youtube/answer/1311392
- YouTube 스팸·현혹 행위: https://support.google.com/youtube/answer/2801973
- YouTube 변경·합성 콘텐츠 공개: https://support.google.com/youtube/answer/14328491
- Meta AI 표시: https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/
- Meta 추천 가이드라인: https://transparency.meta.com/features/approach-to-content-recommendations/
- Instagram 콘텐츠 게시 API: https://developers.facebook.com/docs/instagram-platform/content-publishing/
- Instagram 수익화 정책: https://help.instagram.com/512371932629820
- Zapier 무료 플랜: https://help.zapier.com/hc/en-us/articles/32337438839565
- Zapier MCP 사용량: https://docs.zapier.com/mcp/overview/usage
- Buffer 대기열: https://support.buffer.com/article/643-how-many-posts-can-i-schedule-in-advance
- 인공지능 기본법: https://www.law.go.kr/lsInfoP.do?lsiSeq=268543
- 표시광고법: https://www.law.go.kr/LSW/lsInfoP.do?lsId=002011
- 추천·보증 심사지침: https://www.law.go.kr/admRulInfoP.do?admRulSeq=2100000190311
- 생성형 AI 저작권 등록 안내서: https://www.copyright.or.kr/information-materials/publication/research-report/view.do?brdctsno=54253
- Canva AI 제품 약관: https://www.canva.com/policies/ai-product-terms/
- 공공누리 유형: https://www.kogl.or.kr/info/licenseType1.do
