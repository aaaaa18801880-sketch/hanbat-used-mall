// 파일 경로: components/admin/admin-login-card.tsx
"use client";

import React from "react";
import Link from "next/link";
import { STORE } from "../../lib/site";

interface AdminLoginCardProps {
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  loginPw: string;
  setLoginPw: (pw: string) => void;
  loggingIn: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}

/** 관리자 인증 전 로그인 게이트 카드 */
export function AdminLoginCard({
  loginEmail,
  setLoginEmail,
  loginPw,
  setLoginPw,
  loggingIn,
  onSubmit,
}: AdminLoginCardProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans focus:outline-none"
    >
      <div className="bg-white p-7 sm:p-9 rounded-xl shadow-card border border-[#E2E6EC] w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="inline-block rounded-md bg-[#141A23] px-2.5 py-0.5 text-hb-xs font-bold text-[#FF8A50]">
            관리자 콘솔
          </span>
          <h1 className="mt-2 text-hb-xl font-extrabold text-[#141A23] tracking-[-0.02em]">
            {STORE.name} 통합 관리자
          </h1>
          <p className="mt-1 text-hb-sm text-[#6B7280]">
            인가된 관리자 계정으로 로그인해야 접근할 수 있습니다.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-login-email" className="hb-label">
              관리자 이메일
            </label>
            <input
              id="admin-login-email"
              name="username"
              type="email"
              autoComplete="username"
              spellCheck={false}
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="admin@example.com"
              className="hb-input mt-1"
            />
          </div>
          <div>
            <label htmlFor="admin-login-pw" className="hb-label">
              비밀번호
            </label>
            <input
              id="admin-login-pw"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={loginPw}
              onChange={(e) => setLoginPw(e.target.value)}
              placeholder="••••••••"
              className="hb-input mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={loggingIn}
            className="hb-btn-primary h-12 w-full text-hb-sm"
          >
            {loggingIn ? "인증 확인 중..." : "관리자 로그인"}
          </button>
        </form>
        <div className="mt-5 pt-4 border-t border-[#E2E6EC] text-center">
          <Link
            href="/"
            className="text-hb-xs font-semibold text-[#6B7280] hover:text-[#141A23] underline underline-offset-4"
          >
            ← 고객용 홈 화면으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
