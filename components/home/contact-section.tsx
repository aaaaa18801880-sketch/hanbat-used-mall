"use client";

import React, { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import {
  compressImage,
  formatPhone,
  INQUIRY_TYPES,
  type InquiryTypeValue,
  isValidPhone,
  maskName,
  MAX_FILE_MB,
  MAX_PHOTOS,
  STORAGE_BUCKETS,
  STORE,
  telHref,
} from "../../lib/site";
import { Icon, ICON, SectionHeading } from "../../lib/ui";

export type RecentInquiryRow = {
  id: string | number;
  inquiry_type: string | null;
  category: string | null;
  name: string | null;
  masked_name?: string | null;
  status: string | null;
  is_notice: boolean | null;
  created_at: string;
};

const shortTypeLabel = (t?: string | null) =>
  t === "내 물건 팔기" || t === "내 물건팔기" || t === "매입문의"
    ? "매입"
    : t === "구매 문의" || t === "구매문의"
    ? "구매"
    : "기타";

export function ContactSection({
  inquiryType,
  setInquiryType,
  prefillTitle,
  recentInquiries,
  onSubmitted,
}: {
  inquiryType: InquiryTypeValue;
  setInquiryType: (t: InquiryTypeValue) => void;
  prefillTitle?: string;
  recentInquiries: RecentInquiryRow[];
  onSubmitted: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState(prefillTitle || "");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (prefillTitle) {
      setTitle(prefillTitle);
    }
  }, [prefillTitle]);

  const isSell = inquiryType === "내 물건 팔기";

  const handlePickFiles = (list: FileList | null) => {
    if (!list) return;
    const valid = Array.from(list).filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error("이미지 파일만 첨부할 수 있습니다.");
        return false;
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${MAX_FILE_MB}MB 이하 사진만 첨부할 수 있습니다.`);
        return false;
      }
      return true;
    });

    const next = [...files, ...valid].slice(0, MAX_PHOTOS);
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles((f) => f.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setTitle("");
    setModel("");
    setDescription("");
    setPassword("");
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
    setAgree(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("성함을 입력해 주세요.");
    if (!isValidPhone(phone)) return toast.error("연락처를 정확히 입력해 주세요.");
    if (!title.trim())
      return toast.error(
        isSell ? "매입 받을 품목을 입력해 주세요." : "문의하실 품목을 입력해 주세요."
      );
    if (!description.trim()) return toast.error("문의 내용을 입력해 주세요.");
    if (password.trim().length < 4)
      return toast.error("조회용 비밀번호를 4자리 이상 입력해 주세요.");
    if (!agree) return toast.error("개인정보 수집·이용에 동의해 주세요.");

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const f of files) {
        const blob = await compressImage(f, 1600, 0.82);
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        uploadedUrls.push(
          supabase.storage.from(STORAGE_BUCKETS.inquiries).getPublicUrl(fileName)
            .data.publicUrl
        );
      }

      const finalDescription = model.trim()
        ? `[모델명] ${model.trim()}\n\n${description.trim()}`
        : description.trim();

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          password: password.trim(),
          inquiry_type: inquiryType,
          category: title.trim(),
          model: model.trim() || null,
          region: "대전/기타",
          description: finalDescription,
          images: uploadedUrls,
          is_notice: false,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "문의 등록에 실패했습니다.");
      }

      fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          type: inquiryType,
          title: title.trim(),
        }),
      }).catch(() => {});

      toast.success("문의가 접수되었습니다. 확인 후 빠르게 연락드리겠습니다.");
      resetForm();
      onSubmitted();
    } catch (err: any) {
      toast.error(
        err.message || "접수 중 오류가 발생했습니다. 전화로 문의해 주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="inquiry-section"
      aria-labelledby="contact-heading"
      className="bg-[#F6F5F2] py-16 sm:py-20 lg:py-24"
    >
      <div className="hb-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Online Inquiry"
            title={<span id="contact-heading">판매 · 매입 통합 상담 신청</span>}
            desc="찾으시는 제품이나 처분하실 가전 정보를 남겨주시면 담당자가 확인 후 연락드립니다."
          />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* 좌측: 통합 문의 폼 */}
          <div
            id="inquiry-form"
            className="scroll-mt-24 rounded-md border border-[#E4E0D8] bg-white p-6 sm:p-8 lg:col-span-7"
          >
            <form onSubmit={handleSubmit} noValidate>
              <fieldset>
                <legend className="hb-label">문의 구분 선택</legend>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-md bg-[#F2F0EC] p-1.5">
                  {INQUIRY_TYPES.map((t) => (
                    <label
                      key={t}
                      className={`flex h-11 cursor-pointer items-center justify-center rounded text-[13.5px] sm:text-[14px] font-bold transition-colors ${
                        inquiryType === t
                          ? "bg-[#0E1A2B] text-white shadow-2xs"
                          : "text-[#4B5260] hover:text-[#0E1A2B]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="inquiry-type"
                        value={t}
                        checked={inquiryType === t}
                        onChange={() => setInquiryType(t)}
                        className="sr-only"
                      />
                      {t === "내 물건 팔기" ? "매입 신청(팔기)" : t}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="iq-name" className="hb-label">
                    성함 / 상호명 *
                  </label>
                  <input
                    id="iq-name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="hb-input mt-1.5"
                  />
                </div>
                <div>
                  <label htmlFor="iq-phone" className="hb-label">
                    연락처 *
                  </label>
                  <input
                    id="iq-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    className="hb-input mt-1.5"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                <div>
                  <label htmlFor="iq-title" className="hb-label">
                    {isSell ? "매입 신청할 품목 *" : "찾으시는 품목 *"}
                  </label>
                  <input
                    id="iq-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      isSell
                        ? "예: 업소용 45박스 냉장고 2대"
                        : "예: 스탠드 냉난방기 15평형"
                    }
                    className="hb-input mt-1.5"
                  />
                </div>
                <div>
                  <label htmlFor="iq-model" className="hb-label">
                    모델명{" "}
                    <span className="font-normal text-[#6B7280]">(선택)</span>
                  </label>
                  <input
                    id="iq-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="아시는 경우 입력"
                    className="hb-input mt-1.5"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="iq-desc" className="hb-label">
                  상세 문의 내용 *
                </label>
                <textarea
                  id="iq-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isSell
                      ? "사용 기간, 작동 상태, 수거 희망 지역 및 일정을 적어주세요."
                      : "필요한 용량·규격, 배송 희망 지역, 설치 여건 등을 적어주세요."
                  }
                  className="hb-input mt-1.5 resize-none leading-relaxed"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 items-start">
                <div>
                  <p className="hb-label">
                    사진 첨부{" "}
                    <span className="font-normal text-[#6B7280]">
                      (최대 {MAX_PHOTOS}장)
                    </span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {previews.map((src, i) => (
                      <div
                        key={src}
                        className="relative h-16 w-16 overflow-hidden rounded border border-[#DDD9D1] bg-[#EFECE6]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`첨부 사진 ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          aria-label="첨부 사진 삭제"
                          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/65 text-white"
                        >
                          <Icon d={ICON.close} className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {files.length < MAX_PHOTOS && (
                      <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-[#CFCAC0] text-[11px] font-semibold text-[#6B7280] hover:border-[#0E1A2B] hover:text-[#0E1A2B]">
                        <Icon d={ICON.camera} className="w-4 h-4" />
                        <span>추가</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(e) => {
                            handlePickFiles(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="iq-pw" className="hb-label">
                    조회용 비밀번호 *{" "}
                    <span className="font-normal text-[#6B7280]">
                      (4자리 이상)
                    </span>
                  </label>
                  <input
                    id="iq-pw"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="문의게시판 내 글 확인용"
                    className="hb-input mt-1.5"
                  />
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-[#4B5260]">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#0E1A2B]"
                />
                <span>
                  견적 및 재고 상담을 위해 성함·연락처·문의 내용을 수집하며,{" "}
                  <Link
                    href="/privacy"
                    className="font-bold text-[#0E1A2B] underline underline-offset-2"
                  >
                    개인정보 수집·이용
                  </Link>
                  에 동의합니다. *
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="hb-btn-accent mt-6 h-13 w-full py-3.5 text-[16px]"
              >
                {submitting
                  ? "문의 접수 중..."
                  : isSell
                  ? "무료 매입 견적 요청하기"
                  : "상담 문의 접수하기"}
              </button>
            </form>
          </div>

          {/* 우측: 빠른 직통 상담 카드 & 최근 문의 현황 */}
          <aside className="flex flex-col gap-6 lg:col-span-5">
            <div className="rounded-md bg-[#0E1A2B] p-6 text-white sm:p-8">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF8A50]">
                Direct Contact
              </p>
              <h3 className="mt-2 text-[20px] font-bold">
                전화와 카카오톡으로 바로 물어보세요
              </h3>
              <p className="mt-1.5 text-[14px] text-white/75">
                급한 재고 확인이나 당일 방문 수거 일정은 전화 또는 카카오톡이 가장 빠릅니다.
              </p>

              <div className="mt-5 space-y-2 border-y border-white/15 py-4">
                <a
                  href={telHref(STORE.tel)}
                  className="block text-[26px] font-bold tracking-tight text-white hover:text-[#FF8A50]"
                >
                  {STORE.tel}
                </a>
                <a
                  href={telHref(STORE.mobile)}
                  className="block text-[17px] font-semibold text-white/85 hover:text-[#FF8A50]"
                >
                  휴대전화: {STORE.mobile}
                </a>
                <p className="text-[13px] text-white/65 pt-1">
                  {STORE.hours} · {STORE.closed}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <a
                  href={telHref(STORE.tel)}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-white text-[14px] font-bold text-[#0E1A2B] hover:bg-neutral-100"
                >
                  <Icon d={ICON.phone} className="w-4 h-4 text-[#D9531E]" />
                  <span>전화 걸기</span>
                </a>
                <a
                  href={STORE.kakaoChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hb-btn-kakao h-11 text-[14px]"
                >
                  <Icon d={ICON.chat} className="w-4 h-4" />
                  <span>카톡 채널 상담</span>
                </a>
              </div>
            </div>

            <div className="flex-1 rounded-md border border-[#E4E0D8] bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[#0E1A2B]">
                  최근 접수된 문의 현황
                </h3>
                <Link
                  href="/inquiry"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4B5260] hover:text-[#0E1A2B]"
                >
                  <span>전체 게시판 보기</span>
                  <Icon d={ICON.right} className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentInquiries.length === 0 ? (
                <p className="mt-6 text-[14px] text-[#8A8478]">
                  최근 접수된 문의 내역이 없습니다.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-[#EEEBE5]">
                  {recentInquiries.map((row) => {
                    const badge = shortTypeLabel(row.inquiry_type);
                    const done =
                      row.status === "답변완료" || row.status === "매입완료";
                    return (
                      <li
                        key={row.id}
                        className="flex items-center gap-3 py-3 text-[14px]"
                      >
                        <span
                          className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-bold ${
                            badge === "매입"
                              ? "bg-[#FBE9E1] text-[#B5431A]"
                              : "bg-[#E8ECF2] text-[#0E1A2B]"
                          }`}
                        >
                          {badge}
                        </span>
                        <Link
                          href="/inquiry"
                          className="min-w-0 flex-1 truncate font-medium text-[#1F2530] hover:text-[#D9531E]"
                        >
                          {row.category || "상담 문의"}
                        </Link>
                        <span className="shrink-0 text-[12px] text-[#6B7280]">
                          {row.masked_name || maskName(row.name)}
                        </span>
                        <span
                          className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-bold ${
                            done
                              ? "bg-[#0E1A2B] text-white"
                              : "bg-[#F0EDE7] text-[#4B5260]"
                          }`}
                        >
                          {row.status || "접수"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
