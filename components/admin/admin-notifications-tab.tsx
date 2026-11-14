// 파일 경로: components/admin/admin-notifications-tab.tsx
"use client";

import React from "react";
import type { NotificationDispatchResult } from "../../lib/site";
import type { AdminInquiryRow } from "./admin-types";

interface AdminNotificationsTabProps {
  inquiries: AdminInquiryRow[];
  notificationLogs: Record<string, NotificationDispatchResult>;
  busyActionId: string | null;
  onManualDispatch: (
    channel: "telegram" | "alimtalk",
    inq: AdminInquiryRow
  ) => void;
}

/** 관리자 페이지 외부 알림(Telegram / 알림톡) 발송 상태 관리 및 재시도 탭 */
export function AdminNotificationsTab({
  inquiries,
  notificationLogs,
  busyActionId,
  onManualDispatch,
}: AdminNotificationsTabProps) {
  return (
    <section className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6 space-y-5 shadow-2xs">
      <div>
        <h2 className="text-hb-lg font-bold text-[#141A23]">
          외부 알림(Telegram / 알림톡) 발송 상태 관리 및 재시도
        </h2>
        <p className="mt-1 text-hb-sm text-[#6B7280]">
          환경변수 미설정이나 외부 서버 오류 시 거짓 성공으로 표시하지 않고,{" "}
          <strong>
            [발송 대기 / 발송 성공 / 설정 미완료 / 외부 서비스 오류 / 재시도 필요]
          </strong>{" "}
          5가지 상태로 정확히 구분합니다.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-hb-sm border-t border-[#E2E6EC]">
          <thead className="bg-[#F9FAFB] text-[#6B7280] border-b border-[#E2E6EC]">
            <tr>
              <th className="py-3 px-4">접수일시 / 고객명</th>
              <th className="py-3 px-4">구분 / 제목</th>
              <th className="py-3 px-4">Telegram 알림 상태</th>
              <th className="py-3 px-4">알림톡 연동 상태</th>
              <th className="py-3 px-4 text-right">수동 발송 / 재시도</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E6EC]">
            {inquiries
              .filter((i) => !i.is_notice)
              .slice(0, 15)
              .map((inq) => {
                const tg = notificationLogs[`telegram:${inq.id}`];
                const alim = notificationLogs[`alimtalk:${inq.id}`];
                return (
                  <tr key={inq.id}>
                    <td className="py-3 px-4">
                      <strong className="text-[#141A23]">{inq.name}</strong>
                      <span className="block text-hb-xs text-[#64748B]">
                        {new Date(inq.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-hb-xs font-bold text-[#E8521A] block">
                        {inq.inquiry_type}
                      </span>
                      <span className="truncate block max-w-xs">
                        {inq.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {tg ? (
                        <div>
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-hb-xs font-bold ${
                              tg.sent
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {tg.statusLabel}
                          </span>
                          <p className="mt-1 text-hb-xs text-[#6B7280]">
                            {tg.message}
                          </p>
                        </div>
                      ) : (
                        <span className="text-hb-xs text-[#64748B]">
                          발송 대기 / 이력 미조회
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {alim ? (
                        <div>
                          <span className="inline-block rounded bg-neutral-200 px-2 py-0.5 text-hb-xs font-bold text-neutral-700">
                            {alim.statusLabel}
                          </span>
                          <p className="mt-1 text-hb-xs text-[#6B7280]">
                            {alim.message}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-block rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-hb-xs font-bold text-amber-800">
                          연동 준비중 (Telegram 활성)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={busyActionId === `notify-telegram-${inq.id}`}
                        onClick={() => onManualDispatch("telegram", inq)}
                        className="rounded bg-[#141A23] px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-[#1E2736] disabled:opacity-50"
                      >
                        Telegram 재발송
                      </button>
                      <button
                        type="button"
                        disabled={busyActionId === `notify-alimtalk-${inq.id}`}
                        onClick={() => onManualDispatch("alimtalk", inq)}
                        className="rounded border border-[#E2E6EC] bg-white px-3 py-1.5 text-hb-xs font-bold text-[#4B5260] hover:bg-[#F9FAFB] disabled:opacity-50"
                      >
                        알림톡 상태 점검
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
