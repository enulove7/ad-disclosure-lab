# 배포 가이드 (Supabase + Vercel)

전부 무료 플랜으로 가능하고, 처음부터 끝까지 15분 정도 걸린다. 순서대로 따라가면 된다.

## 1. Supabase 프로젝트 만들기 (5분)

1. https://supabase.com 접속 → GitHub 계정으로 가입/로그인.
2. **New project** 클릭.
   - Name: `ad-disclosure-lab`
   - Database Password: 아무거나 강한 비밀번호 (메모해 둘 것, 나중에 직접 쓸 일은 거의 없음)
   - Region: **Northeast Asia (Tokyo)** 선택 (일본 참가자 기준 가장 빠름)
   - Create new project → 1~2분 기다림.
3. 왼쪽 메뉴 **SQL Editor** → **New query**.
4. 이 저장소의 `supabase/migrations/0001_init.sql` 파일 내용을 전부 복사해 붙여넣고 **Run**.
   "Success. No rows returned" 가 나오면 성공. 왼쪽 **Table Editor**에 experiments, conditions 등 7개 테이블이 보이면 된다.
5. 왼쪽 메뉴 **Project Settings** (톱니바퀴) → **API** 에서 두 값을 복사:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** 키 (Reveal 눌러서) → `SUPABASE_SERVICE_ROLE_KEY`

   service_role 키는 모든 데이터를 읽고 쓸 수 있는 키다. Vercel 환경변수에만 넣고 절대 코드나 채팅에 붙여넣지 말 것.

## 2. Vercel에 배포하기 (5분)

1. https://vercel.com 접속 → **Continue with GitHub** 으로 가입/로그인.
2. **Add New… → Project** → 저장소 목록에서 `enulove7/ad-disclosure-lab` 옆 **Import**.
   목록에 안 보이면 "Adjust GitHub App Permissions" 를 눌러 Vercel에 이 저장소 접근을 허용한다.
3. Framework Preset 이 **Next.js** 로 자동 인식되는지 확인. Build 설정은 건드리지 않는다.
4. **Environment Variables** 섹션을 펼쳐서 3개를 추가:

   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | 관리자 화면 비밀번호 (직접 정함) |
   | `SUPABASE_URL` | 1-5 에서 복사한 Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | 1-5 에서 복사한 service_role 키 |

5. **Deploy** → 2~3분 기다림 → "Congratulations" 화면에서 도메인 확인 (예: `ad-disclosure-lab.vercel.app`).

## 3. 동작 확인 (2분)

1. `https://<도메인>/admin` 접속 → ADMIN_PASSWORD 로 로그인.
2. 오른쪽 위 배지가 **Supabase** (초록색)인지 확인. 노란색 "Local JSON" 이면 환경변수가 안 들어간 것 → Vercel 프로젝트 Settings → Environment Variables 확인 후 **Redeploy**.
3. 빨간 "데이터베이스에 연결할 수 없습니다" 가 뜨면 1-4 의 SQL 이 실행되지 않았거나 키가 틀린 것.
4. **새 실험** → 프리셋 켜고 만들기 → 개요에서 공개 상태를 **공개 중** 으로 저장 → 참여 URL 을 휴대폰으로 열어 한 번 끝까지 진행 → 참가자 탭에 1명이 보이고 CSV 가 내려오면 끝.

## 이후 업데이트

GitHub `main` 에 푸시하면 Vercel 이 자동으로 다시 배포한다. 별도 작업 불필요.

## 자주 생기는 문제

- **이미지 업로드가 안 됨**: Supabase Storage 에 `ad-images` 버킷이 없는 경우. SQL 의 마지막 insert 문이 실행됐는지 확인하거나, Storage 메뉴에서 Public 버킷 `ad-images` 를 직접 만든다.
- **로그인 화면에서 "ADMIN_PASSWORD 가 설정되어 있지 않습니다"**: Vercel 환경변수 누락. 추가 후 Redeploy.
- **무료 플랜 제한**: Supabase 무료 프로젝트는 1주일간 접속이 없으면 일시정지된다. 대시보드에서 Restore 를 누르면 바로 복구되고 데이터는 유지된다.
