This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 로컬 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다. `.env.local`은 커밋하지 않습니다.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 공개 Supabase 연결
- `SUPABASE_SERVICE_ROLE_KEY`: **서버 전용**. RLS 적용 후 관리자 API, 고객 문의 조회, 비공개 첨부 사진 서명 URL 발급에 필요합니다. 이 키가 없으면 로컬 문의 게시판에는 공지만 표시됩니다.
- `GEMINI_API_KEY`: AI 상품·문의 분석
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`: 신규 문의 알림
- `ALIMTALK_API_KEY`, `ALIMTALK_USER_ID`: 알림톡 연동 준비용

`SUPABASE_SERVICE_ROLE_KEY`는 절대 `NEXT_PUBLIC_` 접두사를 붙이거나 클라이언트 컴포넌트에서 사용하지 마세요.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
