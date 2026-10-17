# 실험 자극물(광고 이미지) 제작 가이드

앱에 들어 있는 `/demo/*.svg` 는 흐름 확인용 임시 그림이다. 실제 실험에는 반드시 **이미지 생성 AI로 만든 사진급 이미지**를 써야 한다.
디브리핑에서 "모든 이미지는 AI 생성"이라고 밝히므로, 실제 사진이나 사람이 그린 이미지를 쓰면 안 된다.

## 목표 수준

- 라벨이 없을 때 참가자 대부분이 "실제 사진 또는 전문 디자이너 작업"이라고 믿는 수준.
- 사전검사에서 "AI로 만든 것 같다"는 자발적 응답이 **30% 이하**인 이미지만 채택.
- 두 제품(쾌락적/실용적)의 이미지 품질 평가 점수가 서로 비슷할 것 (품질 차이가 제품 유형 효과와 섞이면 안 됨).

## 규격

| 항목 | 값 |
|---|---|
| 비율·크기 | 1:1, 1080×1080 이상 |
| 텍스트 | 이미지 안에 글자·로고 없음 (헤드라인·브랜드명은 카드가 따로 표시) |
| 스타일 | 상업 광고 사진. 일러스트·3D 느낌 금지 |
| 브랜드 | 실제 브랜드와 닮지 않게. 병·패키지는 무지(無地) |
| 인물 | 넣는다면 일본인/한국인 외모, 과도한 미화 금지. 손가락·치아·귀걸이 좌우 등 AI 흔적 확인 |

## 추천 도구

Midjourney(v7 이상), Google Imagen / Gemini 이미지 생성, OpenAI GPT 이미지 생성, Flux 계열. 어느 것이든 **같은 도구로 두 제품을 모두** 만들어 스타일을 맞춘다.
도구마다 6~8장씩 뽑아서 사전검사로 고른다.

## 프롬프트

### 1. 화장품 세럼 (쾌락적)

```
Professional cosmetic advertising photograph of a single frosted glass serum bottle with a dropper cap,
no label, no text, standing on a wet pale stone surface with soft morning sunlight from the left,
dewy water droplets, shallow depth of field, blurred warm beige background, soft shadows,
shot on a Hasselblad medium format camera, 85mm lens, f/2.8, studio product photography,
high-end skincare campaign, muted pastel palette, square 1:1
```

변형 아이디어: 병 옆에 흰 꽃잎 한두 장 / 반투명 커튼 그림자 / 손등에 세럼 한 방울 떨어뜨리는 손(여성, 20~30대 동아시아인).

### 2. 자동차보험 (실용적)

```
Editorial lifestyle photograph for an insurance campaign: a Japanese father in his late 30s and
a young daughter smiling while loading a small suitcase into the trunk of a clean modern silver
compact SUV, suburban residential street, soft overcast daylight, natural skin tones,
candid moment, documentary advertising style, shot on Canon EOS R5, 35mm lens, f/4,
no text, no logos, no license plate visible, square 1:1
```

변형 아이디어: 비 오는 날 차 안에서 안도하는 운전자 / 밤에 주차장에서 전화 통화하는 운전자(사고 대응 이미지) / 가족이 차 앞에서 떠나기 직전.

### 부정 프롬프트 (지원 도구에서)

```
text, letters, logo, watermark, illustration, 3d render, cartoon, extra fingers, deformed hands,
oversaturated, HDR look, plastic skin
```

## 사전검사 절차 (20~30명)

1. 라벨 없는 이미지 6~8장을 무작위 순서로 보여준다.
2. 각 이미지마다: 품질(1~7), 광고로서 자연스러움(1~7), "이 이미지는 어떻게 만들어졌다고 생각하나?" (실제 사진 / 디자이너가 제작 / AI 생성 / 모르겠다).
3. AI 생성 응답 비율이 가장 낮고 품질 점수가 두 제품 간 비슷한 조합을 고른다.
4. 이 사전검사는 앱으로 돌릴 수 있다: 실험을 하나 만들고 조건은 C0 하나만, 광고 6~8개, 광고별 설문에 위 3문항만 넣으면 된다.

## 앱 안에서 생성하기 (권장)

관리자 → 광고 탭 → 각 광고 아래 **AI로 이미지 생성** 패널.
프롬프트(광고 프리셋에 위 프롬프트가 미리 들어 있음)와 모델, 장수(1~4)를 정하고 생성하면 후보가 쌓인다.
후보 중 하나를 **이 이미지 사용**으로 채택하면 광고 이미지가 바뀌고, 그 프롬프트와 모델명이 광고에 함께 기록된다(논문 방법론 기술용).

필요한 설정:
- 환경변수 `GEMINI_API_KEY` (Google AI Studio 에서 발급). 로컬은 `.env.local`, 배포는 Vercel 환경변수.
- Google 이미지 모델은 **무료 범위에서 쓸 수 없다**. AI Studio → 왼쪽 아래 Settings → Plan information 에서 결제(Billing)를 연결해야 한다. 비용은 1장당 몇 엔 수준.
- 모델은 패널에서 고른다. 기본은 Gemini 3.1 Flash Image. 더 높은 품질이 필요하면 Gemini 3 Pro Image.
- 로컬에서 비용 없이 흐름만 확인하려면 `IMAGE_PROVIDER=mock` 으로 실행하면 단색 이미지가 생성된다.

## 직접 업로드

관리자 → 광고 탭 → 각 광고의 "이미지 업로드"에서 파일 선택 → 저장. Supabase Storage 의 `ad-images` 버킷에 올라가고 URL 이 자동으로 채워진다.
