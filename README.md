# Ad Disclosure Lab

AI 광고 공개(開示) 방식이 소비자 반응에 미치는 영향을 측정하는 실험 플랫폼.
광고 소재를 올리고 공개 라벨 조건을 여러 개 만들면, 참가자를 조건에 무작위 배정해
광고를 보여주고 설문 응답을 수집한 뒤 CSV로 내보낼 수 있다.

## 빠른 시작 (로컬, Supabase 없이)

```bash
npm install
cp .env.example .env.local   # ADMIN_PASSWORD 를 원하는 값으로 수정
npm run dev
```

- 관리자: http://localhost:3000/admin (비밀번호는 `.env.local`의 `ADMIN_PASSWORD`)
- 「新しい実験」에서 프리셋을 켜고 만들면 조건 C0~C3, 데모 광고 2개, 기본 설문 세트가 자동으로 들어간다.
- 概要 탭에서 公開状態를 「公開中」으로 바꾸면 `/p/<slug>` 링크로 참가할 수 있다.
- Supabase 설정이 없으면 모든 데이터는 `data/db.json`에 저장된다(개발·테스트용).

## Supabase로 전환

1. Supabase 프로젝트 생성 → SQL Editor에서 `supabase/migrations/0001_init.sql` 실행.
2. `.env.local`에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 추가.
3. 재시작하면 관리자 화면 오른쪽 위 배지가 `Supabase`로 바뀐다.

service role 키는 서버에서만 쓰이고 브라우저로는 절대 나가지 않는다. RLS가 켜져 있어 anon 키로는 아무 것도 읽을 수 없다.
광고 이미지는 공개 버킷 `ad-images`에 올라간다.

## Vercel 배포

리포지토리를 연결하고 환경변수 3개(`ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)를 넣으면 끝.
Vercel의 파일시스템은 읽기 전용이라 로컬 JSON 저장소는 배포 환경에서 쓸 수 없다. 반드시 Supabase를 설정할 것.

## 언어 (일본어 / 한국어)

- **참가자 화면**: 실험마다 언어를 정한다(새 실험 만들기 또는 개요 탭의 「참가자 화면 언어」). 프리셋도 그 언어로 들어간다.
  일본인 대상 실험과 한국인 대상 실험을 같은 앱에서 동시에 돌릴 수 있다.
- **관리자 화면**: 오른쪽 위 토글(日本語 / 한국어)로 바꾼다. 쿠키에 저장되며 기본은 한국어.
- 문구는 모두 `src/lib/i18n.ts` 한 파일에 있다. 영어 등 다른 언어를 추가하려면 `Locale`에 코드를 추가하고 사전을 하나 더 쓰면 된다.

## 구조

```
src/
  app/p/[slug]/…        참가자 흐름: 동의 → 사전 설문 → 광고 n개(노출+설문) → 최종 설문 → 디브리핑
  app/admin/…           관리자: 실험 목록/생성, 概要·条件·広告·質問·プレビュー·参加者, CSV 내보내기
  components/AdCard     SNS 피드 스타일 광고 카드. 이미지 위에 라벨을 CSS로 오버레이
  components/DisclosureLabel  라벨 설정(문구·위치·크기·스타일·아이콘) → 화면 요소
  lib/types.ts          도메인 타입(=DB 컬럼명)
  lib/db/               저장소 인터페이스 + 로컬 JSON 구현 + Supabase 구현
  lib/participant.ts    조건 배정, 노출 순서, 다음 단계 계산, 응답 파싱
  lib/presets.ts        C0~C3 조건, 데모 광고, 기본 설문 세트(일본어·한국어)
  lib/i18n.ts           화면 고정 문구 사전(ja / ko)
  lib/export.ts         long / wide CSV 생성
supabase/migrations/    DB 스키마
scripts/e2e/flow.mjs    Playwright 스모크 테스트(관리자 생성 → 참가자 5명 완주 → CSV 확인)
```

## 데이터 모델

| 테이블 | 역할 |
|---|---|
| experiments | 실험 단위. 동의문·디브리핑·설정(최소 노출 시간, 배정 방식 등) |
| conditions | 공개 라벨 조건. `label_config`(enabled/text/description/position/size/style/show_icon) |
| ads | 광고 소재. 가상 브랜드, 문구, 이미지, 제품 카테고리 |
| survey_items | 설문 문항. phase = pre / post_ad / final, construct = 분석용 구성개념 |
| participants | 참가자. 조건 배정 결과, 상태, 시작·완료 시각 |
| exposures | 참가자 × 광고 노출. 순서, 노출 시각, 노출 시간(ms), 라벨 스냅샷 |
| responses | 응답 1건 = 1행. exposure_id 로 어느 광고에 대한 응답인지 연결 |

조건을 나중에 수정해도 `exposures.label_snapshot`에 노출 당시 라벨이 남아 있으므로 과거 데이터 해석이 꼬이지 않는다.

## CSV

- `long`: 응답 1건 = 1행. R/Python에서 pivot 하기 좋다.
- `wide`: 참가자 1명 = 1행. 광고별 문항은 `{ad_code}__{item_code}` 열. 엑셀에서 바로 보기 좋다.
- 둘 다 BOM이 붙어 있어 일본어 환경 Excel에서 깨지지 않는다.

## 테스트

```bash
npm run dev            # 다른 터미널에서
node scripts/e2e/flow.mjs
# CHROME_PATH=/path/to/chrome 로 브라우저 지정 가능, 스크린샷은 scripts/e2e/shots/
```

## 다음 단계

- 2단계: 파일럿 → 분석 스크립트(R/Python) → 관리자 화면에 조건별 평균 그래프
- 3단계: 「AI일까 사람일까」 스와이프 게임 모듈
- 논문 전환 시: 검증된 척도 원문으로 문항 교체, 표본 수 계산, 사전등록, 윤리심사
