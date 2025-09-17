# 풋살 매칭 MVP (React + Vite + Vercel + Supabase)

## 0) 사전 준비
- Supabase 프로젝트 생성 → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 확보
- Supabase SQL Editor에서 `scripts/db/*.sql` 순서대로 실행 (001 → 002 → 003)

## 1) 로컬 실행
```bash
pnpm i   # 또는 npm i / yarn
pnpm dev # http://localhost:5173
```

루트에 `.env`를 만들고 다음 값 세팅:
```
VITE_SUPABASE_URL=...your url...
VITE_SUPABASE_ANON_KEY=...your anon key...
```

## 2) 빌드/배포
- `pnpm build` (Vercel은 자동 빌드)
- Vercel 환경변수에 `.env`와 동일 키 추가

## 구조
- 기능 단위(features)로 API/훅/컴포넌트/타입 분리
- 라우트는 `src/app/routes/`에 배치하고 얇게 유지
