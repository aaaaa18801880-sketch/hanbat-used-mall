// 파일 경로: components/admin/admin-inquiries-tab.tsx
"use client";

import React from "react";
import {
  INQUIRY_ADMIN_STATUS_OPTIONS,
  extractInquiryImages,
  isPriorityInquiryStatus,
  telHref,
  type NotificationDispatchResult,
} from "../../lib/site";
import { SafeImg } from "../../lib/ui";
import {
  INQUIRY_REPLY_TEMPLATES,
  StructuredInquiryCard,
} from "../inquiry/structured-inquiry-card";
import type { AdminInquiryRow } from "./admin-types";

interface AdminInquiriesTabProps {
  inquiries: AdminInquiryRow[];
  inqStatusFilter: string;
  setInqStatusFilter: (value: string) => void;
  inqTypeFilter: string;
  setInqTypeFilter: (value: string) => void;
  inqKeyword: string;
  setInqKeyword: (value: string) => void;
  activeReplyId: string | null;
  setActiveReplyId: (id: string | null) => void;
  replyDraft: string;
  setReplyDraft: (text: string) => void;
  busyActionId: string | null;
  notificationLogs: Record<string, NotificationDispatchResult>;
  onStatusChange: (inquiryId: string, nextStatus: string) => void;
  onSaveReply: (inquiryId: string) => void;
  onDeleteInquiry: (inquiryId: string, title: string) => void;
  onManualDispatch: (
    channel: "telegram" | "alimtalk",
    inq: {
      id: string;
      name: string;
      phone: string;
      inquiry_type: string;
      category: string;
    }
  ) => void;
}

