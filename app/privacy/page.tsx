import type { Metadata } from "next";
import Link from "next/link";
import { STORE, telHref } from "../../lib/site";
import { SiteHeader, SiteFooter, MobileCtaBar } from "../../lib/ui";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${STORE.name} 홈페이지의 고객 상담 및 매입 견적 신청 관련 개인정보 수집·이용 및 보호 방침 안내입니다.`,
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] font-sans text-[#1F2530] flex flex-col">
      <SiteHeader />

      <main className="hb-container py-10 sm:py-14 flex-1">
        <div className="mx-auto max-w-3xl rounded-md border border-[#E4E0D8] bg-white p-6 sm:p-10 shadow-xs">
          <p className="hb-eyebrow">Privacy Policy</p>
          <h1 className="mt-2 text-[24px] sm:text-[30px] font-bold text-[#0E1A2B] pb-5 border-b border-[#E4E0D8]">
            개인정보처리방침
          </h1>

          <div className="mt-6 space-y-7 text-[14.5px] leading-[1.75] text-[#4B5260]">
            <p>
              <strong className="text-[#0E1A2B]">{STORE.name}</strong>(이하
              &ldquo;회사&rdquo;)는 개인정보보호법 등 관련 법령에 따라 이용자의
              개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수
              있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>

            <section className="space-y-2">
              <h2 className="text-[16px] font-bold text-[#0E1A2B]">
                1. 개인정보의 수집 및 이용 목적
              </h2>
              <p>회사는 다음의 목적을 위하여 최소한의 개인정보를 처리합니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  중고가전 및 업소용 기기 구매 상담, 재고 확인, 배송·설치 견적 안내
                </li>
                <li>
                  고객 보유 가전·주방기기의 방문 매입 견적 산정 및 수거 일정 조율
                </li>
                <li>
                  문의게시판 비밀글 본인 확인, 진행 상태 조회 및 관리자 답변 안내
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-[16px] font-bold text-[#0E1A2B]">
                2. 수집하는 개인정보의 항목
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong className="text-[#0E1A2B]">필수항목:</strong> 성함(또는
                  상호명), 연락처(전화번호), 게시글 조회용 비밀번호(암호화 해시
                  저장), 문의 제목 및 상세 내용
                </li>
                <li>
                  <strong className="text-[#0E1A2B]">선택항목:</strong> 제품
                  카테고리, 모델명, 외관·작동 상태 등급, 방문 수거 또는 배송 희망
                  지역, 제품 첨부 사진
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-[16px] font-bold text-[#0E1A2B]">
                3. 개인정보의 보유 및 이용기간
              </h2>
              <p>
                회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당
                정보를 지체 없이 파기합니다. 또한 이용자는 문의게시판에서 본인이
                설정한 비밀번호를 통해 언제든지 직접 게시글과 첨부 정보를 삭제할 수
                있습니다. 단, 관계법령에 의해 보존할 필요가 있는 경우 법령이 정한
                기간 동안 보관합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[13.5px]">
                <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-[16px] font-bold text-[#0E1A2B]">
                4. 개인정보의 제3자 제공 및 안전성 확보 조치
              </h2>
              <p>
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않으며,
                문의게시판 공개 목록에서는 작성자 성함을 마스킹 처리하고 연락처와
                본문을 비공개로 보호합니다. 조회용 비밀번호는 서버에서 단방향
                암호화(scrypt 해시)하여 저장합니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-[16px] font-bold text-[#0E1A2B]">
                5. 개인정보 보호책임자 안내
              </h2>
              <div className="rounded-md border border-[#E4E0D8] bg-[#FAF9F7] p-4 text-[13.5px] space-y-1">
                <p>
                  • <strong className="text-[#0E1A2B]">상호:</strong> {STORE.name}{" "}
                  (대표: {STORE.ceo})
                </p>
                <p>
                  •{" "}
                  <strong className="text-[#0E1A2B]">
                    개인정보 보호책임자:
                  </strong>{" "}
                  {STORE.privacyOfficer}
                </p>
                <p>
                  • <strong className="text-[#0E1A2B]">대표 전화:</strong>{" "}
                  <a
                    href={telHref(STORE.tel)}
                    className="font-bold text-[#0E1A2B] underline"
                  >
                    {STORE.tel}
                  </a>
                </p>
                <p>
                  • <strong className="text-[#0E1A2B]">사업장 주소:</strong>{" "}
                  {STORE.address} ({STORE.addressNote})
                </p>
              </div>
            </section>

            <div className="pt-5 border-t border-[#E4E0D8] flex flex-wrap items-center justify-between gap-4 text-[13px] text-[#6B7280]">
              <span>시행일자: 2026년 1월 1일</span>
              <Link href="/" className="hb-btn-primary h-10 px-5 text-[13.5px]">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}