/** 관리자 대시보드 고객 문의·매입 통합 관리 탭 */
export function AdminInquiriesTab({
  inquiries,
  inqStatusFilter,
  setInqStatusFilter,
  inqTypeFilter,
  setInqTypeFilter,
  inqKeyword,
  setInqKeyword,
  activeReplyId,
  setActiveReplyId,
  replyDraft,
  setReplyDraft,
  busyActionId,
  notificationLogs,
  onStatusChange,
  onSaveReply,
  onDeleteInquiry,
  onManualDispatch,
}: AdminInquiriesTabProps) {
  return (
    <section className="rounded-xl border border-[#E2E6EC] bg-white p-4 sm:p-6 shadow-2xs space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-[#E2E6EC] pb-4">
        <div>
          <h2 className="text-hb-lg sm:text-hb-lg font-extrabold text-[#141A23]">
            고객 문의 및 매입 신청 통합 관리
          </h2>
          <p className="mt-0.5 text-hb-xs sm:text-hb-sm text-[#6B7280]">
            신규 접수 건을 우선 확인하고, 진행 상태를 명시적으로 선택하여 변경하거나 답변을 등록하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="문의 상태 필터"
            value={inqStatusFilter}
            onChange={(e) => setInqStatusFilter(e.target.value)}
            className="h-9 rounded border border-[#E2E6EC] bg-white px-2.5 text-hb-xs sm:text-hb-sm font-bold text-[#141A23]"
          >
            <option value="priority">미처리 신규(접수·검토중)만</option>
            <option value="전체">전체 상태 보기</option>
            <option value="notice">등록된 공지사항만 보기</option>
            {INQUIRY_ADMIN_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} 상태만
              </option>
            ))}
          </select>

          <select
            aria-label="문의 유형 필터"
            value={inqTypeFilter}
            onChange={(e) => setInqTypeFilter(e.target.value)}
            className="h-9 rounded border border-[#E2E6EC] bg-white px-2.5 text-hb-xs sm:text-hb-sm font-semibold text-[#4B5260]"
          >
            <option value="전체">모든 문의 유형</option>
            <option value="내 물건 팔기">내 물건 팔기 (매입)</option>
            <option value="구매 문의">구매 문의</option>
            <option value="대량·업소용 상담">대량·업소용 상담</option>
            <option value="기타 문의">기타 문의</option>
          </select>

          <input
            type="search"
            aria-label="고객명·연락처·제목 검색"
            value={inqKeyword}
            onChange={(e) => setInqKeyword(e.target.value)}
            placeholder="고객명·연락처·제목 검색"
            className="h-9 flex-1 sm:flex-none rounded border border-[#E2E6EC] px-3 text-hb-xs sm:text-hb-sm"
          />
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="py-12 text-center text-hb-sm text-[#64748B]">
          해당 조건에 맞는 문의/매입 신청 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((req) => {
            const imgs = extractInquiryImages(req);
            const isPriority = isPriorityInquiryStatus(req.status);
            const tgLog = notificationLogs[`telegram:${req.id}`];

            return (
              <div
                key={req.id}
                className={`rounded-xl border p-4 sm:p-5 transition-colors ${
                  isPriority
                    ? "border-[#D9531E]/50 bg-[#FFFDFB] shadow-2xs"
                    : "border-[#E2E6EC] bg-white"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {isPriority && !req.is_notice && (
                        <span className="rounded-sm bg-[#E8521A] px-2 py-0.5 text-hb-xs font-bold text-white">
                          우선 확인
                        </span>
                      )}
                      <span
                        className={`rounded-sm px-2.5 py-0.5 text-hb-xs font-bold ${
                          req.is_notice
                            ? "bg-[#141A23] text-white"
                            : INQUIRY_ADMIN_STATUS_OPTIONS.find(
                                (o) => o.value === (req.status || "접수")
                              )?.badgeClass || "bg-[#141A23] text-white"
                        }`}
                      >
                        {req.is_notice ? "공지" : req.status || "접수"}
                      </span>
                      <span className="rounded-sm bg-[#F2F0EC] px-2 py-0.5 text-hb-xs font-bold text-[#4B5260]">
                        {req.is_notice ? "공지사항" : req.inquiry_type || "문의"}
                      </span>
                      <span className="text-hb-xs sm:text-hb-xs text-[#64748B] tabular-nums">
                        {new Date(req.created_at).toLocaleString("ko-KR")}
                      </span>
                    </div>

                    <h3 className="text-hb-base sm:text-hb-base font-bold text-[#141A23] pt-1">
                      {req.category}
                    </h3>

                    <p className="text-hb-sm sm:text-hb-sm text-[#4B5260] flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        접수자: <strong className="text-[#141A23]">{req.name}</strong>
                      </span>
                      {req.phone && (
                        <a
                          href={telHref(req.phone)}
                          className="font-bold text-[#E8521A] underline tabular-nums"
                        >
                          {req.phone}
                        </a>
                      )}
                      {req.region && (
                        <span className="text-[#6B7280]">
                          지역: {req.region}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F2EFE9]">
                    {!req.is_notice && (
                      <>
                        <label className="text-hb-xs font-bold text-[#6B7280]">
                          상태:
                        </label>
                        <select
                          aria-label={`${req.category} 진행 상태 선택`}
                          value={req.status || "접수"}
                          disabled={busyActionId === `inq-status-${req.id}`}
                          onChange={(e) =>
                            onStatusChange(req.id, e.target.value)
                          }
                          className="h-9 rounded border border-[#141A23] bg-white px-2.5 text-hb-xs font-bold text-[#141A23]"
                        >
                          {INQUIRY_ADMIN_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveReplyId(
                              activeReplyId === req.id ? null : req.id
                            );
                            setReplyDraft(req.admin_reply || "");
                          }}
                          className="h-9 rounded bg-[#141A23] px-3 text-hb-xs font-bold text-white hover:bg-[#1E2736]"
                        >
                          {req.admin_reply ? "답변 수정" : "답변 작성"}
                        </button>

                        <button
                          type="button"
                          disabled={busyActionId === `notify-telegram-${req.id}`}
                          onClick={() => onManualDispatch("telegram", req)}
                          className="h-9 rounded border border-[#141A23]/30 bg-white px-2.5 text-hb-xs font-bold text-[#141A23] hover:bg-[#F9FAFB]"
                          title="텔레그램 알림 수동 재전송"
                        >
                          텔레그램
                        </button>
                        <button
                          type="button"
                          disabled
                          className="h-9 rounded border border-gray-200 bg-gray-100 px-2.5 text-hb-xs font-semibold text-gray-400 cursor-not-allowed opacity-75"
                          title="알림톡은 대행사 API 연동 준비 중입니다 (텔레그램 알림 활성)"
                        >
                          알림톡 연동 준비중
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      disabled={busyActionId === `inq-del-${req.id}`}
                      onClick={() => onDeleteInquiry(req.id, req.category)}
                      className="h-9 rounded border border-red-200 bg-red-50 px-2.5 text-hb-xs font-bold text-red-600 hover:bg-red-100 ml-auto md:ml-1"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <StructuredInquiryCard
                  description={req.description}
                  isAdmin
                  conditionHeading={`고객 확인 상담 조건 (${req.inquiry_type})`}
                  plainClassName="mt-3 rounded bg-[#F9FAFB] p-3.5 text-hb-sm text-[#1F2530] whitespace-pre-wrap leading-relaxed border border-[#E2E6EC]"
                />

                {imgs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {imgs.map((url, idx) => (
                      <a
                        key={url + idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-16 w-16 overflow-hidden rounded border border-[#E2E6EC] bg-[#F1F3F6]"
                        title="클릭하여 원본 사진 보기"
                      >
                        <SafeImg
                          src={url}
                          alt="첨부 이미지"
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {req.admin_reply && activeReplyId !== req.id && (
                  <div className="mt-3 rounded border border-[#FADCD0] bg-[#FFF4EE] p-3 text-hb-sm text-[#4B5260]">
                    <strong className="text-[#E8521A] block mb-1">
                      등록된 관리자 답변:
                    </strong>
                    <p className="whitespace-pre-wrap">{req.admin_reply}</p>
                  </div>
                )}

                {activeReplyId === req.id && (
                  <div className="mt-3 space-y-2 border-t border-[#E2E6EC] pt-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-hb-xs font-bold text-[#6B7280] mr-1">
                        빠른 답변 템플릿:
                      </span>
                      {INQUIRY_REPLY_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          onClick={() => setReplyDraft(tpl.text)}
                          className="rounded border border-[#E2E6EC] bg-[#F9FAFB] px-2.5 py-1 text-hb-xs font-semibold text-[#141A23] hover:border-[#141A23]"
                        >
                          + {tpl.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={3}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="고객에게 안내할 답변 내용을 입력하세요."
                      className="hb-input text-hb-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveReplyId(null)}
                        className="hb-btn-outline h-9 px-4 text-hb-xs"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        disabled={busyActionId === `inq-reply-${req.id}`}
                        onClick={() => onSaveReply(req.id)}
                        className="hb-btn-primary h-9 px-5 text-hb-xs"
                      >
                        답변 저장 및 답변완료 처리
                      </button>
                    </div>
                  </div>
                )}

                {tgLog && (
                  <div className="mt-2 text-hb-xs text-[#6B7280]">
                    최근 텔레그램 발송 상태:{" "}
                    <strong>{tgLog.statusLabel}</strong> — {tgLog.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
